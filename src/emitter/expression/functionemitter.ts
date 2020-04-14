import { createGCAllocate } from "@builtins";
import { LLVMGenerator } from "@generator";
import { FunctionMangler, getDeclarationBaseName, TypeMangler } from "@mangling";
import { Scope } from "@scope";
import { createLLVMFunction, error, getAliasedSymbolIfNecessary, getDeclarationNamespace, getLLVMType, getStructType, isMethodReference, isValueType, keepInsertionPoint,  } from "@utils";
import * as llvm from "llvm-node";
import R = require("ramda");
import * as ts from "typescript";

type FunctionLikeDeclaration =
    | ts.FunctionDeclaration
    | ts.MethodDeclaration
    | ts.MethodSignature
    | ts.IndexSignatureDeclaration
    | ts.PropertyDeclaration
    | ts.ConstructorDeclaration;
type CallOrNewExpression = ts.CallExpression | ts.NewExpression;
type ArrayRelatedExpressions = ts.ArrayLiteralExpression | ts.ElementAccessExpression | ts.Expression;

export class FunctionEmitter {
    getOrEmitFunctionForCall(
        declaration: ts.Declaration,
        expression:
            | ts.CallExpression
            | ts.NewExpression
            | ts.ArrayLiteralExpression
            | ts.ElementAccessExpression
            | ts.Expression,
        thisType: ts.Type | undefined,
        argumentTypes: ts.Type[],
        generator: LLVMGenerator
    ) {
        if (
            !ts.isFunctionDeclaration(declaration) &&
            !ts.isMethodDeclaration(declaration) &&
            !ts.isMethodSignature(declaration) &&
            !ts.isIndexSignatureDeclaration(declaration) &&
            !ts.isPropertyDeclaration(declaration) &&
            !ts.isConstructorDeclaration(declaration)
        ) {
            return error(
                `Invalid function call target '${getDeclarationBaseName(declaration)}' (${ts.SyntaxKind[declaration.kind]})`
            );
        }

        return keepInsertionPoint(generator.builder, () => {
            return this.emitFunctionDeclaration(declaration, expression, thisType, argumentTypes, generator);
        });
    }

    emitCallExpression(expression: ts.CallExpression, generator: LLVMGenerator): llvm.Value {
        const argumentTypes = expression.arguments.map(generator.checker.getTypeAtLocation);
        const isMethod = isMethodReference(expression.expression, generator.checker);
        const symbol = generator.checker.getSymbolAtLocation(expression.expression);
        const declaration = getAliasedSymbolIfNecessary(symbol!, generator.checker).valueDeclaration;
        let thisType: ts.Type | undefined;
        if (isMethod) {
            const methodReference = expression.expression as ts.PropertyAccessExpression;
            thisType = generator.checker.getTypeAtLocation(methodReference.expression);
        }

        const callee = this.getOrEmitFunctionForCall(declaration, expression, thisType, argumentTypes, generator)
            .functionDeclaration!;

        const args = expression.arguments.map(argument => generator.emitExpression(argument));

        if (isMethod) {
            const propertyAccess = expression.expression as ts.PropertyAccessExpression;
            args.unshift(generator.emitExpression(propertyAccess.expression));
        }

        return generator.builder.createCall(callee, args);
    }


    emitNewExpression(expression: ts.NewExpression, generator: LLVMGenerator): llvm.Value {
        const symbol = generator.checker.getSymbolAtLocation(expression.expression);
        const declaration = getAliasedSymbolIfNecessary(symbol!, generator.checker).valueDeclaration;

        if (!ts.isClassDeclaration(declaration)) {
            return error("Cannot 'new' non-class type");
        }

        const constructorDeclaration = declaration.members.find(ts.isConstructorDeclaration);

        if (!constructorDeclaration) {
            return error("Calling 'new' requires the type to have a constructor");
        }

        const argumentTypes = expression.arguments!.map(generator.checker.getTypeAtLocation);

        const thisType = generator.checker.getTypeAtLocation(expression);
        const mangledTypename: string = TypeMangler.mangle(thisType, generator.checker);
        const preExisting = generator.module.getTypeByName(mangledTypename);
        if (!preExisting) {
            const type = getStructType(thisType as ts.ObjectType, expression, generator);
            const scope = new Scope(mangledTypename, { declaration, type });
            generator.symbolTable.currentScope.set(mangledTypename, scope);

            for (const method of declaration.members.filter(member => !ts.isPropertyDeclaration(member))) {
                generator.emitNode(method, scope);
            }
        }

        const { functionDeclaration, isExternalSymbol, thisValue } = keepInsertionPoint(generator.builder, () => {
            return this.emitFunctionDeclaration(constructorDeclaration, expression, thisType, argumentTypes, generator);
        });

        const args = expression.arguments!.map(argument => generator.emitExpression(argument));
        if (isExternalSymbol && thisValue) {
            args.unshift(thisValue);
        }

        return generator.builder.createCall(functionDeclaration!, args);
    }

    emitFunctionDeclaration(
        declaration: FunctionLikeDeclaration,
        expression: CallOrNewExpression | ArrayRelatedExpressions,
        tsThisType: ts.Type | undefined,
        argumentTypes: ts.Type[],
        generator: LLVMGenerator
    ): { functionDeclaration: llvm.Function | undefined, isExternalSymbol: boolean, thisValue: llvm.Value | undefined } {
        const parentScope = this.getFunctionDeclarationScope(declaration, tsThisType, generator);
        const isConstructor = ts.isConstructorDeclaration(declaration);
        const thisType = tsThisType ? parentScope.data!.type
            : undefined;
        let thisValue: llvm.Value | undefined;

        let tsReturnType: ts.Type | undefined;
        if (ts.isElementAccessExpression(expression)) {
            tsReturnType = generator.checker.getIndexTypeOfType(tsThisType!, ts.IndexKind.Number)!;
        } else if (ts.isArrayLiteralExpression(expression)) {
            tsReturnType = generator.checker.getTypeAtLocation(expression);
        } else if (ts.isPropertyDeclaration(declaration)) { // ### TODO
            tsReturnType = generator.checker.getTypeFromTypeNode(declaration.type!);
        } else if (ts.isCallExpression(expression) || ts.isNewExpression(expression)) {
            const resolvedSignature = generator.checker.getResolvedSignature(expression)!;
            tsReturnType = generator.checker.getReturnTypeOfSignature(resolvedSignature);
        } else {
            tsReturnType = generator.checker.getTypeAtLocation(expression);
        }

        const { isExternalSymbol, qualifiedName } = FunctionMangler.mangle(declaration, expression, tsThisType, argumentTypes, generator.checker);

        const preExisting = generator.module.getFunction(qualifiedName);

        if (preExisting) {
            if (isConstructor && isExternalSymbol) {
                thisValue = createGCAllocate(thisType!, generator);
            }
            return {
                functionDeclaration: preExisting,
                isExternalSymbol,
                thisValue
            };
        }

        const hasThisParameter =
            ts.isMethodDeclaration(declaration) ||
            ts.isMethodSignature(declaration) ||
            ts.isIndexSignatureDeclaration(declaration) ||
            ts.isPropertyDeclaration(declaration) ||
            (isConstructor && isExternalSymbol);

        let returnType = isConstructor ? thisType!.getPointerTo() : getLLVMType(tsReturnType!, expression!, generator);
        if (ts.isIndexSignatureDeclaration(declaration)) {
            returnType = returnType.getPointerTo();
        }
        const parameterTypes = argumentTypes.map(argumentType => getLLVMType(argumentType, expression, generator));
        if (hasThisParameter) {
            parameterTypes.unshift(isValueType(thisType!) ? thisType! : thisType!.getPointerTo());
        }

        const func = createLLVMFunction(returnType, parameterTypes, qualifiedName, generator.module);
        const body =
            ts.isMethodSignature(declaration) ||
                ts.isIndexSignatureDeclaration(declaration) ||
                ts.isPropertyDeclaration(declaration)
                ? undefined
                : declaration.body;

        if (isConstructor && !body) {
            if (!isExternalSymbol) {
                return error(`Constructor declared but its external symbol not found ${qualifiedName}`);
            }
            thisValue = createGCAllocate(thisType!, generator);
        }

        if (body) {
            generator.symbolTable.inLocalScope(qualifiedName, bodyScope => {
                const parameterNames = ts.isPropertyDeclaration(declaration)
                    ? []
                    : generator.checker.getSignatureFromDeclaration(declaration)!.parameters.map(parameter => parameter.name);

                if (hasThisParameter) {
                    parameterNames.unshift("this");
                }
                for (const [parameterName, argument] of R.zip(parameterNames, func.getArguments())) {
                    argument.name = parameterName;
                    bodyScope.set(parameterName, argument);
                }

                const entryBlock = llvm.BasicBlock.create(generator.context, "entry", func);
                generator.builder.setInsertionPoint(entryBlock);

                if (isConstructor) {
                    thisValue = createGCAllocate(thisType!, generator);
                    bodyScope.set("this", thisValue);
                }

                body.forEachChild(node => generator.emitNode(node, bodyScope));

                if (!generator.builder.getInsertBlock()?.getTerminator()) {
                    if (returnType.isVoidTy()) {
                        generator.builder.createRetVoid();
                    } else if (isConstructor) {
                        generator.builder.createRet(thisValue!);
                    } else {
                        // TODO: Emit LLVM 'unreachable' instruction.
                    }
                }
            });
        }

        llvm.verifyFunction(func);
        parentScope.set(qualifiedName, func);
        return {
            functionDeclaration: func,
            isExternalSymbol,
            thisValue
        }
    }

    private getFunctionDeclarationScope(
        declaration: FunctionLikeDeclaration,
        thisType: ts.Type | undefined,
        generator: LLVMGenerator
    ): Scope {
        const namespace: string[] = getDeclarationNamespace(declaration);

        if (thisType) {
            const typename = TypeMangler.mangle(thisType, generator.checker, declaration);
            const qualifiedName = namespace.concat(typename).join('.');
            return generator.symbolTable.get(qualifiedName) as Scope;
        }

        const { parent } = declaration;
        if (ts.isSourceFile(parent)) {
            return generator.symbolTable.globalScope;
        } else if (ts.isModuleBlock(parent)) {
            return generator.symbolTable.get(namespace.join('.')) as Scope;
        } else {
            return error(`Unhandled function declaration parent kind '${ts.SyntaxKind[parent.kind]}'`);
        }
    }
}

import {
  adjustLLVMValueToType,
  checkIfFunction,
  correctCppPrimitiveType,
  createLLVMFunction,
  createTSObjectName,
  error,
  getAliasedSymbolIfNecessary,
  getLLVMType,
  getLLVMTypename,
  getTSObjectPropsFromName,
  getTypeGenericArguments,
  isClosure,
  isIntersectionLLVMType,
  isUnionLLVMType,
  tryResolveGenericTypeIfNecessary,
  withObjectProperties,
  zip,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { createArrayConstructor, createArrayPush, getArrayType } from "@handlers";

export class LiteralHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        return this.handleBooleanLiteral(expression as ts.BooleanLiteral);
      case ts.SyntaxKind.NumericLiteral:
        return this.handleNumericLiteral(expression as ts.NumericLiteral);
      case ts.SyntaxKind.StringLiteral:
        return this.handleStringLiteral(expression as ts.StringLiteral);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.handleObjectLiteralExpression(expression as ts.ObjectLiteralExpression, env);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.handleArrayLiteralExpression(expression as ts.ArrayLiteralExpression, env);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleBooleanLiteral(expression: ts.BooleanLiteral): llvm.Value {
    const allocated = this.generator.gc.allocate(llvm.Type.getIntNTy(this.generator.context, 1));
    if (expression.kind === ts.SyntaxKind.TrueKeyword) {
      this.generator.xbuilder.createSafeStore(llvm.ConstantInt.getTrue(this.generator.context), allocated);
    } else {
      this.generator.xbuilder.createSafeStore(llvm.ConstantInt.getFalse(this.generator.context), allocated);
    }
    return allocated;
  }

  private handleNumericLiteral(expression: ts.NumericLiteral): llvm.Value {
    const allocated = this.generator.gc.allocate(llvm.Type.getDoublePtrTy(this.generator.context));
    const value = llvm.ConstantFP.get(this.generator.context, parseFloat(expression.text));
    this.generator.xbuilder.createSafeStore(value, allocated);
    return allocated;
  }

  private handleStringLiteral(expression: ts.StringLiteral): llvm.Value {
    const llvmThisType = this.generator.builtinString.getLLVMType();
    const constructor = this.generator.builtinString.getLLVMConstructor(expression);
    const ptr = this.generator.builder.createGlobalStringPtr(expression.text);
    const allocated = this.generator.gc.allocate(llvmThisType.elementType);
    this.generator.xbuilder.createSafeCall(constructor, [allocated, ptr]);
    return allocated;
  }

  private handleObjectLiteralExpression(expression: ts.ObjectLiteralExpression, env?: Environment): llvm.Value {
    const llvmValues = new Map<string, llvm.Value>();
    expression.properties.forEach((property) => {
      switch (property.kind) {
        case ts.SyntaxKind.PropertyAssignment:
          llvmValues.set(property.name.getText(), this.generator.handleExpression(property.initializer, env));
          break;
        case ts.SyntaxKind.ShorthandPropertyAssignment:
          llvmValues.set(property.name.getText(), this.generator.handleExpression(property.name, env));
          break;
        case ts.SyntaxKind.SpreadAssignment:
          let propertyType = this.generator.checker.getTypeAtLocation(property.expression);
          propertyType = tryResolveGenericTypeIfNecessary(propertyType, this.generator);

          const propertyValue = this.generator.handleExpression(property.expression, env);
          if (!propertyValue.type.isPointerTy()) {
            error(`Expected spread initializer to be of PointerType, got ${propertyValue.type.toString()}`);
          }
          if (!propertyValue.type.elementType.isStructTy()) {
            error(
              `Expected spread initializer element type to be of StructType, got ${propertyValue.type.elementType.toString()}`
            );
          }

          const names = [];
          if (isIntersectionLLVMType(propertyValue.type)) {
            const name = getLLVMTypename(propertyValue.type);
            const intersectionMeta = this.generator.meta.getIntersectionMeta(name);
            names.push(...intersectionMeta.props);
          } else {
            if (propertyValue.name) {
              // Try to handle propertyValue as a plain TS object. Its name is in format: %random__object__prop1.prop2.propN
              const props = getTSObjectPropsFromName(propertyValue.name);
              names.push(...props);
            } else {
              const name = getLLVMTypename(propertyValue.type);
              const structMeta = this.generator.meta.getStructMeta(name);
              names.push(...structMeta.props);
            }
          }

          for (let i = 0; i < propertyValue.type.elementType.numElements; ++i) {
            const value = this.generator.builder.createLoad(
              this.generator.xbuilder.createSafeInBoundsGEP(propertyValue, [0, i])
            );

            value.name = names[i];
            llvmValues.set(names[i], value);
          }

          break;
        default:
          error(`Unreachable '${ts.SyntaxKind[property.kind]}'`);
      }
    });

    const types = Array.from(llvmValues.values()).map((value) => value.type);
    const objectType = llvm.StructType.get(this.generator.context, types);
    const object = this.generator.gc.allocate(objectType);

    Array.from(llvmValues.values()).forEach((value, index) => {
      const destinationPtr = this.generator.xbuilder.createSafeInBoundsGEP(object, [0, index]);
      this.generator.xbuilder.createSafeStore(value, destinationPtr);
    });

    object.name = createTSObjectName(Array.from(llvmValues.keys()));

    const objectPropertyTypesName = withObjectProperties(expression, (property: ts.ObjectLiteralElementLike) => {
      if (!property.name) {
        return;
      }

      let propertyType = this.generator.checker.getTypeAtLocation(property);
      let propertyTypename = "";
      if (checkIfFunction(propertyType)) {
        // @todo: There should be a better way to get actual signature for generic functions.
        let symbol = propertyType.symbol;
        symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);
        const valueDeclaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;

        const signature = this.generator.checker.getSignatureFromDeclaration(
          valueDeclaration as ts.SignatureDeclaration
        )!;
        let returnType = this.generator.checker.getReturnTypeOfSignature(signature);
        returnType = tryResolveGenericTypeIfNecessary(returnType, this.generator);
        const parameters = signature.getParameters();
        const resolvedParameterTypes = parameters.map((parameter) => {
          const parameterDeclaration = parameter.declarations[0];
          const unresolved = this.generator.checker.getTypeAtLocation(parameterDeclaration);
          const resolved = tryResolveGenericTypeIfNecessary(unresolved, this.generator);
          return resolved;
        });

        propertyTypename += "(";
        resolvedParameterTypes.forEach((type, index) => {
          propertyTypename += parameters[index].getName() + ": " + this.generator.checker.typeToString(type);
        });
        propertyTypename += ") => ";
        propertyTypename += this.generator.checker.typeToString(returnType);
      } else {
        propertyType = tryResolveGenericTypeIfNecessary(propertyType, this.generator);
        propertyTypename = this.generator.checker.typeToString(propertyType);
      }

      return property.name!.getText() + "__" + propertyTypename;
    })
      .filter(Boolean)
      .join(",");

    this.generator.symbolTable.addObjectName(objectPropertyTypesName);

    return object;
  }

  private checkIfSupportedReturn(expression: ts.Expression, llvmReturnType: llvm.Type) {
    if (ts.isFunctionExpression(expression)) {
      error("Function values in return are not supported");
    }

    if (isUnionLLVMType(llvmReturnType)) {
      error("Unions in return are not supported");
    }

    if (isIntersectionLLVMType(llvmReturnType)) {
      error("Intersections in return are not supported");
    }
  }

  private handleFunctionBody(
    llvmReturnType: llvm.Type,
    thisType: ts.Type | undefined,
    declaration: ts.FunctionLikeDeclaration,
    fn: llvm.Function
  ): void {
    this.generator.withInsertBlockKeeping(() => {
      this.generator.symbolTable.withLocalScope((bodyScope) => {
        const parameters = this.generator.checker.getSignatureFromDeclaration(declaration)!.parameters;
        const parameterNames = parameters.map((parameter) => parameter.name);

        if (thisType) {
          parameterNames.unshift("this");
        }
        for (const [parameterName, argument] of zip(parameterNames, fn.getArguments())) {
          argument.name = parameterName;
          bodyScope.set(parameterName, argument);
        }

        const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", fn);
        this.generator.builder.setInsertionPoint(entryBlock);

        if (ts.isBlock(declaration.body!) && declaration.body!.statements.length > 0) {
          declaration.body!.forEachChild((node) => {
            if (ts.isReturnStatement(node) && node.expression) {
              this.checkIfSupportedReturn(node.expression, llvmReturnType);
              let returnValue = this.generator.handleExpression(node.expression);
              if (!returnValue.type.equals(llvmReturnType)) {
                returnValue = adjustLLVMValueToType(returnValue, llvmReturnType, this.generator);
              }
              this.generator.xbuilder.createSafeRet(returnValue);
              return;
            }

            this.generator.handleNode(node, bodyScope);
          });
        } else if (ts.isBlock(declaration.body!)) {
          // Empty block
          this.generator.builder.createRetVoid();
        } else {
          this.checkIfSupportedReturn(declaration.body! as ts.Expression, llvmReturnType);

          const blocklessArrowFunctionReturn = this.generator.handleExpression(declaration.body! as ts.Expression);

          if (blocklessArrowFunctionReturn.type.isVoidTy()) {
            this.generator.builder.createRetVoid();
          } else {
            this.generator.xbuilder.createSafeRet(blocklessArrowFunctionReturn);
          }
        }

        if (!this.generator.isCurrentBlockTerminated) {
          if (llvmReturnType.isVoidTy()) {
            this.generator.builder.createRetVoid();
          } else {
            error("No return statement in function returning non-void");
          }
        }
      }, this.generator.symbolTable.currentScope);
    });
  }

  private handleArrowFunctionOrFunctionExpression(expression: ts.ArrowFunction | ts.FunctionExpression): llvm.Value {
    const signature = this.generator.checker.getSignatureFromDeclaration(expression)!;
    const tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    const tsArgumentTypes = expression.parameters.map(this.generator.checker.getTypeAtLocation);
    const llvmReturnType = correctCppPrimitiveType(getLLVMType(tsReturnType, expression, this.generator));
    const llvmArgumentTypes = tsArgumentTypes.map((arg) => {
      return correctCppPrimitiveType(getLLVMType(arg, expression, this.generator));
    });

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, "", this.generator.module);

    this.handleFunctionBody(llvmReturnType, undefined, expression, fn);
    return fn;
  }

  private handleArrayLiteralExpression(expression: ts.ArrayLiteralExpression, env?: Environment): llvm.Value {
    const arrayType = getArrayType(expression, this.generator);
    const elementType = getTypeGenericArguments(arrayType)[0];

    const { constructor, allocated } = createArrayConstructor(expression, this.generator);
    this.generator.xbuilder.createSafeCall(constructor, [allocated]);

    const push = createArrayPush(elementType, expression, this.generator);
    for (const element of expression.elements) {
      if (ts.isArrowFunction(element) || ts.isFunctionExpression(element)) {
        const elementValue = this.handleArrowFunctionOrFunctionExpression(
          element as ts.ArrowFunction | ts.FunctionExpression
        );
        this.generator.xbuilder.createSafeCall(push, [allocated, elementValue]);
        continue;
      }

      const originalType = tryResolveGenericTypeIfNecessary(
        this.generator.checker.getApparentType(this.generator.checker.getTypeAtLocation(element)),
        this.generator
      );

      if (!originalType.symbol) {
        error(`Cannot find symbol for type '${this.generator.checker.typeToString(originalType)}'`);
      }

      const originalSymbol = getAliasedSymbolIfNecessary(originalType.symbol, this.generator.checker);
      const originalDeclaration = originalSymbol.declarations[0];

      if (ts.isFunctionTypeNode(originalDeclaration)) {
        // we have got declaration of parent function's parameter. get real original declaration,
        // then handle it

        let parentFunction = expression.parent;
        while (!ts.isFunctionLike(parentFunction)) {
          parentFunction = parentFunction.parent;
        }

        if (!parentFunction.name) {
          error(`'${parentFunction.getText()}' have to have a name`); // @todo
        }

        const realDeclaration = this.generator.meta.getClosureParameterDeclaration(
          parentFunction.name.getText(),
          element.getText()
        );

        if (ts.isArrowFunction(realDeclaration) || ts.isFunctionExpression(realDeclaration)) {
          const elementValue = this.handleArrowFunctionOrFunctionExpression(realDeclaration);
          this.generator.xbuilder.createSafeCall(push, [allocated, elementValue]);
          continue;
        } else {
          error(`Unexpected declaration of kind '${realDeclaration.kind}'`);
        }
      }

      let elementValue = this.generator.handleExpression(element, env);

      if (isClosure(elementValue)) {
        if (ts.isArrowFunction(originalDeclaration) || ts.isFunctionExpression(originalDeclaration)) {
          elementValue = this.handleArrowFunctionOrFunctionExpression(originalDeclaration);
          this.generator.xbuilder.createSafeCall(push, [allocated, elementValue]);
          continue;
        } else {
          error(`Unexpected closure declaration of kind '${originalDeclaration.kind}'`);
        }
      }

      elementValue = this.generator.createLoadIfNecessary(elementValue);

      this.generator.xbuilder.createSafeCall(push, [allocated, elementValue]);
    }

    return allocated;
  }
}

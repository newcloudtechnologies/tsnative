/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { LLVMGenerator } from "@generator";
import { FunctionMangler } from "@mangling";
import { setLLVMFunctionScope, addClassScope, Scope } from "@scope";
import {
  createLLVMFunction,
  error,
  getAliasedSymbolIfNecessary,
  getLLVMType,
  checkIfMethod,
  isValueTy,
  zip,
  isTypeDeclared,
  getGenericsToActualMapFromSignature,
  getArgumentTypes,
  getReturnType,
  handleFunctionArgument,
  tryResolveGenericTypeIfNecessary,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { getFunctionDeclarationScope } from "@handlers";
import { SysVFunctionHandler } from "./functionhandler_sysv";

export class FunctionHandler extends AbstractExpressionHandler {
  private readonly sysVFunctionHandler: SysVFunctionHandler;

  constructor(generator: LLVMGenerator) {
    super(generator);
    this.sysVFunctionHandler = new SysVFunctionHandler(generator);
  }

  handle(expression: ts.Expression): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PropertyAccessExpression:
        return this.handleGetAccessExpression(expression as ts.PropertyAccessExpression);
      case ts.SyntaxKind.CallExpression:
        return this.generator.symbolTable.withLocalScope(
          (_: Scope) => this.handleCallExpression(expression as ts.CallExpression),
          this.generator.symbolTable.currentScope
        );
      case ts.SyntaxKind.ArrowFunction:
        return this.handleArrowFunction(expression as ts.ArrowFunction);
      case ts.SyntaxKind.NewExpression:
        return this.handleNewExpression(expression as ts.NewExpression);
      case ts.SyntaxKind.FunctionExpression:
        return this.handleFunctionExpression(expression as ts.FunctionExpression);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression);
    }

    return;
  }

  private handleArrowFunction(expression: ts.ArrowFunction): llvm.Value {
    const signature = this.generator.checker.getSignatureFromDeclaration(expression)!;
    const tsReturnType: ts.Type = this.generator.checker.getReturnTypeOfSignature(signature);
    const tsArgumentTypes = expression.parameters.map(this.generator.checker.getTypeAtLocation);
    const llvmReturnType = getLLVMType(tsReturnType, expression, this.generator);
    const llvmArgumentTypes = tsArgumentTypes.map((arg) => getLLVMType(arg, expression, this.generator));

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, "", this.generator.module);

    this.handleFunctionBody(llvmReturnType, undefined, expression, fn);
    return fn;
  }

  private handleGetAccessExpression(expression: ts.PropertyAccessExpression): llvm.Value {
    const thisType = this.generator.checker.getTypeAtLocation(expression.expression);
    const symbol = this.generator.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol!.valueDeclaration as ts.GetAccessorDeclaration;

    const { isExternalSymbol, qualifiedName } = FunctionMangler.mangle(
      valueDeclaration,
      expression,
      thisType,
      [],
      this.generator
    );

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleGetAccessExpression(expression, qualifiedName);
    }

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = parentScope.thisData!.type;
    const returnType: ts.Type = this.generator.checker.getTypeAtLocation(expression);
    const llvmReturnType = getLLVMType(returnType, expression, this.generator);
    const llvmArgumentTypes = [isValueTy(llvmThisType) ? llvmThisType : llvmThisType.getPointerTo()];

    const { fn, existing } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
    );
    const body = valueDeclaration.body;
    if (body && !existing) {
      this.handleFunctionBody(llvmReturnType, thisType, valueDeclaration, fn);
      setLLVMFunctionScope(fn, parentScope);
    }

    const thisValue = this.generator.handleExpression(expression.expression);
    const args = [thisValue];

    return this.generator.builder.createCall(fn, args);
  }

  private handleCallExpression(expression: ts.CallExpression): llvm.Value {
    const functionName = expression.expression.getText();
    const inScopeFunction = this.generator.symbolTable.currentScope.tryGetThroughParentChain(functionName);
    if (inScopeFunction) {
      const args = expression.arguments.map((argument) => handleFunctionArgument(argument, this.generator));
      return this.generator.builder.createCall(this.generator.builder.createLoad(inScopeFunction as llvm.Value), args);
    }

    const argumentTypes = getArgumentTypes(expression, this.generator);
    const isMethod = checkIfMethod(expression.expression, this.generator.checker);
    let thisType: ts.Type | undefined;
    if (isMethod) {
      const methodReference = expression.expression as ts.PropertyAccessExpression;
      thisType = this.generator.checker.getTypeAtLocation(methodReference.expression);
    }

    const symbol = this.generator.checker.getTypeAtLocation(expression.expression).symbol;
    const valueDeclaration = getAliasedSymbolIfNecessary(symbol, this.generator.checker)
      .valueDeclaration as ts.FunctionLikeDeclaration;
    if (valueDeclaration.typeParameters?.length) {
      const signature = this.generator.checker.getSignatureFromDeclaration(
        valueDeclaration as ts.SignatureDeclaration
      )!;
      const map = getGenericsToActualMapFromSignature(signature, expression, this.generator);
      for (const typename in map) {
        if (map.hasOwnProperty(typename)) {
          const knownType = Boolean(this.generator.symbolTable.currentScope.tryGetThroughParentChain(typename));
          if (!knownType) {
            this.generator.symbolTable.currentScope.set(typename, map[typename]);
          }
        }
      }
    }

    const { isExternalSymbol, qualifiedName } = FunctionMangler.mangle(
      valueDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator
    );

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleCallExpression(expression, qualifiedName);
    }

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = thisType ? parentScope.thisData!.type : undefined;

    const returnType = getReturnType(expression, this.generator);

    const llvmReturnType = getLLVMType(returnType, expression, this.generator);
    const llvmArgumentTypes = argumentTypes.map((argumentType) => {
      const type = getLLVMType(argumentType, expression, this.generator);
      return isValueTy(type) ? type : type.getPointerTo();
    });

    if (llvmThisType) {
      llvmArgumentTypes.unshift(isValueTy(llvmThisType) ? llvmThisType : llvmThisType.getPointerTo());
    }

    const { fn, existing } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
    );
    const body = valueDeclaration.body;
    if (body && !existing) {
      this.handleFunctionBody(llvmReturnType, thisType!, valueDeclaration, fn);
      setLLVMFunctionScope(fn, parentScope);
    }

    const args = expression.arguments.map((argument) => handleFunctionArgument(argument, this.generator));

    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      const val = this.generator.handleExpression(propertyAccess.expression);
      args.unshift(val);
    }

    return this.generator.builder.createCall(fn, args);
  }

  private handleNewExpression(expression: ts.NewExpression): llvm.Value {
    const thisType = this.generator.checker.getTypeAtLocation(expression);
    const classDeclaration = getAliasedSymbolIfNecessary(thisType.symbol, this.generator.checker).valueDeclaration;

    if (!ts.isClassDeclaration(classDeclaration)) {
      return error("Expected class declaration");
    }

    const constructorDeclaration = classDeclaration.members.find(ts.isConstructorDeclaration);
    if (!constructorDeclaration) {
      return error(`No constructor provided: ${expression.getText()}`);
    }

    if (!isTypeDeclared(thisType, constructorDeclaration, this.generator)) {
      addClassScope(expression, this.generator.symbolTable.currentScope, this.generator);
    }

    const argumentTypes = expression.arguments?.map(this.generator.checker.getTypeAtLocation) || [];
    const { isExternalSymbol, qualifiedName } = FunctionMangler.mangle(
      constructorDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator
    );

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleNewExpression(expression, qualifiedName);
    }

    const parentScope = getFunctionDeclarationScope(classDeclaration, thisType, this.generator);
    const llvmThisType: llvm.PointerType = parentScope.thisData!.type as llvm.PointerType;

    const parameterTypes = argumentTypes.map((argumentType) => getLLVMType(argumentType, expression, this.generator));
    const { fn: constructor, existing } = createLLVMFunction(
      llvmThisType,
      parameterTypes,
      qualifiedName,
      this.generator.module
    );

    const body = constructorDeclaration.body;
    const args = expression.arguments?.map((argument) => handleFunctionArgument(argument, this.generator)) || [];

    if (body && !existing) {
      this.handleConstructorBody(llvmThisType, constructorDeclaration, constructor);
      setLLVMFunctionScope(constructor, parentScope);
    }

    return this.generator.builder.createCall(constructor, args);
  }

  private handleFunctionExpression(expression: ts.FunctionExpression) {
    const symbol = this.generator.checker.getTypeAtLocation(expression).symbol;
    const valueDeclaration = getAliasedSymbolIfNecessary(symbol, this.generator.checker)
      .valueDeclaration as ts.FunctionLikeDeclaration;
    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration)!;
    let tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    tsReturnType = tryResolveGenericTypeIfNecessary(tsReturnType, this.generator);

    const tsArgumentTypes = signature.getDeclaration().parameters.map((parameter) => {
      let tsType = this.generator.checker.getTypeFromTypeNode(parameter.type!);
      tsType = tryResolveGenericTypeIfNecessary(tsType, this.generator);
      return tsType;
    });

    const llvmReturnType = getLLVMType(tsReturnType, expression, this.generator);
    const llvmArgumentTypes = tsArgumentTypes.map((arg) => getLLVMType(arg, expression, this.generator));

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, "", this.generator.module);

    this.handleFunctionBody(llvmReturnType, undefined, expression, fn);
    return fn;
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

        const llvmArgs = fn.getArguments();

        declaration.body!.forEachChild((node) => {
          if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
            const functionName = node.expression.expression.getText();
            const idxInParameters = parameterNames.indexOf(functionName);
            if (idxInParameters > -1) {
              const fnArgs = node.expression.arguments.map((argument) =>
                handleFunctionArgument(argument, this.generator)
              );
              this.generator.builder.createCall(llvmArgs[idxInParameters], fnArgs);
              return;
            }
          }

          this.generator.handleNode(node, bodyScope);
        });

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

  private handleConstructorBody(
    llvmThisType: llvm.PointerType,
    constructorDeclaration: ts.FunctionLikeDeclaration,
    constructor: llvm.Function
  ): void {
    this.generator.withInsertBlockKeeping(() => {
      this.generator.symbolTable.withLocalScope((bodyScope: Scope) => {
        const parameterNames = this.generator.checker
          .getSignatureFromDeclaration(constructorDeclaration)!
          .parameters.map((parameter) => parameter.name);

        for (const [parameterName, argument] of zip(parameterNames, constructor.getArguments())) {
          argument.name = parameterName;
          bodyScope.set(parameterName, argument);
        }

        const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", constructor);
        this.generator.builder.setInsertionPoint(entryBlock);

        const thisValue = this.generator.gc.allocate(llvmThisType.elementType);
        bodyScope.set("this", thisValue);

        constructorDeclaration.body!.forEachChild((node) => this.generator.handleNode(node, bodyScope));

        this.generator.builder.createRet(thisValue);
      });
    });
  }
}

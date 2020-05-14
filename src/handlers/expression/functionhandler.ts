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
        return this.handleCallExpression(expression as ts.CallExpression);
      case ts.SyntaxKind.NewExpression:
        return this.handleNewExpression(expression as ts.NewExpression);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression);
    }

    return;
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
      this.generator.checker
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
    const argumentTypes = expression.arguments.map(this.generator.checker.getTypeAtLocation);
    const isMethod = checkIfMethod(expression.expression, this.generator.checker);

    let thisType: ts.Type | undefined;
    if (isMethod) {
      const methodReference = expression.expression as ts.PropertyAccessExpression;
      thisType = this.generator.checker.getTypeAtLocation(methodReference.expression);
    }

    const symbol = this.generator.checker.getTypeAtLocation(expression.expression).symbol;
    const valueDeclaration = getAliasedSymbolIfNecessary(symbol, this.generator.checker)
      .valueDeclaration as ts.FunctionLikeDeclaration;

    const { isExternalSymbol, qualifiedName } = FunctionMangler.mangle(
      valueDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator.checker
    );

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleCallExpression(expression, qualifiedName);
    }

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = thisType ? parentScope.thisData!.type : undefined;

    const resolvedSignature = this.generator.checker.getResolvedSignature(expression)!;
    const returnType: ts.Type = this.generator.checker.getReturnTypeOfSignature(resolvedSignature);

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

    const args = expression.arguments.map((argument) => this.generator.handleExpression(argument));

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
      return error("No constructor provided");
    }

    if (!isTypeDeclared(thisType, constructorDeclaration, this.generator)) {
      addClassScope(expression, this.generator.symbolTable.currentScope, this.generator);
    }

    const argumentTypes = expression.arguments!.map(this.generator.checker.getTypeAtLocation);
    const { isExternalSymbol, qualifiedName } = FunctionMangler.mangle(
      constructorDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator.checker
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
    const args = expression.arguments!.map((argument) => this.generator.handleExpression(argument));

    if (body && !existing) {
      this.handleConstructorBody(llvmThisType, constructorDeclaration, constructor);
      setLLVMFunctionScope(constructor, parentScope);
    }

    return this.generator.builder.createCall(constructor, args);
  }

  private handleFunctionBody(
    llvmReturnType: llvm.Type,
    thisType: ts.Type,
    declaration: ts.FunctionLikeDeclaration,
    fn: llvm.Function
  ): void {
    this.generator.withInsertBlockKeeping(() => {
      this.generator.symbolTable.withLocalScope((bodyScope) => {
        const parameterNames = ts.isPropertyDeclaration(declaration)
          ? []
          : this.generator.checker
              .getSignatureFromDeclaration(declaration)!
              .parameters.map((parameter) => parameter.name);

        if (thisType) {
          parameterNames.unshift("this");
        }
        for (const [parameterName, argument] of zip(parameterNames, fn.getArguments())) {
          argument.name = parameterName;
          bodyScope.set(parameterName, argument);
        }

        const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", fn);
        this.generator.builder.setInsertionPoint(entryBlock);

        declaration.body!.forEachChild((node) => this.generator.handleNode(node, bodyScope));

        if (!this.generator.isCurrentBlockTerminated) {
          if (llvmReturnType.isVoidTy()) {
            this.generator.builder.createRetVoid();
          } else {
            error("No return statement in function returning non-void");
          }
        }
      });
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

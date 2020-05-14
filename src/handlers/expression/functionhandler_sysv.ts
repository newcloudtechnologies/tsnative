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

import * as ts from "typescript";
import {
  checkIfReturnsValueType,
  getLLVMType,
  isValueTy,
  createLLVMFunction,
  error,
  getAliasedSymbolIfNecessary,
  checkIfMethod,
} from "@utils";
import { getFunctionDeclarationScope } from "@handlers";
import { LLVMGenerator } from "@generator";
import * as llvm from "llvm-node";

export class SysVFunctionHandler {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  handleGetAccessExpression(expression: ts.PropertyAccessExpression, qualifiedName: string): llvm.Value {
    const thisType = this.generator.checker.getTypeAtLocation(expression.expression);
    const symbol = this.generator.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol!.valueDeclaration as ts.GetAccessorDeclaration;

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = parentScope.thisData!.type;
    const returnType: ts.Type = this.generator.checker.getTypeAtLocation(expression);

    const llvmReturnType = getLLVMType(returnType, expression, this.generator);
    const llvmArgumentTypes = [isValueTy(llvmThisType) ? llvmThisType : llvmThisType.getPointerTo()];

    const returnsValue = checkIfReturnsValueType(valueDeclaration);
    if (returnsValue) {
      llvmArgumentTypes.unshift(llvmReturnType as llvm.PointerType);
    }

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
    const body = valueDeclaration.body;
    if (body) {
      return error(`External symbol '${qualifiedName}' cannot have function body`);
    }

    const thisValue = this.generator.handleExpression(expression.expression);
    const args = [thisValue];

    if (returnsValue) {
      const shadowReturnType = llvmReturnType.isPointerTy() ? llvmReturnType.elementType : llvmReturnType;
      const sret = this.generator.gc.allocate(shadowReturnType);
      args.unshift(sret);
    }

    if (returnsValue) {
      return args[0];
    }

    return this.generator.builder.createCall(fn, args);
  }

  handleCallExpression(expression: ts.CallExpression, qualifiedName: string): llvm.Value {
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

    const returnsValue: boolean = checkIfReturnsValueType(valueDeclaration);
    if (returnsValue) {
      llvmArgumentTypes.unshift(llvmReturnType);
    }

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
    if (valueDeclaration.body) {
      return error(`External symbol '${qualifiedName}' cannot have function body`);
    }

    const args = expression.arguments.map((argument) => this.generator.handleExpression(argument));

    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      const thisValue = this.generator.handleExpression(propertyAccess.expression);
      args.unshift(thisValue);
    }

    if (returnsValue) {
      const shadowReturnType = llvmReturnType.isPointerTy() ? llvmReturnType.elementType : llvmReturnType;
      const sret = this.generator.gc.allocate(shadowReturnType);
      args.unshift(sret);
      this.generator.builder.createCall(fn, args);
      return sret;
    }

    return this.generator.builder.createCall(fn, args);
  }

  handleNewExpression(expression: ts.NewExpression, qualifiedName: string): llvm.Value {
    const thisType = this.generator.checker.getTypeAtLocation(expression);
    const classDeclaration = getAliasedSymbolIfNecessary(thisType.symbol, this.generator.checker)
      .valueDeclaration as ts.ClassLikeDeclaration;
    const constructorDeclaration = classDeclaration.members.find(ts.isConstructorDeclaration)!;
    const argumentTypes = expression.arguments!.map(this.generator.checker.getTypeAtLocation);

    const parentScope = getFunctionDeclarationScope(classDeclaration, thisType, this.generator);
    const llvmThisType: llvm.PointerType = parentScope.thisData!.type as llvm.PointerType;

    const parameterTypes = argumentTypes.map((argumentType) => getLLVMType(argumentType, expression, this.generator));
    parameterTypes.unshift(llvmThisType);
    const { fn: constructor, existing } = createLLVMFunction(
      llvmThisType,
      parameterTypes,
      qualifiedName,
      this.generator.module
    );

    const body = constructorDeclaration.body;
    const args = expression.arguments!.map((argument) => this.generator.handleExpression(argument));

    let thisValue: llvm.Value | undefined;
    if (body && !existing) {
      return error(`External symbol '${qualifiedName}' cannot have constructor body`);
    }

    thisValue = this.generator.gc.allocate(llvmThisType.elementType);
    args.unshift(thisValue);
    this.generator.builder.createCall(constructor, args);
    return thisValue;
  }
}

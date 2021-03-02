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
  createLLVMFunction,
  error,
  getAliasedSymbolIfNecessary,
  checkIfMethod,
  getArgumentTypes,
  getReturnType,
  adjustLLVMValueToType,
  checkIfFunction,
  correctCppPrimitiveType,
  unwrapPointerType,
  isCppPrimitiveType,
  callerShouldAllocateSpace,
  checkIfObject,
  isTSClosure,
} from "@utils";
import { castFPToIntegralType, getFunctionDeclarationScope, isConvertible, promoteIntegralToFP } from "@handlers";
import { LLVMGenerator } from "@generator";
import * as llvm from "llvm-node";
import { Environment } from "@scope";
import { getIntegralType, isCppIntegralType, isSignedType } from "@cpp";

export class SysVFunctionHandler {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  handleGetAccessExpression(
    expression: ts.PropertyAccessExpression,
    qualifiedName: string,
    env?: Environment
  ): llvm.Value {
    const symbol = this.generator.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol!.valueDeclaration as ts.GetAccessorDeclaration;

    const returnType: ts.Type = this.generator.checker.getTypeAtLocation(expression);

    const llvmThisType = llvm.Type.getInt8PtrTy(this.generator.context);
    const llvmArgumentTypes = [llvmThisType];

    const returnsValue = checkIfReturnsValueType(valueDeclaration);
    let llvmReturnType = correctCppPrimitiveType(getLLVMType(returnType, expression, this.generator));
    if (returnsValue) {
      if (!unwrapPointerType(llvmReturnType).isVoidTy() && !isCppPrimitiveType(llvmReturnType)) {
        if (callerShouldAllocateSpace(llvmReturnType, returnType, this.generator)) {
          llvmArgumentTypes.unshift(llvmReturnType.isPointerTy() ? llvmReturnType : llvmReturnType.getPointerTo());
        } else {
          llvmReturnType = unwrapPointerType(llvmReturnType);
        }
      }
    }

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
    const body = valueDeclaration.body;
    if (body) {
      error(`External symbol '${qualifiedName}' cannot have function body`);
    }

    const thisValue = this.generator.handleExpression(expression.expression, env);
    const thisValueUntyped = this.generator.xbuilder.asVoidStar(thisValue);
    const args = [thisValueUntyped];

    if (returnsValue) {
      if (!unwrapPointerType(llvmArgumentTypes[0]).isVoidTy() && !isCppPrimitiveType(llvmReturnType)) {
        if (callerShouldAllocateSpace(llvmArgumentTypes[0], returnType, this.generator)) {
          const shadowReturnType = unwrapPointerType(llvmArgumentTypes[0]);
          const sret = this.generator.gc.allocate(shadowReturnType);
          args.unshift(sret);

          return this.generator.xbuilder.createSafeCall(fn, args);
        }
      }
    }

    const callResult = this.generator.xbuilder.createSafeCall(fn, args);

    if (callResult.type.isVoidTy()) {
      return callResult;
    }

    if (!returnsValue && callResult.type.isPointerTy()) {
      return callResult;
    }

    const allocated = this.generator.gc.allocate(unwrapPointerType(callResult.type));
    this.generator.xbuilder.createSafeStore(callResult, allocated);

    return allocated;
  }

  handleCallExpression(expression: ts.CallExpression, qualifiedName: string, env?: Environment): llvm.Value {
    const argumentTypes = getArgumentTypes(expression, this.generator);
    const isMethod = checkIfMethod(expression.expression, this.generator.checker);

    const symbol = this.generator.checker.getTypeAtLocation(expression.expression).symbol;
    const valueDeclaration = getAliasedSymbolIfNecessary(symbol, this.generator.checker)
      .valueDeclaration as ts.FunctionLikeDeclaration;

    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration);
    if (!signature) {
      error(`No signature found for '${expression.getText()}'`);
    }

    const parameters = signature.getParameters();
    const llvmArgumentTypes = argumentTypes.map((argumentType, index) => {
      if (checkIfObject(argumentType)) {
        return llvm.Type.getInt8PtrTy(this.generator.context);
      }

      if (checkIfFunction(argumentType)) {
        return llvm.Type.getInt8PtrTy(this.generator.context);
      }

      if (parameters[index]) {
        const tsParameterType = this.generator.checker.getTypeOfSymbolAtLocation(parameters[index], valueDeclaration);
        if (isCppIntegralType(this.generator.checker.typeToString(tsParameterType))) {
          return getIntegralType(tsParameterType, this.generator)!;
        }
      }

      const llvmType = getLLVMType(argumentType, expression, this.generator);
      return correctCppPrimitiveType(llvmType);
    });

    let args = expression.arguments.map((argument) => {
      const arg = this.generator.handleExpression(argument, env);
      const tsType = this.generator.checker.getTypeAtLocation(argument);
      if (checkIfObject(tsType) || checkIfFunction(tsType) || isTSClosure(arg)) {
        return this.generator.xbuilder.asVoidStar(arg);
      }

      return arg;
    });

    const parametersTypes = parameters.map((p) =>
      this.generator.checker.getTypeOfSymbolAtLocation(p, valueDeclaration)
    );
    args = this.adjustParameters(args, parametersTypes, llvmArgumentTypes);

    if (args.some((arg, index) => !arg.type.equals(llvmArgumentTypes[index]))) {
      error("Parameters adjusting failed");
    }

    if (isMethod) {
      llvmArgumentTypes.unshift(llvm.Type.getInt8PtrTy(this.generator.context));
    }

    const returnType = getReturnType(expression, this.generator);
    let llvmReturnType = correctCppPrimitiveType(getLLVMType(returnType, expression, this.generator));

    const returnsValue = checkIfReturnsValueType(valueDeclaration);

    if (returnsValue) {
      if (!unwrapPointerType(llvmReturnType).isVoidTy() && !isCppPrimitiveType(llvmReturnType)) {
        if (callerShouldAllocateSpace(llvmReturnType, returnType, this.generator)) {
          llvmArgumentTypes.unshift(llvmReturnType);
        } else {
          llvmReturnType = unwrapPointerType(llvmReturnType);
        }
      }
    }

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
    if (valueDeclaration.body) {
      error(`External symbol '${qualifiedName}' cannot have function body`);
    }

    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      let thisValue = this.generator.handleExpression(propertyAccess.expression, env);
      if (!thisValue.type.isPointerTy()) {
        const allocated = this.generator.gc.allocate(thisValue.type);
        this.generator.xbuilder.createSafeStore(thisValue, allocated);
        thisValue = allocated;
      }
      const thisValueUntyped = this.generator.xbuilder.asVoidStar(thisValue);
      args.unshift(thisValueUntyped);
    }

    if (returnsValue) {
      if (!unwrapPointerType(llvmReturnType).isVoidTy() && !isCppPrimitiveType(llvmReturnType)) {
        if (callerShouldAllocateSpace(llvmReturnType, returnType, this.generator)) {
          const shadowReturnType = unwrapPointerType(llvmReturnType);
          const sret = this.generator.gc.allocate(shadowReturnType);
          args.unshift(sret);

          this.generator.xbuilder.createSafeCall(fn, args);
          return sret;
        }
      }
    }

    const callResult = this.generator.xbuilder.createSafeCall(fn, args);

    if (callResult.type.isVoidTy()) {
      return callResult;
    }

    if (!returnsValue && callResult.type.isPointerTy()) {
      return callResult;
    }

    const allocated = this.generator.gc.allocate(unwrapPointerType(callResult.type));
    this.generator.xbuilder.createSafeStore(callResult, allocated);

    return allocated;
  }

  handleNewExpression(expression: ts.NewExpression, qualifiedName: string, env?: Environment): llvm.Value {
    const thisType = this.generator.checker.getTypeAtLocation(expression);
    const classDeclaration = getAliasedSymbolIfNecessary(thisType.symbol, this.generator.checker)
      .valueDeclaration as ts.ClassLikeDeclaration;
    const constructorDeclaration = classDeclaration.members.find(ts.isConstructorDeclaration)!;

    if (!constructorDeclaration) {
      error(`External symbol '${qualifiedName}' declaration have no constructor provided`);
    }

    if (constructorDeclaration.body) {
      error(`External symbol '${qualifiedName}' cannot have constructor body`);
    }

    const argumentTypes = expression.arguments?.map(this.generator.checker.getTypeAtLocation) || [];

    const parentScope = getFunctionDeclarationScope(classDeclaration, thisType, this.generator);
    const llvmThisType: llvm.PointerType = parentScope.thisData!.llvmType as llvm.PointerType;

    const signature = this.generator.checker.getSignatureFromDeclaration(constructorDeclaration);
    if (!signature) {
      error(`No signature found for '${expression.getText()}'`);
    }

    const parameters = signature.getParameters();
    const llvmArgumentTypes = argumentTypes.map((argumentType, index) => {
      const llvmType = getLLVMType(argumentType, expression, this.generator);

      if (checkIfObject(argumentType) || checkIfFunction(argumentType)) {
        return llvm.Type.getInt8PtrTy(this.generator.context);
      }

      if (parameters[index]) {
        const tsParameterType = this.generator.checker.getTypeOfSymbolAtLocation(
          parameters[index],
          constructorDeclaration
        );
        if (isCppIntegralType(this.generator.checker.typeToString(tsParameterType))) {
          return getIntegralType(tsParameterType, this.generator)!;
        }
      }

      return correctCppPrimitiveType(llvmType);
    });

    let args =
      expression.arguments?.map((argument) => {
        const arg = this.generator.handleExpression(argument, env);
        const tsType = this.generator.checker.getTypeAtLocation(argument);
        if (checkIfObject(tsType) || checkIfFunction(tsType)) {
          return this.generator.xbuilder.asVoidStar(arg);
        }

        return arg;
      }) || [];

    const parametersTypes = parameters.map((p) =>
      this.generator.checker.getTypeOfSymbolAtLocation(p, constructorDeclaration)
    );
    args = this.adjustParameters(args, parametersTypes, llvmArgumentTypes);

    llvmArgumentTypes.unshift(llvm.Type.getInt8PtrTy(this.generator.context));

    const { fn: constructor } = createLLVMFunction(
      llvm.Type.getVoidTy(this.generator.context),
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
    );

    const thisValue = this.generator.gc.allocate(llvmThisType.elementType);
    const thisValueUntyped = this.generator.xbuilder.asVoidStar(thisValue);
    args.unshift(thisValueUntyped);

    this.generator.xbuilder.createSafeCall(constructor, args);
    return this.generator.builder.createBitCast(thisValueUntyped, llvmThisType);
  }

  private adjustParameters(parameters: llvm.Value[], tsTypes: ts.Type[], llvmTypes: llvm.Type[]) {
    if (parameters.length !== llvmTypes.length) {
      error("Expected arrays of same length");
    }

    return parameters.map((parameter, index) => {
      const destinationType = llvmTypes[index];
      const adjusted = adjustLLVMValueToType(parameter, destinationType, this.generator);

      if (isConvertible(adjusted.type, destinationType)) {
        const converter = destinationType.isIntegerTy() ? castFPToIntegralType : promoteIntegralToFP;
        return converter(
          adjusted,
          destinationType,
          isSignedType(this.generator.checker.typeToString(tsTypes[index])),
          this.generator
        );
      }

      return adjusted;
    });
  }
}

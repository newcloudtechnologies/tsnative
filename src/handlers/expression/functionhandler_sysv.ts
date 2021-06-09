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
  error,
  checkIfMethod,
  getArgumentTypes,
  getReturnType,
  adjustLLVMValueToType,
  correctCppPrimitiveType,
  isCppPrimitiveType,
} from "@utils";
import { castFPToIntegralType, getDeclarationScope, isConvertible, promoteIntegralToFP } from "@handlers";
import { LLVMGenerator } from "@generator";
import * as llvm from "llvm-node";
import { Environment } from "@scope";
import { isSignedType } from "@cpp";
import { Type } from "../../ts/type";

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
    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol.valueDeclaration as ts.GetAccessorDeclaration;

    const llvmThisType = llvm.Type.getInt8PtrTy(this.generator.context);
    const llvmArgumentTypes = [llvmThisType];

    const tsReturnType = this.generator.ts.checker.getTypeAtLocation(expression);
    const llvmReturnType = correctCppPrimitiveType(tsReturnType.getLLVMType());

    const { fn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);
    const body = valueDeclaration.body;
    if (body) {
      error(`External symbol '${qualifiedName}' cannot have function body`);
    }

    const thisValue = this.generator.handleExpression(expression.expression, env);
    const thisValueUntyped = this.generator.xbuilder.asVoidStar(thisValue);
    const args = [thisValueUntyped];

    if (!isCppPrimitiveType(llvmReturnType)) {
      return this.generator.xbuilder.createSafeCall(fn, args);
    }

    // WTF?
    const allocated = this.generator.gc.allocate(llvmReturnType);
    const callResult = this.generator.xbuilder.createSafeCall(fn, args);
    this.generator.xbuilder.createSafeStore(callResult, allocated);
    return allocated;
  }

  handleCallExpression(expression: ts.CallExpression, qualifiedName: string, env?: Environment): llvm.Value {
    const argumentTypes = getArgumentTypes(expression, this.generator);
    const isMethod = checkIfMethod(expression.expression, this.generator.ts.checker);

    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = type.getSymbol();
    const valueDeclaration = symbol.valueDeclaration as ts.FunctionLikeDeclaration;

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);

    const parameters = signature.getParameters();
    const llvmArgumentTypes = argumentTypes.map((argumentType, index) => {
      if (argumentType.isObject() || argumentType.isFunction()) {
        return llvm.Type.getInt8PtrTy(this.generator.context);
      }

      if (parameters[index]) {
        const tsParameterType = this.generator.ts.checker.getTypeOfSymbolAtLocation(
          parameters[index],
          valueDeclaration
        );
        if (tsParameterType.isCppIntegralType()) {
          return tsParameterType.getIntegralType();
        }
      }

      const llvmType = argumentType.getLLVMType();
      return correctCppPrimitiveType(llvmType);
    });

    let thisValue;
    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      thisValue = this.generator.handleExpression(propertyAccess.expression, env);
      if (!thisValue.type.isPointerTy()) {
        const allocated = this.generator.gc.allocate(thisValue.type);
        this.generator.xbuilder.createSafeStore(thisValue, allocated);
        thisValue = allocated;
      }
    }

    let args = expression.arguments.map((argument) => {
      if (ts.isSpreadElement(argument)) {
        error("Spread element in arguments is not supported");
      }

      const arg = this.generator.handleExpression(argument, env);
      const tsType = this.generator.ts.checker.getTypeAtLocation(argument);
      if (tsType.isObject() || tsType.isFunction() || this.generator.types.closure.isTSClosure(arg.type)) {
        return this.generator.xbuilder.asVoidStar(arg);
      }

      return arg;
    });

    const parametersTypes = parameters.map((p) =>
      this.generator.ts.checker.getTypeOfSymbolAtLocation(p, valueDeclaration)
    );
    args = this.adjustParameters(args, parametersTypes, llvmArgumentTypes);

    if (args.some((arg, index) => !arg.type.equals(llvmArgumentTypes[index]))) {
      error("Parameters adjusting failed");
    }

    if (isMethod) {
      llvmArgumentTypes.unshift(llvm.Type.getInt8PtrTy(this.generator.context));
    }

    const returnType = getReturnType(expression, this.generator);
    const llvmReturnType = correctCppPrimitiveType(returnType.getLLVMType());

    const { fn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    if (valueDeclaration.body) {
      error(`External symbol '${qualifiedName}' cannot have function body`);
    }

    if (thisValue) {
      const thisValueUntyped = this.generator.xbuilder.asVoidStar(thisValue);
      args.unshift(thisValueUntyped);
    }

    if (!isCppPrimitiveType(llvmReturnType)) {
      if (!llvmReturnType.isPointerTy() && !llvmReturnType.isVoidTy()) {
        error(
          `Error at '${expression.getText()}': returning values from C++ in not allowed. Use GC interface to return trackable pointers or use raw pointers if memory is managed on C++ side.`
        );
      }
      return this.generator.xbuilder.createSafeCall(fn, args);
    }

    const allocated = this.generator.gc.allocate(llvmReturnType);
    const callResult = this.generator.xbuilder.createSafeCall(fn, args);
    this.generator.xbuilder.createSafeStore(callResult, allocated);

    return allocated;
  }

  handleNewExpression(expression: ts.NewExpression, qualifiedName: string, env?: Environment): llvm.Value {
    const thisType = this.generator.ts.checker.getTypeAtLocation(expression);
    const symbol = thisType.getSymbol();
    const classDeclaration = symbol.valueDeclaration as ts.ClassLikeDeclaration;
    const constructorDeclaration = classDeclaration.members.find(ts.isConstructorDeclaration)!;

    if (!constructorDeclaration) {
      error(`External symbol '${qualifiedName}' declaration have no constructor provided`);
    }

    if (constructorDeclaration.body) {
      error(`External symbol '${qualifiedName}' cannot have constructor body`);
    }

    const argumentTypes = expression.arguments?.map((arg) => this.generator.ts.checker.getTypeAtLocation(arg)) || [];

    const parentScope = getDeclarationScope(classDeclaration, thisType, this.generator);
    const llvmThisType: llvm.PointerType = parentScope.thisData!.llvmType as llvm.PointerType;

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(constructorDeclaration);
    const parameters = signature.getParameters();
    const llvmArgumentTypes = argumentTypes.map((argumentType, index) => {
      const llvmType = argumentType.getLLVMType();

      if (argumentType.isObject() || argumentType.isFunction()) {
        return llvm.Type.getInt8PtrTy(this.generator.context);
      }

      if (parameters[index]) {
        const tsParameterType = this.generator.ts.checker.getTypeOfSymbolAtLocation(
          parameters[index],
          constructorDeclaration
        );
        if (tsParameterType.isCppIntegralType()) {
          return tsParameterType.getIntegralType();
        }
      }

      return correctCppPrimitiveType(llvmType);
    });

    let args =
      expression.arguments?.map((argument) => {
        const arg = this.generator.handleExpression(argument, env);
        const tsType = this.generator.ts.checker.getTypeAtLocation(argument);
        if (tsType.isObject() || tsType.isFunction()) {
          return this.generator.xbuilder.asVoidStar(arg);
        }

        return arg;
      }) || [];

    const parametersTypes = parameters.map((p) =>
      this.generator.ts.checker.getTypeOfSymbolAtLocation(p, constructorDeclaration)
    );
    args = this.adjustParameters(args, parametersTypes, llvmArgumentTypes);

    llvmArgumentTypes.unshift(llvm.Type.getInt8PtrTy(this.generator.context));

    const { fn: constructor } = this.generator.llvm.function.create(
      llvm.Type.getVoidTy(this.generator.context),
      llvmArgumentTypes,
      qualifiedName
    );

    const thisValue = this.generator.gc.allocate(llvmThisType.elementType);
    const thisValueUntyped = this.generator.xbuilder.asVoidStar(thisValue);
    args.unshift(thisValueUntyped);

    this.generator.xbuilder.createSafeCall(constructor, args);
    return this.generator.builder.createBitCast(thisValueUntyped, llvmThisType);
  }

  private adjustParameters(parameters: llvm.Value[], tsTypes: Type[], llvmTypes: llvm.Type[]) {
    if (parameters.length !== llvmTypes.length) {
      error("Expected arrays of same length");
    }

    return parameters.map((parameter, index) => {
      const destinationType = llvmTypes[index];
      const adjusted = adjustLLVMValueToType(parameter, destinationType, this.generator);

      if (isConvertible(adjusted.type, destinationType)) {
        const converter = destinationType.isIntegerTy() ? castFPToIntegralType : promoteIntegralToFP;
        return converter(adjusted, destinationType, isSignedType(tsTypes[index].toString()), this.generator);
      }

      return adjusted;
    });
  }
}

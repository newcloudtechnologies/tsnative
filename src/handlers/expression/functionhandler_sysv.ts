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
import { LLVMGenerator } from "@generator";
import { Environment } from "@scope";
import { TSType } from "../../ts/type";
import { LLVMValue } from "../../llvm/value";
import { LLVMType } from "../../llvm/type";
import { Expression } from "../../ts/expression";

export class SysVFunctionHandler {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  handleGetAccessExpression(
    expression: ts.PropertyAccessExpression,
    qualifiedName: string,
    env?: Environment
  ): LLVMValue {
    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.getText()}'`);
    }

    const llvmThisType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [llvmThisType];

    const tsReturnType = this.generator.ts.checker.getTypeAtLocation(expression);
    const llvmReturnType = tsReturnType.getLLVMType().correctCppPrimitiveType();

    const { fn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);
    const body = valueDeclaration.body;
    if (body) {
      throw new Error(`External symbol '${qualifiedName}' cannot have function body`);
    }

    const thisValue = this.generator.handleExpression(expression.expression, env);
    const thisValueUntyped = this.generator.builder.asVoidStar(thisValue);
    const args = [thisValueUntyped];

    if (!llvmReturnType.isCppPrimitiveType()) {
      return this.generator.builder.createSafeCall(fn, args);
    }

    // WTF?
    const allocated = this.generator.gc.allocate(llvmReturnType);
    const callResult = this.generator.builder.createSafeCall(fn, args);
    this.generator.builder.createSafeStore(callResult, allocated);
    return allocated;
  }

  handleCallExpression(expression: ts.CallExpression, qualifiedName: string, env?: Environment): LLVMValue {
    const argumentTypes = Expression.create(expression, this.generator).getArgumentTypes();
    const isMethod = Expression.create(expression.expression, this.generator).isMethod();

    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = type.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.getText()}'`);
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);

    const parameters = signature.getParameters();
    const llvmArgumentTypes = argumentTypes.map((argumentType, index) => {
      if (argumentType.isObject() || argumentType.isFunction()) {
        return LLVMType.getInt8Type(this.generator).getPointer();
      }

      if (parameters[index]) {
        const tsParameterType = this.generator.ts.checker.getTypeOfSymbolAtLocation(
          parameters[index],
          valueDeclaration.unwrapped
        );
        if (tsParameterType.isCppIntegralType()) {
          return tsParameterType.getIntegralType();
        }
      }

      const llvmType = argumentType.getLLVMType();
      return llvmType.correctCppPrimitiveType();
    });

    let thisValue;
    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      thisValue = this.generator.handleExpression(propertyAccess.expression, env);
      if (!thisValue.type.isPointer()) {
        const allocated = this.generator.gc.allocate(thisValue.type);
        this.generator.builder.createSafeStore(thisValue, allocated);
        thisValue = allocated;
      }
    }

    let args = expression.arguments.map((argument) => {
      if (ts.isSpreadElement(argument)) {
        throw new Error("Spread element in arguments is not supported");
      }

      const arg = this.generator.handleExpression(argument, env);
      const tsType = this.generator.ts.checker.getTypeAtLocation(argument);
      if (tsType.isObject() || tsType.isFunction() || arg.type.isClosure()) {
        return this.generator.builder.asVoidStar(arg);
      }

      return arg;
    });

    const parametersTypes = parameters.map((p) =>
      this.generator.ts.checker.getTypeOfSymbolAtLocation(p, valueDeclaration.unwrapped)
    );
    args = this.adjustParameters(args, parametersTypes, llvmArgumentTypes);

    if (args.some((arg, index) => !arg.type.equals(llvmArgumentTypes[index]))) {
      throw new Error("Parameters adjusting failed");
    }

    if (isMethod) {
      llvmArgumentTypes.unshift(LLVMType.getInt8Type(this.generator).getPointer());
    }

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);
    const returnType = resolvedSignature.getReturnType();
    const llvmReturnType = returnType.getLLVMType().correctCppPrimitiveType();

    const { fn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    if (valueDeclaration.body) {
      throw new Error(`External symbol '${qualifiedName}' cannot have function body`);
    }

    if (thisValue) {
      const thisValueUntyped = this.generator.builder.asVoidStar(thisValue);
      args.unshift(thisValueUntyped);
    }

    if (!llvmReturnType.isCppPrimitiveType()) {
      if (!llvmReturnType.isPointer() && !llvmReturnType.isVoid()) {
        throw new Error(
          `Error at '${expression.getText()}': returning values from C++ in not allowed. Use GC interface to return trackable pointers or use raw pointers if memory is managed on C++ side.`
        );
      }
      return this.generator.builder.createSafeCall(fn, args);
    }

    const allocated = this.generator.gc.allocate(llvmReturnType);
    const callResult = this.generator.builder.createSafeCall(fn, args);
    this.generator.builder.createSafeStore(callResult, allocated);

    return allocated;
  }

  handleNewExpression(expression: ts.NewExpression, qualifiedName: string, env?: Environment): LLVMValue {
    const thisType = this.generator.ts.checker.getTypeAtLocation(expression);
    const symbol = thisType.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.getText()}'`);
    }
    const constructorDeclaration = valueDeclaration.members.find((m) => m.isConstructor());

    if (!constructorDeclaration) {
      throw new Error(`External symbol '${qualifiedName}' declaration have no constructor provided`);
    }

    if (constructorDeclaration.body) {
      throw new Error(`External symbol '${qualifiedName}' cannot have constructor body`);
    }

    const argumentTypes = expression.arguments?.map((arg) => this.generator.ts.checker.getTypeAtLocation(arg)) || [];

    const parentScope = valueDeclaration.getScope(thisType);
    const llvmThisType = parentScope.thisData!.llvmType;

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(constructorDeclaration);
    const parameters = signature.getParameters();
    const llvmArgumentTypes = argumentTypes.map((argumentType, index) => {
      const llvmType = argumentType.getLLVMType();

      if (argumentType.isObject() || argumentType.isFunction()) {
        return LLVMType.getInt8Type(this.generator).getPointer();
      }

      if (parameters[index]) {
        const tsParameterType = this.generator.ts.checker.getTypeOfSymbolAtLocation(
          parameters[index],
          constructorDeclaration.unwrapped
        );
        if (tsParameterType.isCppIntegralType()) {
          return tsParameterType.getIntegralType();
        }
      }

      return llvmType.correctCppPrimitiveType();
    });

    let args =
      expression.arguments?.map((argument) => {
        const arg = this.generator.handleExpression(argument, env);
        const tsType = this.generator.ts.checker.getTypeAtLocation(argument);
        if (tsType.isObject() || tsType.isFunction()) {
          return this.generator.builder.asVoidStar(arg);
        }

        return arg;
      }) || [];

    const parametersTypes = parameters.map((p) =>
      this.generator.ts.checker.getTypeOfSymbolAtLocation(p, constructorDeclaration.unwrapped)
    );
    args = this.adjustParameters(args, parametersTypes, llvmArgumentTypes);

    llvmArgumentTypes.unshift(LLVMType.getInt8Type(this.generator).getPointer());

    const { fn: constructor } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      llvmArgumentTypes,
      qualifiedName
    );

    const thisValue = this.generator.gc.allocate(llvmThisType.getPointerElementType());
    const thisValueUntyped = this.generator.builder.asVoidStar(thisValue);
    args.unshift(thisValueUntyped);

    this.generator.builder.createSafeCall(constructor, args);
    return this.generator.builder.createBitCast(thisValueUntyped, llvmThisType);
  }

  private adjustParameters(parameters: LLVMValue[], tsTypes: TSType[], llvmTypes: LLVMType[]) {
    if (parameters.length !== llvmTypes.length) {
      throw new Error("Expected arrays of same length");
    }

    return parameters.map((parameter, index) => {
      const destinationType = llvmTypes[index];
      const adjusted = parameter.adjustToType(destinationType);

      if (adjusted.type.isConvertibleTo(destinationType)) {
        const converter = destinationType.isIntegerType()
          ? LLVMValue.prototype.castFPToIntegralType
          : LLVMValue.prototype.promoteIntegralToFP;
        return converter.call(adjusted, destinationType, tsTypes[index].isSigned());
      }

      return adjusted;
    });
  }
}

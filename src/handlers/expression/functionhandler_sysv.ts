/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */
import * as ts from "typescript";

import { LLVMGenerator } from "../../generator";
import { Environment } from "../../scope";
import { TSType } from "../../ts/type";
import { LLVMGlobalVariable, LLVMValue } from "../../llvm/value";
import { LLVMArrayType, LLVMType } from "../../llvm/type";
import { Expression } from "../../ts/expression";
import { ExternalSymbolsProvider } from "../../mangling";
import { Declaration } from "../../ts/declaration";

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

    const returnsVoidStar =
      !tsReturnType.isSymbolless() && tsReturnType.getSymbol().valueDeclaration?.isClassOrInterface();

    const { fn } = this.generator.llvm.function.create(
      returnsVoidStar ? LLVMType.getInt8Type(this.generator).getPointer() : llvmReturnType,
      llvmArgumentTypes,
      qualifiedName
    );
    const body = valueDeclaration.body;
    if (body) {
      const parentClass = valueDeclaration.parent as ts.ClassDeclaration;

      throw new Error(`Name collision at '${expression.getText()}'.
       Make sure there is no class '${parentClass.name!.getText()}' declared in C++ and TS code that have same fully qualified name (namespace + class name).`);
    }

    const thisValue = this.generator.handleExpression(expression.expression, env);
    const thisValueUntyped = this.generator.builder.asVoidStar(thisValue);
    const args = [thisValueUntyped];

    if (!llvmReturnType.isCppPrimitiveType()) {
      let callResult = this.generator.builder.createSafeCall(fn, args);
      if (returnsVoidStar) {
        callResult = this.generator.builder.createBitCast(callResult, llvmReturnType);
      }
      return callResult;
    }

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

    args = this.adjustArguments(args, llvmArgumentTypes, argumentTypes);

    if (args.some((arg, index) => !arg.type.equals(llvmArgumentTypes[index]))) {
      throw new Error(`Arguments adjusting failed at '${expression.getText()}'`);
    }

    if (isMethod) {
      llvmArgumentTypes.unshift(LLVMType.getInt8Type(this.generator).getPointer());
    }

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);
    const returnType = resolvedSignature.getReturnType();
    const llvmReturnType = returnType.getLLVMType().correctCppPrimitiveType();

    const returnsVoidStar = !returnType.isSymbolless() && returnType.getSymbol().valueDeclaration?.isClassOrInterface();

    const { fn } = this.generator.llvm.function.create(
      returnsVoidStar ? LLVMType.getInt8Type(this.generator).getPointer() : llvmReturnType,
      llvmArgumentTypes,
      qualifiedName
    );

    if (valueDeclaration.body) {
      const parentClass = valueDeclaration.parent as ts.ClassDeclaration;

      throw new Error(`Name collision at '${expression.getText()}''.
       Make sure there is no class '${parentClass.name!.getText()}' declared in C++ and TS code that have same fully qualified name (namespace + class name).`);
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

      let callResult = this.generator.builder.createSafeCall(fn, args);
      if (returnsVoidStar) {
        callResult = this.generator.builder.createBitCast(callResult, llvmReturnType);
      }
      return callResult;
    }

    const allocated = this.generator.gc.allocate(llvmReturnType);
    const callResult = this.generator.builder.createSafeCall(fn, args);
    this.generator.builder.createSafeStore(callResult, allocated);

    return allocated;
  }

  handleNewExpression(
    expression: ts.NewExpression | ts.SuperCall,
    qualifiedName: string,
    outerEnv?: Environment
  ): LLVMValue {
    const thisType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
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
      throw new Error(`Name collision at ${expression.getText()}.
       Make sure there is no class '${valueDeclaration.name!.getText()}' declared in C++ and TS code that have same fully qualified name (namespace + class name).`);
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
        const arg = this.generator.handleExpression(argument, outerEnv);
        const tsType = this.generator.ts.checker.getTypeAtLocation(argument);
        if (tsType.isObject() || tsType.isFunction()) {
          return this.generator.builder.asVoidStar(arg);
        }

        return arg;
      }) || [];

    args = this.adjustArguments(args, llvmArgumentTypes, argumentTypes);

    llvmArgumentTypes.unshift(LLVMType.getInt8Type(this.generator).getPointer());

    const { fn: constructor } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      llvmArgumentTypes,
      qualifiedName
    );

    let thisValue: LLVMValue;

    if (ts.isNewExpression(expression)) {
      thisValue = this.generator.gc.allocate(llvmThisType.getPointerElementType());
    } else {
      if (!outerEnv) {
        throw new Error(`Expected environment to be provided for call: '${expression.getText()}'`);
      }

      const thisIdx = outerEnv.getVariableIndex(this.generator.internalNames.This);
      if (thisIdx === -1) {
        throw new Error(`Expected 'this' to be provided by outer environment for call: '${expression.getText()}'`);
      }

      const thisValuePtr = this.generator.builder.createSafeInBoundsGEP(outerEnv.typed, [0, thisIdx]);
      thisValue = this.generator.builder.createLoad(thisValuePtr);
    }

    const thisValueUntyped = this.generator.builder.asVoidStar(thisValue);
    args.unshift(thisValueUntyped);

    this.generator.builder.createSafeCall(constructor, args);

    this.initVTable(valueDeclaration, thisValue);

    return this.generator.builder.createBitCast(thisValueUntyped, llvmThisType);
  }

  private initVTable(valueDeclaration: Declaration, thisValue: LLVMValue) {
    if (!valueDeclaration.withVTable()) {
      return;
    }

    if (!valueDeclaration.name) {
      throw new Error(`Expected named class declaration at '${valueDeclaration.getText()}'`);
    }

    const qualifiedClassName = valueDeclaration.getNamespace().concat(valueDeclaration.name.getText()).join("::");

    const vtable = ExternalSymbolsProvider.getVTableSymbolFor(qualifiedClassName);
    const vtableType = LLVMArrayType.get(
      this.generator,
      LLVMType.getInt8Type(this.generator).getPointer(),
      valueDeclaration.vtableSize
    );

    const existing = this.generator.module.getGlobalVariable(vtable);
    const vtableGlobal = existing
      ? LLVMValue.create(existing, this.generator)
      : LLVMGlobalVariable.make(this.generator, vtableType, true, undefined, vtable);

    // vtables are stored in .rodata
    // this makes it impossible to patch vtables that were directly stored into class' vptr
    // make a copy, then store patchable version
    const vtableGlobalToUse = this.generator.gc.allocate(vtableGlobal.type.unwrapPointer());
    this.generator.builder.createSafeStore(this.generator.builder.createLoad(vtableGlobal), vtableGlobalToUse);

    const typeinfoOffset = 2; // @todo: is this compiler dependant?
    const vtableWithoutTypeinfo = this.generator.builder.createSafeInBoundsGEP(vtableGlobalToUse, [0, typeinfoOffset]);
    const vtableStructCasted = this.generator.builder.createBitCast(
      vtableWithoutTypeinfo,
      LLVMType.getVPtrType(this.generator)
    );

    const classVTablePtr = this.generator.builder.createBitCast(
      thisValue,
      LLVMType.getVPtrType(this.generator).getPointer()
    );
    this.generator.builder.createSafeStore(vtableStructCasted, classVTablePtr);
  }

  private adjustArguments(args: LLVMValue[], llvmArgumentTypes: LLVMType[], tsArgumentsTypes: TSType[]) {
    if (args.length !== llvmArgumentTypes.length) {
      throw new Error("Expected arrays of same length");
    }

    return args.map((arg, index) => {
      const destinationType = llvmArgumentTypes[index];
      const adjusted = arg.adjustToType(destinationType);

      if (!adjusted.type.equals(destinationType) && adjusted.type.isConvertibleTo(destinationType)) {
        const converter = destinationType.isIntegerType()
          ? LLVMValue.prototype.castFPToIntegralType
          : LLVMValue.prototype.promoteIntegralToFP;

        return converter.call(adjusted, destinationType, tsArgumentsTypes[index].isSigned());
      }

      return adjusted;
    });
  }
}

/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
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
import { LLVMGlobalVariable, LLVMValue } from "../../llvm/value";
import { LLVMArrayType, LLVMType } from "../../llvm/type";
import { Expression } from "../../ts/expression";
import { CXXSymbols } from "../../mangling";
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

    const isStaticGetter = valueDeclaration.isStatic();

    const llvmArgumentTypes: LLVMType[] = [];
    if (!isStaticGetter) {
      const llvmThisType = LLVMType.getInt8Type(this.generator).getPointer();
      llvmArgumentTypes.push(llvmThisType);
    }

    const tsReturnType = this.generator.ts.checker.getTypeAtLocation(expression);
    const llvmReturnType = tsReturnType.getLLVMType();

    const { fn } = this.generator.llvm.function.create(
      LLVMType.getInt8Type(this.generator).getPointer(),
      llvmArgumentTypes,
      qualifiedName
    );
    const body = valueDeclaration.body;
    if (body) {
      const parentClass = valueDeclaration.parent as ts.ClassDeclaration;

      throw new Error(`Name collision at '${expression.getText()}'.
       Make sure there is no class '${parentClass.name!.getText()}' declared in C++ and TS code that have same fully qualified name (namespace + class name).`);
    }

    const args: LLVMValue[] = [];
    if (!isStaticGetter) {
      const thisValue = this.generator.handleExpression(expression.expression, env).derefToPtrLevel1();
      const thisValueUntyped = this.generator.builder.asVoidStar(thisValue);
      args.push(thisValueUntyped);
    }

    let callResult = this.generator.builder.createSafeCall(fn, args);
    this.generator.applyLocation(callResult.unwrapped as llvm.CallInst, expression);
    callResult = this.generator.builder.createBitCast(callResult, llvmReturnType);

    return callResult;
  }

  handleSetAccessExpression(expression: ts.PropertyAccessExpression, qualifiedName: string, env?: Environment) {
    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.getText()}'`);
    }

    const llvmThisType = LLVMType.getInt8Type(this.generator).getPointer();

    const parent = expression.parent as ts.BinaryExpression;
    const arg = this.generator.handleExpression(parent.right, env).derefToPtrLevel1();

    const llvmArgumentTypes = [llvmThisType, arg.type];

    const { fn } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      llvmArgumentTypes,
      qualifiedName
    );
    const body = valueDeclaration.body;
    if (body) {
      const parentClass = valueDeclaration.parent as ts.ClassDeclaration;

      throw new Error(`Name collision at '${expression.getText()}'.
       Make sure there is no class '${parentClass.name!.getText()}' declared in C++ and TS code that have same fully qualified name (namespace + class name).`);
    }

    const thisValue = this.generator.handleExpression(expression.expression, env).derefToPtrLevel1();
    const thisValueUntyped = this.generator.builder.asVoidStar(thisValue);
    const args = [thisValueUntyped, arg];

    const callResult = this.generator.builder.createSafeCall(fn, args);
    this.generator.applyLocation(callResult.unwrapped as llvm.CallInst, expression);

    return arg;
  }

  handleCallExpression(expression: ts.CallExpression, qualifiedName: string, env?: Environment): LLVMValue {
    const isMethod = Expression.create(expression.expression, this.generator).isMethod();

    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = type.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.getText()}'`);
    }

    let thisValue;
    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      thisValue = this.generator.handleExpression(propertyAccess.expression, env).derefToPtrLevel1();
      if (!thisValue.type.isPointer()) {
        throw new Error(
          `Expected LLVM pointer type for 'this' at expression: '${propertyAccess.expression.getText()}', got '${thisValue.type.toString()}'. Error at '${expression.getText()}'`
        );
      }
    }

    const args = this.handleCallArguments(expression.arguments, valueDeclaration, env);

    const llvmArgumentTypes = args.map((arg) => arg.type);

    if (isMethod) {
      llvmArgumentTypes.unshift(LLVMType.getInt8Type(this.generator).getPointer());
    }

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);
    const returnType = resolvedSignature.getReturnType();
    let llvmReturnType = returnType.getLLVMType();

    if (returnType.isEnum()) {
      llvmReturnType = LLVMType.getInt32Type(this.generator);
    }

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

    if (!returnType.isEnum() && !llvmReturnType.isPointer() && !llvmReturnType.isVoid()) {
      throw new Error(
        `Error at '${expression.getText()}': returning values from C++ only allowed for enums. Use GC interface to return trackable pointers or use raw pointers if memory is managed on C++ side.`
      );
    }

    let callResult = this.generator.builder.createSafeCall(fn, args);
    this.generator.applyLocation(callResult.unwrapped as llvm.CallInst, expression);
    if (returnsVoidStar) {
      callResult = this.generator.builder.createBitCast(callResult, llvmReturnType);
    } else if (returnType.isEnum()) {
      callResult = this.generator.builder.createSIToFP(callResult, LLVMType.getDoubleType(this.generator));
      callResult = this.generator.builtinNumber.create(callResult);
    }

    return callResult;
  }

  handleNewExpression(
    expression: ts.NewExpression | ts.SuperCall,
    qualifiedName: string,
    outerEnv?: Environment
  ): LLVMValue {
    // Getting type for 'expression.expression' of 'new Array<T>' gives 'typeof Array' and this breaks mangling scheme.
    // Since TS constructors actually return values use return type for 'this' type determination.
    // 'super' calls return nothing, so use type at 'super'.
    let typeSource = ts.isNewExpression(expression) ? expression : expression.expression;

    let thisType = this.generator.ts.checker.getTypeAtLocation(typeSource);

    const isSynthetic = typeSource.pos === -1;
    if (isSynthetic) {
      let parent = expression.parent;
      while (parent && !ts.isClassLike(parent)) {
        parent = parent.parent;
      }

      if (!parent) {
        throw new Error(`Unable to find class-like parent`);
      }

      thisType = this.generator.ts.checker.getTypeAtLocation(parent);
    }

    const symbol = thisType.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.getText()}'`);
    }

    const argumentTypes = expression.arguments?.map((arg) => this.generator.ts.checker.getTypeAtLocation(arg)) || [];

    const constructorDeclaration = valueDeclaration.findConstructor(argumentTypes);

    if (!constructorDeclaration) {
      throw new Error(`External symbol '${qualifiedName}' declaration have no constructor provided`);
    }

    if (constructorDeclaration.body) {
      throw new Error(`Name collision at ${expression.getText()}.
       Make sure there is no class '${valueDeclaration.name!.getText()}' declared in C++ and TS code that have same fully qualified name (namespace + class name).`);
    }

    const llvmThisType = valueDeclaration.type.getLLVMType();

    const args =
      expression.arguments ? this.handleCallArguments(expression.arguments, constructorDeclaration, outerEnv) : []

    const llvmArgumentTypes = args.map((arg) => arg.type);
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
      thisValue = this.generator.builder.createLoad(thisValuePtr).derefToPtrLevel1();
    }

    const thisValueUntyped = this.generator.builder.asVoidStar(thisValue);
    args.unshift(thisValueUntyped);

    const callResult = this.generator.builder.createSafeCall(constructor, args);
    this.generator.applyLocation(callResult.unwrapped as llvm.CallInst, expression);

    this.initVTable(valueDeclaration, thisValue);

    return this.generator.builder.createBitCast(thisValueUntyped, llvmThisType);
  }

  private handleCallArguments(tsArgs: ts.NodeArray<ts.Expression>, declaration: Declaration, outerEnv?: Environment) {
    const llvmArgs = tsArgs.map((argument, index) => {
      if (ts.isSpreadElement(argument)) {
        return this.generator.handleExpression(argument.expression, outerEnv).derefToPtrLevel1();
      }

      let arg = this.generator.handleExpression(argument, outerEnv).derefToPtrLevel1();

      if (arg.isTSPrimitivePtr()) {
        arg = arg.clone();
      }

      // there may be no parameter declared at argument's index in case of rest arguments
      const parameterAtIndex = declaration.parameters[index];
      if (parameterAtIndex) {
        const parameterDeclaration = Declaration.create(parameterAtIndex, this.generator);

        if (!parameterDeclaration.dotDotDotToken) {
          if (arg.type.isUnion() && !parameterDeclaration.type.isUnion()) {
              let value = this.generator.builder.asVoidStar(this.generator.ts.union.get(arg));

              if (parameterDeclaration.type.isEnum()) {
                value = this.generator.builder.createBitCast(value, this.generator.builtinNumber.getLLVMType());
                return value.asLLVMInteger();
              }

              return value;
          }
        }

        if (parameterDeclaration.type.isEnum()) {
          return arg.asLLVMInteger();
        }

        if (parameterDeclaration.isOptional() && parameterDeclaration.type.isSupported()) {
          return this.generator.ts.union.create(arg);
        }
      }

      return this.generator.builder.asVoidStar(arg);
    });

    this.populateOptionals(llvmArgs, declaration);

    return llvmArgs;
  }

  private initVTable(valueDeclaration: Declaration, thisValue: LLVMValue) {
    if (!valueDeclaration.withVTable()) {
      return;
    }

    if (!valueDeclaration.name) {
      throw new Error(`Expected named class declaration at '${valueDeclaration.getText()}'`);
    }

    const qualifiedClassName = valueDeclaration.getNamespace().concat(valueDeclaration.name.getText()).join("::");

    const vtable = CXXSymbols().getVTableSymbolFor(qualifiedClassName);
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

  private populateOptionals(args: LLVMValue[], declaration: Declaration) {
    for (let i = args.length; i < declaration.parameters.length; ++i) {
      const parameterDeclaration = Declaration.create(declaration.parameters[i], this.generator);
      if (parameterDeclaration.dotDotDotToken) {
        continue;
      }

      if (!parameterDeclaration.isOptional()) {
        throw new Error(`Expected optional argument, got '${parameterDeclaration.getText()}'`);
      }

      const value = this.generator.ts.union.create();

      args.push(value);
    }
  }
}

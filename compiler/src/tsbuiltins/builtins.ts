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

import { LLVMGenerator } from "../generator";
import * as ts from "typescript";
import { ThisData, Scope, Environment } from "../scope";
import { FunctionMangler } from "../mangling";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMConstant, LLVMConstantFP, LLVMGlobalVariable, LLVMValue } from "../llvm/value";
import { Declaration } from "../ts/declaration";
import { TSType } from "../ts/type";
import { TSLazyClosure } from "../ts/lazy_closure";

const stdlib = require("std/constants");

class Builtin {
  readonly name: string;
  readonly generator: LLVMGenerator;
  thisData: ThisData | undefined;

  constructor(name: string, generator: LLVMGenerator) {
    this.name = name;
    this.generator = generator;
  }

  getTSType() {
    if (!this.thisData) {
      this.init();
    }
    return this.thisData!.tsType;
  }

  getLLVMType(): LLVMType {
    if (!this.thisData) {
      this.init();
    }
    return this.thisData!.llvmType;
  }

  getDeclaration() {
    if (!this.thisData) {
      this.init();
    }
    return this.thisData!.declaration!;
  }

  private init(): void {
    const clazz = this.generator.symbolTable.get(this.name);
    this.thisData = (clazz as Scope).thisData;
  }
}

export class BuiltinTSClosure extends Builtin {
  private readonly llvmType: LLVMType;
  private readonly tsType: TSType;
  private readonly declaration: Declaration;

  private readonly callFn: LLVMValue;
  private readonly getEnvFn: LLVMValue;
  private readonly ctorFn: LLVMValue;

  readonly lazyClosure: TSLazyClosure;

  constructor(generator: LLVMGenerator) {
    super("TSClosure", generator);

    this.lazyClosure = new TSLazyClosure(generator);

    this.declaration = this.initClassDeclaration();

    this.tsType = this.declaration.type;
    this.llvmType = this.declaration.getLLVMStructType("closure");

    this.callFn = this.initCallFn();
    this.getEnvFn = this.initGetEnvironmentFn();
    this.ctorFn = this.initCtorFn();
  }

  private initClassDeclaration() {
    const defs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.CLOSURE_DEFINITION);

    if (!defs) {
      throw new Error("No utility definitions source file found");
    }

    const classDeclaration = defs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText() === "TSClosure";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'TSClosure' declaration in std library utility definitions");
    }

    return Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
  }

  private initCallFn() {
    const thisType = this.declaration.type;

    const callDeclaration = this.declaration.members.find((m) => m.isMethod() && m.name?.getText() === "call");

    if (!callDeclaration) {
      throw new Error("No function declaration for TSClosure.call provided");
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      callDeclaration,
      undefined,
      thisType,
      [],
      this.generator
    );
    if (!isExternalSymbol) {
      throw new Error("External symbol for ts closure call not found");
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [this.getLLVMType()];
    const { fn: call } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return call;
  }

  private initGetEnvironmentFn() {
    const thisType = this.declaration.type;

    const getEnvironmentDeclaration = this.declaration.members.find(
      (m) => m.isMethod() && m.name?.getText() === "getEnvironment"
    );

    if (!getEnvironmentDeclaration) {
      throw new Error("No function declaration for TSClosure.getEnvironment provided");
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      getEnvironmentDeclaration,
      undefined,
      thisType,
      [],
      this.generator
    );
    if (!isExternalSymbol) {
      throw new Error("External symbol for TSClosure.getEnvironment not found");
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer().getPointer().getPointer();
    const llvmArgumentTypes = [this.getLLVMType()];

    const { fn: getEnvironment } = this.generator.llvm.function.create(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName
    );

    return getEnvironment;
  }

  private initCtorFn() {
    const thisType = this.declaration.type;

    const constructorDeclaration = this.declaration.members.find((m) => m.isConstructor());
    if (!constructorDeclaration) {
      throw new Error(`Unable to find constructor declaration at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      undefined,
      ["void*", "void***", "Number*", "Number*", "Number*"]
    );
    if (!isExternalSymbol) {
      throw new Error("External symbol TSClosure constructor not found");
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [
      this.getLLVMType(),
      LLVMType.getInt8Type(this.generator).getPointer(),
      LLVMType.getInt8Type(this.generator).getPointer().getPointer().getPointer(),
      this.generator.builtinNumber.getLLVMType(),
      this.generator.builtinNumber.getLLVMType(),
      this.generator.builtinNumber.getLLVMType(),
    ];
    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return constructor;
  }

  getLLVMType(): LLVMType {
    return this.llvmType;
  }

  getTSType() {
    return this.tsType;
  }

  getLLVMCall() {
    return this.callFn;
  }

  getLLVMGetEnvironment() {
    return this.getEnvFn;
  }

  getLLVMConstructor() {
    return this.ctorFn;
  }

  createClosure(fn: LLVMValue, env: Environment, functionDeclaration: Declaration) {
    if (fn.type.getPointerLevel() !== 1 || !fn.type.unwrapPointer().isFunction()) {
      throw new Error("Malformed function");
    }
    if (env.untyped.type.getPointerLevel() !== 1) {
      throw new Error("Malformed environment");
    }

    const envLength = env.variables.length;

    const thisValue = this.generator.gc.allocateObject(this.getLLVMType().unwrapPointer());
    const untypedFn = this.generator.builder.asVoidStar(fn);
    const untypedEnv = this.generator.builder.asVoidStarStarStar(env.untyped);

    const numArgs = functionDeclaration.parameters.length;

    if (numArgs > 63) {
      throw new Error(`Parameters limited up to 63. Error at closure creation for '${functionDeclaration.getText()}'`);
    }

    const optionals = functionDeclaration.parameters.reduce((acc, parameter, index) => {
      if (parameter.questionToken) {
        acc |= 1 << index;
      }

      return acc;
    }, 0);

    const constructor = this.getLLVMConstructor();
    this.generator.builder.createSafeCall(constructor, [
      thisValue,
      untypedFn,
      untypedEnv,
      this.generator.builtinNumber.create(LLVMConstantFP.get(this.generator, envLength)),
      this.generator.builtinNumber.create(LLVMConstantFP.get(this.generator, numArgs)),
      this.generator.builtinNumber.create(LLVMConstantFP.get(this.generator, optionals)),
    ]);
    return thisValue;
  }

  createNullValue() {
    return LLVMConstant.createNullValue(this.llvmType, this.generator);
  }
}

export enum OperationFlags {
  Unary = 1,
  Binary = 2,
}

export class BuiltinNumber extends Builtin {
  private readonly llvmType: LLVMType;

  private readonly classDeclaration: Declaration;

  private readonly ctorFn: LLVMValue;
  private readonly toStringFn: LLVMValue;
  private readonly unboxFn: LLVMValue;
  private readonly cloneFn: LLVMValue;
  private readonly nanFn: LLVMValue;
  private readonly infinityFn: LLVMValue;

  private readonly boolFunctions = new Map<string, LLVMValue>();
  private readonly mathFunctions = new Map<string, LLVMValue>();

  constructor(generator: LLVMGenerator) {
    super("number", generator);

    this.classDeclaration = this.initClassDeclaration();

    this.llvmType = this.classDeclaration.getLLVMStructType("number");

    this.ctorFn = this.initCtorFn();
    this.toStringFn = this.initToStringFn();
    this.unboxFn = this.initUnboxFn();
    this.cloneFn = this.initCloneFn();
    this.nanFn = this.getNumberGetterFn("NaN");
    this.infinityFn = this.getNumberGetterFn("POSITIVE_INFINITY");
  }

  getTSType() {
    return this.classDeclaration.type;
  }

  private initClassDeclaration() {
    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.NUMBER_DEFINITION);
    if (!stddefs) {
      throw new Error("No number definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(stddefs) === "Number";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Number' declaration in std library definitions");
    }

    return Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
  }

  private initCtorFn() {
    const declaration = this.classDeclaration;

    const constructorDeclaration = declaration.members.find((m) => m.isConstructor())!;
    const thisType = this.getTSType();

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      undefined,
      ["double"]
    );

    if (!isExternalSymbol) {
      throw new Error(`Number constructor for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [
      LLVMType.getInt8Type(this.generator).getPointer(),
      LLVMType.getDoubleType(this.generator),
    ];

    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return constructor;
  }

  private initToStringFn() {
    const declaration = this.classDeclaration;

    const fnDeclaration = declaration.members.find((m) => m.name?.getText() === "toString");
    if (!fnDeclaration) {
      throw new Error(`Unable to find method 'toString' at '${declaration.getText()}'`);
    }

    const thisType = this.getTSType();

    const argTypes: TSType[] = [];

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      fnDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Number method 'toString' for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = this.generator.ts.str.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

    const { fn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return fn;
  }

  private initUnboxFn() {
    const declaration = this.classDeclaration;

    const unboxedDeclaration = declaration.members.find((m) => m.name?.getText() === "unboxed")!;
    const thisType = this.getTSType();

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      unboxedDeclaration,
      undefined,
      thisType,
      [],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Number unbox fn for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = LLVMType.getDoubleType(this.generator);
    const llvmArgumentTypes = [this.llvmType];

    const { fn: unboxFn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return unboxFn;
  }

  private initCloneFn() {
    const declaration = this.classDeclaration;
    const thisType = this.getTSType();
    const llvmThisType = this.getLLVMType();

    const equalsDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "clone")!;

    const { qualifiedName } = FunctionMangler.mangle(
      equalsDeclaration,
      undefined,
      thisType,
      [thisType],
      this.generator
    );

    const llvmReturnType = llvmThisType;
    const llvmArgumentTypes = [llvmThisType];
    const { fn: clone } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return clone;
  }

  createMathFn(name: string, flags: OperationFlags = OperationFlags.Binary) {
    const id = name + flags;

    if (this.mathFunctions.has(id)) {
      return this.mathFunctions.get(id)!;
    }

    const declaration = this.classDeclaration;

    const fnDeclaration = declaration.members.find((m) => m.name?.getText() === name);
    if (!fnDeclaration) {
      throw new Error(`Unable to find method '${name}' at '${declaration.getText()}'`);
    }

    const thisType = this.getTSType();

    const argTypes: TSType[] = [];
    if (flags === OperationFlags.Binary) {
      argTypes.push(thisType);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      fnDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Number method '${name}' for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = this.llvmType;
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    if (flags === OperationFlags.Binary) {
      llvmArgumentTypes.push(this.llvmType);
    }

    const { fn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    this.mathFunctions.set(id, fn);

    return fn;
  }

  createBooleanFn(name: string, flags: OperationFlags = OperationFlags.Binary) {
    const id = name + flags;

    if (this.boolFunctions.has(id)) {
      return this.boolFunctions.get(id)!;
    }

    const declaration = this.classDeclaration;

    const fnDeclaration = declaration.members.find((m) => m.name?.getText() === name);
    if (!fnDeclaration) {
      throw new Error(`Unable to find method '${name}' at '${declaration.getText()}'`);
    }

    const thisType = this.getTSType();

    const argTypes: TSType[] = [];
    if (flags === OperationFlags.Binary) {
      argTypes.push(thisType);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      fnDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Number method '${name}' for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = this.generator.builtinBoolean.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    if (flags === OperationFlags.Binary) {
      llvmArgumentTypes.push(this.llvmType);
    }

    const { fn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    this.boolFunctions.set(id, fn);

    return fn;
  }

  private getNumberGetterFn(functionName: string) {
    const declaration = this.classDeclaration;

    const fnDeclaration = declaration.members.find((m) => m.name?.getText() === functionName);
    if (!fnDeclaration) {
      throw new Error(`Unable to find method '${functionName}' at '${declaration.getText()}'`);
    }

    const thisType = this.getTSType();

    const argTypes: TSType[] = [];

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      fnDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Number method '${functionName}' for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();

    const { fn } = this.generator.llvm.function.create(llvmReturnType, [], qualifiedName);

    return fn;
  }

  private initNumberConstants(fn: LLVMValue, name: string, globalScopeKey: string): void {
    const instance = this.generator.builder.createSafeCall(fn, []);

    const nullValue = LLVMConstant.createNullValue(this.llvmType, this.generator);
    const globalConstant = LLVMGlobalVariable.make(
      this.generator,
      this.llvmType,
      false,
      nullValue,
      name
    );

    const casted = this.generator.builder.createBitCast(instance, this.llvmType);
    this.generator.builder.createSafeStore(casted, globalConstant);

    this.generator.symbolTable.globalScope.set(globalScopeKey, globalConstant, false);
  }

  getToStringFn() {
    return this.toStringFn;
  }

  getUnboxed(value: LLVMValue) {
    return this.generator.builder.createSafeCall(this.unboxFn, [value]);
  }

  getLLVMType() {
    return this.llvmType;
  }

  initNan(): void {
    this.initNumberConstants(this.nanFn, "nan_constant", "NaN");
  }

  initInfinity(): void {
    this.initNumberConstants(this.infinityFn, "infinity_constant", "Infinity");
  }

  create(value: LLVMValue) {
    let allocated: LLVMValue = this.generator.gc.allocateObject(this.llvmType.getPointerElementType());
    const thisUntyped = this.generator.builder.asVoidStar(allocated);

    this.generator.builder.createSafeCall(this.ctorFn, [thisUntyped, value]);
    return allocated;
  }

  clone(value: LLVMValue) {
    return this.generator.builder.createSafeCall(this.cloneFn, [value]);
  }
}

export class BuiltinBoolean extends Builtin {
  private readonly llvmType: LLVMType;

  private readonly classDeclaration: Declaration;

  private readonly unboxFn: LLVMValue;
  private readonly constructorFn: LLVMValue;
  private readonly negateFn: LLVMValue;
  private readonly cloneFn: LLVMValue;
  private readonly toStringFn: LLVMValue;

  constructor(generator: LLVMGenerator) {
    super("boolean", generator);

    this.classDeclaration = this.initClassDeclaration();
    this.llvmType = this.classDeclaration.getLLVMStructType("boolean");

    this.unboxFn = this.initUnboxFn();
    this.constructorFn = this.initConstructorFn();
    this.negateFn = this.initNegateFn();
    this.cloneFn = this.initCloneFn();
    this.toStringFn = this.initToStringFn();
  }

  private initClassDeclaration() {
    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.BOOLEAN_DEFINITION);
    if (!stddefs) {
      throw new Error("No boolean definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(stddefs) === "Boolean";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Boolean' declaration in std library definitions");
    }

    return Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
  }

  private initUnboxFn() {
    const declaration = this.getDeclaration();

    const unboxedDeclaration = declaration.members.find((m) => m.name?.getText() === "unboxed")!;
    const thisType = this.getTSType();

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      unboxedDeclaration,
      undefined,
      thisType,
      [],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Boolean constructor for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = LLVMType.getIntNType(1, this.generator);
    const llvmArgumentTypes = [this.llvmType];

    const { fn: unboxFn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return unboxFn;
  }

  private initConstructorFn() {
    const declaration = this.getDeclaration();

    const constructorDeclaration = declaration.members.find((m) => m.isConstructor());

    if (!constructorDeclaration) {
      throw new Error(`Unable to find constructor at '${this.classDeclaration.getText()}'`);
    }

    const thisType = this.getTSType();

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      undefined,
      ["bool"]
    );

    if (!isExternalSymbol) {
      throw new Error(`Boolean constructor for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [
      LLVMType.getInt8Type(this.generator).getPointer(),
      LLVMType.getIntNType(1, this.generator),
    ];

    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return constructor;
  }

  private initNegateFn() {
    const declaration = this.getDeclaration();

    const negateDeclaration = declaration.members.find((m) => m.name?.getText() === "negate")!;
    const thisType = this.getTSType();

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      negateDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      undefined
    );

    if (!isExternalSymbol) {
      throw new Error("Boolean.negate not found");
    }

    const llvmReturnType = this.llvmType;
    const llvmArgumentTypes = [this.llvmType];

    const { fn: negateFn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return negateFn;
  }

  private initCloneFn() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();
    const llvmThisType = this.getLLVMType();

    const cloneDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "clone");

    if (!cloneDeclaration) {
      throw new Error(`Unable to find 'clone' method at '${this.classDeclaration.getText()}'`);
    }

    const { qualifiedName } = FunctionMangler.mangle(
      cloneDeclaration,
      undefined,
      thisType,
      [thisType],
      this.generator
    );

    const llvmReturnType = llvmThisType;
    const llvmArgumentTypes = [llvmThisType];
    const { fn: clone } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return clone;
  }

  private initToStringFn() {
    const declaration = this.getDeclaration();

    const fnDeclaration = declaration.members.find((m) => m.name?.getText() === "toString");
    if (!fnDeclaration) {
      throw new Error(`Unable to find method 'toString' at '${declaration.getText()}'`);
    }

    const thisType = this.getTSType();

    const argTypes: TSType[] = [];

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      fnDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Number method 'toString' for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = this.generator.ts.str.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

    const { fn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return fn;
  }

  getDeclaration() {
    return this.classDeclaration;
  }

  getTSType() {
    return this.classDeclaration.type;
  }

  getLLVMType() {
    return this.llvmType;
  }

  getUnboxed(value: LLVMValue) {
    return this.generator.builder.createSafeCall(this.unboxFn, [value]);
  }

  create(value: LLVMValue) {
    let allocated: LLVMValue = this.generator.gc.allocateObject(this.llvmType.getPointerElementType());
    const thisUntyped = this.generator.builder.asVoidStar(allocated);

    this.generator.builder.createSafeCall(this.constructorFn, [thisUntyped, value]);
    return allocated;
  }

  getNegateFn() {
    return this.negateFn;
  }

  clone(value: LLVMValue) {
    return this.generator.builder.createSafeCall(this.cloneFn, [value]);
  }

  getToStringFn() {
    return this.toStringFn;
  }
}

export class BuiltinIteratorResult extends Builtin {
  private readonly llvmType: LLVMType;

  private readonly classDeclaration: Declaration;

  private readonly valueGetter: LLVMValue;
  private readonly doneGetters = new Map<string, LLVMValue>();

  constructor(declaration: Declaration, generator: LLVMGenerator) {
    super(declaration.type.mangle(), generator);

    this.classDeclaration = declaration;

    this.llvmType = declaration.getLLVMStructType();

    this.valueGetter = this.initValueGetter();
  }

  private initValueGetter() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const valueGetterDeclaration = declaration.members.find((m) => m.isGetAccessor() && m.name?.getText() === "value");
    if (!valueGetterDeclaration) {
      throw new Error(`Unable to find 'value' getter in declaration: '${declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      valueGetterDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      ["void*"]
    );

    if (!isExternalSymbol) {
      throw new Error(`External symbol for 'value' is not found at '${declaration.getText()}'`);
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    const { fn: valueGetter } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return valueGetter;
  }

  getDeclaration() {
    return this.classDeclaration;
  }

  getLLVMType() {
    return this.llvmType;
  }

  getTSType() {
    return this.classDeclaration.type;
  }

  getValueGetter() {
    return this.valueGetter;
  }

  getDoneGetter(type: TSType) {
    const typename = type.toString();

    if (this.doneGetters.has(typename)) {
      return this.doneGetters.get(typename)!;
    }

    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const doneDeclaration = declaration.members.find((m) => m.isGetAccessor() && m.name?.getText() === "done")!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      doneDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      [type.toCppType()]
    );

    if (!isExternalSymbol) {
      throw new Error(`External symbol for 'value' is not found at '${declaration.getText()}'`);
    }

    const llvmReturnType = this.generator.builtinBoolean.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    const { fn: doneGetter } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    this.doneGetters.set(typename, doneGetter);

    return doneGetter;
  }
}

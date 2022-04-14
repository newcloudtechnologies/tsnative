import { LLVMGenerator } from "../generator";
import * as ts from "typescript";
import { ThisData, Scope } from "../scope";
import { FunctionMangler } from "../mangling";
import { SIZEOF_BOOLEAN, SIZEOF_NUMBER, SIZEOF_TSCLOSURE } from "../cppintegration/constants";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMConstant, LLVMConstantFP, LLVMValue } from "../llvm/value";
import { Declaration } from "../ts/declaration";
import { TSType } from "../ts/type";
import { CLOSURE_DEFINITION } from "../../std/constants";

export class GC {
  private readonly allocateFn: LLVMValue;
  private readonly generator: LLVMGenerator;

  constructor(declaration: Declaration, generator: LLVMGenerator) {
    this.generator = generator;

    const allocateDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "allocate")!;

    const thisType = this.generator.ts.checker.getTypeAtLocation(declaration.unwrapped);

    const { qualifiedName } = FunctionMangler.mangle(
      allocateDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      undefined,
      ["double"]
    );

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [LLVMType.getDoubleType(this.generator)];

    this.allocateFn = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName).fn;
  }

  allocate(type: LLVMType, name?: string) {
    if (type.isPointer()) {
      throw new Error(`Expected non-pointer type, got '${type.toString()}'`);
    }

    const size = type.getTypeSize();

    const returnValue = this.generator.builder.createSafeCall(this.allocateFn, [
      LLVMConstantFP.get(this.generator, size || 1),
    ]);

    return this.generator.builder.createBitCast(returnValue, type.getPointer(), name);
  }
}

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

class LazyClosure {
  private readonly tag = "__lazy_closure";

  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;

  constructor(generator: LLVMGenerator) {
    const structType = LLVMStructType.create(generator, this.tag);
    structType.setBody([LLVMType.getInt8Type(generator).getPointer()]);
    this.generator = generator;
    this.llvmType = structType.getPointer();
  }

  get type() {
    return this.llvmType;
  }

  create(env: LLVMValue) {
    const allocated = this.generator.gc.allocate(this.llvmType.getPointerElementType());
    const envPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, 0]);
    this.generator.builder.createSafeStore(env, envPtr);
    return allocated;
  }

  isLazyClosure(value: LLVMValue) {
    const nakedType = value.type.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.name?.startsWith(this.tag));
  }
}

export class BuiltinTSClosure extends Builtin {
  private readonly llvmType: LLVMType;
  private readonly tsType: TSType;
  private readonly declaration: Declaration;

  readonly lazyClosure: LazyClosure;

  constructor(generator: LLVMGenerator) {
    super("TSClosure", generator);

    const structType = LLVMStructType.create(generator, "closure");
    const syntheticBody = structType.getSyntheticBody(SIZEOF_TSCLOSURE);
    structType.setBody(syntheticBody);
    this.llvmType = structType.getPointer();

    this.lazyClosure = new LazyClosure(generator);

    const defs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === CLOSURE_DEFINITION);

    if (!defs) {
      throw new Error("No utility definitions source file found");
    }

    const classDeclaration = defs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText() === "TSClosure";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'TSClosure' declaration in std library utility definitions");
    }

    this.declaration = Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
    this.tsType = this.declaration.type;
  }

  getLLVMType(): LLVMType {
    return this.llvmType;
  }

  getTSType() {
    return this.tsType;
  }

  getLLVMCall() {
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

  getLLVMGetEnvironment() {
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

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [this.getLLVMType()];
    const { fn: getEnvironment } = this.generator.llvm.function.create(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName
    );
    return getEnvironment;
  }

  getLLVMConstructor() {
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
      ["void*", "void**", "Number*", "Number*"]
    );
    if (!isExternalSymbol) {
      throw new Error("External symbol TSClosure constructor not found");
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [
      this.getLLVMType(),
      LLVMType.getInt8Type(this.generator).getPointer(),
      LLVMType.getInt8Type(this.generator).getPointer().getPointer(),
      this.generator.builtinNumber.getLLVMType(),
      this.generator.builtinNumber.getLLVMType(),
    ];
    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return constructor;
  }

  createClosure(fn: LLVMValue, env: LLVMValue, functionDeclaraion: Declaration) {
    if (fn.type.getPointerLevel() !== 1 || !fn.type.unwrapPointer().isFunction()) {
      throw new Error("Malformed function");
    }
    if (env.type.getPointerLevel() !== 1) {
      throw new Error("Malformed environment");
    }

    const thisValue = this.generator.gc.allocate(this.getLLVMType().unwrapPointer());
    const untypedFn = this.generator.builder.asVoidStar(fn);
    const untypedEnv = this.generator.builder.asVoidStarStar(env);

    const numArgs = functionDeclaraion.parameters.length;

    if (numArgs > 63) {
      throw new Error(`Parameters limited up to 63. Error at closure creation for '${functionDeclaraion.getText()}'`);
    }

    const optionals = functionDeclaraion.parameters.reduce((acc, parameter, index) => {
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

  constructor(generator: LLVMGenerator) {
    super("number", generator);
    const structType = LLVMStructType.create(generator, "number");
    const syntheticBody = structType.getSyntheticBody(SIZEOF_NUMBER);
    structType.setBody(syntheticBody);
    this.llvmType = structType.getPointer();
  }

  private createCtorFn() {
    const declaration = this.getDeclaration();

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

  createMathFn(name: string, flags: OperationFlags = OperationFlags.Binary) {
    const declaration = this.getDeclaration();

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

    return fn;
  }

  createBooleanFn(name: string, flags: OperationFlags = OperationFlags.Binary) {
    const declaration = this.getDeclaration();

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
      throw new Error(`Number method 'toBool' for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = this.generator.builtinBoolean.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    if (flags === OperationFlags.Binary) {
      llvmArgumentTypes.push(this.llvmType);
    }

    const { fn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return fn;
  }

  createToString() {
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

  getUnboxed(value: LLVMValue) {
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
      throw new Error(`Number unbox fn for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = LLVMType.getDoubleType(this.generator);
    const llvmArgumentTypes = [this.llvmType];

    const { fn: unboxFn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return this.generator.builder.createSafeCall(unboxFn, [value]);
  }

  getLLVMType() {
    return this.llvmType;
  }

  create(value: LLVMValue) {
    const constructorFn = this.createCtorFn();

    const allocated = this.generator.gc.allocate(this.llvmType.getPointerElementType());
    const thisUntyped = this.generator.builder.asVoidStar(allocated);

    this.generator.builder.createSafeCall(constructorFn, [thisUntyped, value]);
    return allocated;
  }

  private getCloneFn() {
    const declaration = this.getDeclaration();
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

  clone(value: LLVMValue) {
    const cloneFn = this.getCloneFn();
    return this.generator.builder.createSafeCall(cloneFn, [value]);
  }
}

export class BuiltinBoolean extends Builtin {
  private readonly llvmType: LLVMType;

  constructor(generator: LLVMGenerator) {
    super("boolean", generator);
    const structType = LLVMStructType.create(generator, "boolean");
    const syntheticBody = structType.getSyntheticBody(SIZEOF_BOOLEAN);
    structType.setBody(syntheticBody);
    this.llvmType = structType.getPointer();
  }

  getLLVMType() {
    return this.llvmType;
  }

  getUnboxed(value: LLVMValue) {
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

    return this.generator.builder.createSafeCall(unboxFn, [value]);
  }

  getLLVMEquals() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();
    const llvmThisType = this.getLLVMType();

    const equalsDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "equals")!;

    const { qualifiedName } = FunctionMangler.mangle(
      equalsDeclaration,
      undefined,
      thisType,
      [thisType],
      this.generator
    );

    const llvmReturnType = this.generator.builtinBoolean.getLLVMType();
    const llvmArgumentTypes = [llvmThisType, llvmThisType];
    const { fn: equals } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return equals;
  }

  private createCtorFn() {
    const declaration = this.getDeclaration();

    const constructorDeclaration = declaration.members.find((m) => m.isConstructor())!;
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

  create(value: LLVMValue) {
    const constructorFn = this.createCtorFn();

    const allocated = this.generator.gc.allocate(this.llvmType.getPointerElementType());
    const thisUntyped = this.generator.builder.asVoidStar(allocated);

    this.generator.builder.createSafeCall(constructorFn, [thisUntyped, value]);
    return allocated;
  }

  createNegateFn() {
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

  private getCloneFn() {
    const declaration = this.getDeclaration();
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

  clone(value: LLVMValue) {
    const cloneFn = this.getCloneFn();
    return this.generator.builder.createSafeCall(cloneFn, [value]);
  }

  createToString() {
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
}

export class BuiltinIteratorResult extends Builtin {
  private readonly llvmType: LLVMType;

  constructor(declaration: Declaration, generator: LLVMGenerator) {
    super(declaration.type.mangle(), generator);

    this.llvmType = declaration.type.getLLVMType();
  }

  getLLVMType() {
    return this.llvmType;
  }

  getValueGetter(type: TSType) {
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
      [type.toCppType()]
    );

    if (!isExternalSymbol) {
      throw new Error(`External symbol for 'value' is not found at '${declaration.getText()}'`);
    }

    const llvmReturnType = type.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    const { fn: valueGetter } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return valueGetter;
  }

  getDoneGetter(type: TSType) {
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

    return doneGetter;
  }
}

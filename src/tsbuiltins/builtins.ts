import { LLVMGenerator } from "../generator";
import * as ts from "typescript";
import { ThisData, Scope } from "../scope";
import { FunctionMangler } from "../mangling";
import { SIZEOF_STRING } from "../cppintegration/constants";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMConstant, LLVMConstantFP, LLVMValue } from "../llvm/value";
import { Declaration } from "../ts/declaration";
import { TSType } from "../ts/type";

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

  allocate(type: LLVMType) {
    if (type.isPointer()) {
      throw new Error(`Expected non-pointer type, got '${type.toString()}'`);
    }

    const size = type.getTypeSize();

    const returnValue = this.generator.builder.createSafeCall(this.allocateFn, [
      LLVMConstantFP.get(this.generator, size || 1),
    ]);

    return this.generator.builder.createBitCast(returnValue, type.getPointer());
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

export class BuiltinTSTuple extends Builtin {
  constructor(declaration: Declaration, generator: LLVMGenerator) {
    super(declaration.type.mangle(), generator);
  }

  getLLVMConstructor(argTypes: TSType[]) {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const constructorDeclaration = declaration.members.find((m) => m.isConstructor())!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator
    );
    if (!isExternalSymbol) {
      throw new Error("External symbol Tuple constructor not found");
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [
      this.getLLVMType(),
      ...argTypes.map((type) => type.getLLVMType().correctCppPrimitiveType()),
    ];
    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return constructor;
  }
}

export class BuiltinTSClosure extends Builtin {
  private readonly llvmType: LLVMType;
  readonly lazyClosure: LazyClosure;

  constructor(declaration: Declaration, generator: LLVMGenerator) {
    super(declaration.type.mangle(), generator);
    this.llvmType = declaration.type.getLLVMType();

    this.lazyClosure = new LazyClosure(generator);
  }

  getLLVMType(): LLVMType {
    return this.llvmType;
  }

  getLLVMCall() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const callDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "call");

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
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const getEnvironmentDeclaration = declaration.members.find(
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
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const constructorDeclaration = declaration.members.find((m) => m.isConstructor())!;

    const argTypes = constructorDeclaration.parameters.map((p) => this.generator.ts.checker.getTypeAtLocation(p));

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator
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
    structType.setBody([LLVMType.getDoubleType(generator)]);
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

    const llvmReturnType = LLVMType.getIntNType(1, this.generator);
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

    const llvmReturnType = this.generator.builtinString.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

    const { fn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return fn;
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
}

export class BuiltinString extends Builtin {
  private readonly llvmType: LLVMType;

  constructor(generator: LLVMGenerator) {
    super("string", generator);
    const structType = LLVMStructType.create(generator, "string");
    const syntheticBody = structType.getSyntheticBody(SIZEOF_STRING);
    structType.setBody(syntheticBody);
    this.llvmType = structType.getPointer();
  }

  getLLVMType() {
    return this.llvmType;
  }

  getLLVMConstructor(constructorArg?: ts.Expression) {
    const declaration = this.getDeclaration();

    const constructorDeclaration = declaration.members.find((m) => m.isConstructor())!;
    const thisType = this.getTSType();

    const argTypes: TSType[] = constructorArg ? [this.generator.ts.checker.getTypeAtLocation(constructorArg)] : [];

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator,
      undefined,
      constructorArg ? undefined : ["signed char"]
    );

    if (!isExternalSymbol) {
      throw new Error(`String constructor for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    if (argTypes.length > 0) {
      llvmArgumentTypes.push(argTypes[0].getLLVMType().correctCppPrimitiveType());
    } else {
      llvmArgumentTypes.push(LLVMType.getInt8Type(this.generator).getPointer());
    }

    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return constructor;
  }

  getLLVMConcat() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();
    const llvmThisType = this.getLLVMType();

    const concatDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "concat")!;
    const argTypes = concatDeclaration.parameters.map((p) => this.generator.ts.checker.getTypeAtLocation(p));
    const { qualifiedName } = FunctionMangler.mangle(concatDeclaration, undefined, thisType, argTypes, this.generator);

    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer(), llvmThisType];
    const { fn: concat } = this.generator.llvm.function.create(llvmThisType, llvmArgumentTypes, qualifiedName);

    return concat;
  }

  getLLVMLength() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const lengthDeclaration = declaration.members.find((m) => m.isGetAccessor() && m.name?.getText() === "length")!;

    const { qualifiedName } = FunctionMangler.mangle(lengthDeclaration, undefined, thisType, [], this.generator);

    const llvmReturnType = this.generator.builtinNumber.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    const { fn: length } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return length;
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

    const llvmReturnType = LLVMType.getIntNType(1, this.generator);
    const llvmArgumentTypes = [llvmThisType, llvmThisType];
    const { fn: equals } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return equals;
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

    const nextDeclaration = declaration.members.find((m) => m.isGetAccessor() && m.name?.getText() === "value")!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      nextDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      [type]
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
      [type]
    );

    if (!isExternalSymbol) {
      throw new Error(`External symbol for 'value' is not found at '${declaration.getText()}'`);
    }

    const llvmReturnType = LLVMType.getIntNType(1, this.generator);
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    const { fn: doneGetter } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return doneGetter;
  }
}

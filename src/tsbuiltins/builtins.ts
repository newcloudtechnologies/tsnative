import { LLVMGenerator } from "@generator";
import * as ts from "typescript";
import { ThisData, Scope } from "@scope";
import { FunctionMangler } from "@mangling";
import { SIZEOF_STRING, SIZEOF_TSCLOSURE } from "@cpp";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMConstantInt, LLVMValue } from "../llvm/value";

export class GC {
  private readonly allocateFn: LLVMValue;
  private readonly generator: LLVMGenerator;

  constructor(declaration: ts.ClassDeclaration, generator: LLVMGenerator) {
    this.generator = generator;

    const allocateDeclaration = declaration.members.find(
      (m) => ts.isMethodDeclaration(m) && m.name.getText() === "allocate"
    )!;

    const thisType = this.generator.ts.checker.getTypeAtLocation(declaration);

    const { qualifiedName } = FunctionMangler.mangle(
      allocateDeclaration,
      undefined,
      thisType,
      [this.generator.builtinUInt32.getTSType()],
      this.generator
    );

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [LLVMType.getInt32Type(this.generator)];

    this.allocateFn = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName).fn;
  }

  allocate(type: LLVMType) {
    if (type.isPointer()) {
      throw new Error(`Expected non-pointer type, got '${type.toString()}'`);
    }

    const size = type.getTypeSize();
    const returnValue = this.generator.builder.createSafeCall(this.allocateFn, [
      LLVMConstantInt.get(this.generator, size > 0 ? size : 1, 32),
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

  getDeclaration(): ts.ClassDeclaration {
    if (!this.thisData) {
      this.init();
    }
    return this.thisData!.declaration as ts.ClassDeclaration;
  }

  private init(): void {
    const clazz = this.generator.symbolTable.get(this.name);
    this.thisData = (clazz as Scope).thisData;
  }
}

export class BuiltinInt8 extends Builtin {
  constructor(generator: LLVMGenerator) {
    super("int8_t", generator);
  }

  getLLVMType() {
    return LLVMType.getInt8Type(this.generator);
  }
}

export class BuiltinUInt32 extends Builtin {
  constructor(generator: LLVMGenerator) {
    super("uint32_t", generator);
  }

  getLLVMType() {
    return LLVMType.getInt32Type(this.generator);
  }
}

class LazyClosure {
  private readonly tag = "__lazy_closure";

  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;

  constructor(generator: LLVMGenerator) {
    const structType = LLVMStructType.create(generator, this.tag);
    structType.setBody([]);
    this.generator = generator;
    this.llvmType = structType.getPointer();
  }

  get type() {
    return this.llvmType;
  }

  get create() {
    return this.generator.gc.allocate(this.llvmType.getPointerElementType());
  }

  isLazyClosure(value: LLVMValue) {
    const nakedType = value.type.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.name?.startsWith(this.tag));
  }
}

export class BuiltinTSClosure extends Builtin {
  private readonly llvmType: LLVMType;
  readonly lazyClosure: LazyClosure;

  constructor(generator: LLVMGenerator) {
    super("TSClosure__class", generator);
    const structType = LLVMStructType.create(generator, "TSClosure__class");
    const syntheticBody = structType.getSyntheticBody(SIZEOF_TSCLOSURE);
    structType.setBody(syntheticBody);
    this.llvmType = structType.getPointer();

    this.lazyClosure = new LazyClosure(generator);
  }

  getLLVMType(): LLVMType {
    return this.llvmType;
  }

  getLLVMCall() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const callDeclaration = declaration.members.find((m) => ts.isMethodDeclaration(m) && m.name.getText() === "call");

    if (!callDeclaration) {
      throw new Error("No function declaration for TSClosure.call provided");
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      callDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      "operator()()"
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
      (m) => ts.isMethodDeclaration(m) && m.name.getText() === "getEnvironment"
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

    const constructorDeclaration = declaration.members.find((m) =>
      ts.isConstructorDeclaration(m)
    ) as ts.ConstructorDeclaration;

    if (!constructorDeclaration) {
      throw new Error("No constructor declaration provided for TSClosure");
    }

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
      LLVMType.getInt32Type(this.generator),
    ];
    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return constructor;
  }

  createClosure(fn: LLVMValue, env: LLVMValue, numArgs: number) {
    if (fn.type.getPointerLevel() !== 1 || !fn.type.unwrapPointer().isFunction()) {
      throw new Error("Malformed function");
    }
    if (env.type.getPointerLevel() !== 1) {
      throw new Error("Malformed environment");
    }

    const thisValue = this.generator.gc.allocate(this.getLLVMType().unwrapPointer());
    const untypedFn = this.generator.builder.asVoidStar(fn);
    const untypedEnv = this.generator.builder.asVoidStarStar(env);

    const constructor = this.getLLVMConstructor();
    this.generator.builder.createSafeCall(constructor, [
      thisValue,
      untypedFn,
      untypedEnv,
      LLVMConstantInt.get(this.generator, numArgs, 32),
    ]);
    return thisValue;
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
    const llvmThisType = this.getLLVMType();

    const constructorDeclaration = declaration.members.find(ts.isConstructorDeclaration)!;
    const thisType = this.getTSType();

    const argType = constructorArg
      ? this.generator.ts.checker.getTypeAtLocation(constructorArg)
      : this.generator.builtinInt8.getTSType();

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      [argType],
      this.generator
    );

    if (!isExternalSymbol) {
      console.log("--- argType:", argType.toCppType());
      throw new Error(`String constructor for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = llvmThisType;
    const llvmArgumentType = constructorArg
      ? argType.getLLVMType().correctCppPrimitiveType()
      : this.generator.builtinInt8.getLLVMType().getPointer();

    const llvmArgumentTypes = [llvmThisType, llvmArgumentType];
    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return constructor;
  }

  getLLVMConcat() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();
    const llvmThisType = this.getLLVMType();

    const concatDeclaration = declaration.members.find(
      (m) => ts.isMethodDeclaration(m) && m.name.getText() === "concat"
    );
    const argTypes = (concatDeclaration! as ts.MethodDeclaration).parameters.map((p) =>
      this.generator.ts.checker.getTypeAtLocation(p)
    );
    const { qualifiedName } = FunctionMangler.mangle(concatDeclaration!, undefined, thisType, argTypes, this.generator);

    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer(), llvmThisType];
    const { fn: concat } = this.generator.llvm.function.create(llvmThisType, llvmArgumentTypes, qualifiedName);

    return concat;
  }

  getLLVMLength() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();
    const llvmThisType = this.getLLVMType();

    const lengthDeclaration = declaration.members.find((m) => ts.isGetAccessor(m) && m.name.getText() === "length");

    const { qualifiedName } = FunctionMangler.mangle(lengthDeclaration!, undefined, thisType, [], this.generator);

    const llvmReturnType = LLVMType.getInt32Type(this.generator);
    const llvmArgumentTypes = [llvmThisType];
    const { fn: length } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return length;
  }

  getLLVMEquals() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();
    const llvmThisType = this.getLLVMType();

    const equalsDeclaration = declaration.members.find(
      (m) => ts.isMethodDeclaration(m) && m.name.getText() === "equals"
    );

    const { qualifiedName } = FunctionMangler.mangle(
      equalsDeclaration!,
      undefined,
      thisType,
      [thisType],
      this.generator,
      "operator=="
    );

    const llvmReturnType = LLVMType.getIntNType(1, this.generator);
    const llvmArgumentTypes = [llvmThisType, llvmThisType];
    const { fn: equals } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return equals;
  }
}

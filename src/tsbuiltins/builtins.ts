import { LLVMGenerator } from "@generator";
import {
  getTypeSize,
  createLLVMFunction,
  error,
  unwrapPointerType,
  getPointerLevel,
  getLLVMType,
  correctCppPrimitiveType,
  checkIfLLVMArray,
  checkIfLLVMString,
  isTSClosureType,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { ThisData, Scope } from "@scope";
import { FunctionMangler } from "@mangling";

export class GC {
  private readonly allocateFn: llvm.Function;
  private readonly generator: LLVMGenerator;

  constructor(declaration: ts.ClassDeclaration, generator: LLVMGenerator) {
    this.generator = generator;

    const allocateDeclaration = declaration.members.find(
      (m) => ts.isMethodDeclaration(m) && m.name.getText() === "allocate"
    )!;

    const thisType = this.generator.checker.getTypeAtLocation(declaration);

    const { qualifiedName } = FunctionMangler.mangle(
      allocateDeclaration,
      undefined,
      thisType,
      [this.generator.builtinUInt32.getTSType()],
      this.generator
    );

    const llvmReturnType = llvm.Type.getInt8PtrTy(this.generator.context);
    const llvmArgumentTypes = [llvm.Type.getInt32Ty(this.generator.context)];
    const { fn: allocateFn } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
    );

    this.allocateFn = allocateFn;
  }

  allocate(type: llvm.Type) {
    if (type.isPointerTy()) {
      error("Expected non-pointer type");
    }

    const size = getTypeSize(type, this.generator);
    const returnValue = this.generator.xbuilder.createSafeCall(this.allocateFn, [size]);

    return this.generator.builder.createBitCast(returnValue, type.getPointerTo());
  }
}

export class SizeOf {
  private readonly arraySizeFn: llvm.Function;
  private readonly closureSizeFn: llvm.Function;
  private readonly stringSizeFn: llvm.Function;

  private readonly generator: LLVMGenerator;

  constructor(declaration: ts.ClassDeclaration, generator: LLVMGenerator) {
    this.generator = generator;

    this.arraySizeFn = this.getSizeFn(declaration, "array");
    this.closureSizeFn = this.getSizeFn(declaration, "closure");
    this.stringSizeFn = this.getSizeFn(declaration, "string");
  }

  private getSizeFn(declaration: ts.ClassDeclaration, functionName: string) {
    const functionDeclaration = declaration.members.find(
      (m) => ts.isMethodDeclaration(m) && m.name.getText() === functionName
    )!;

    const thisType = this.generator.checker.getTypeAtLocation(declaration);

    const { qualifiedName } = FunctionMangler.mangle(functionDeclaration, undefined, thisType, [], this.generator);

    const llvmReturnType = llvm.Type.getInt32Ty(this.generator.context);
    const { fn } = createLLVMFunction(llvmReturnType, [], qualifiedName, this.generator.module);

    return fn;
  }

  private array() {
    return this.generator.xbuilder.createSafeCall(this.arraySizeFn, []);
  }
  private closure() {
    return this.generator.xbuilder.createSafeCall(this.closureSizeFn, []);
  }
  private string() {
    return this.generator.xbuilder.createSafeCall(this.stringSizeFn, []);
  }

  getByLLVMType(type: llvm.Type): llvm.Value | undefined {
    if (checkIfLLVMString(type)) {
      return this.string();
    } else if (checkIfLLVMArray(type)) {
      return this.array();
    } else if (isTSClosureType(type)) {
      return this.closure();
    }

    return;
  }

  getByName(name: string): llvm.Value | undefined {
    if (name === "string") {
      return this.string();
    } else if (name.startsWith("Array__")) {
      return this.array();
    } else if (name.startsWith("TSClosure__class")) {
      return this.closure();
    }

    return;
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

  getTSType(): ts.Type {
    if (!this.thisData) {
      this.init();
    }
    const { checker } = this.generator;
    return checker.getTypeAtLocation(this.thisData!.declaration!);
  }

  getLLVMType(): llvm.PointerType | llvm.IntegerType {
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

  getLLVMType(): llvm.IntegerType {
    return llvm.Type.getInt8Ty(this.generator.context);
  }
}

export class BuiltinUInt32 extends Builtin {
  constructor(generator: LLVMGenerator) {
    super("uint32_t", generator);
  }

  getLLVMType(): llvm.IntegerType {
    return llvm.Type.getInt32Ty(this.generator.context);
  }
}

export class BuiltinTSClosure extends Builtin {
  private readonly llvmType: llvm.PointerType;
  constructor(generator: LLVMGenerator) {
    super("TSClosure__class", generator);
    const structType = llvm.StructType.create(generator.context, "TSClosure__class");
    // Don't really care about how this struct is represented. Allocator will take known size ignoring struct body.
    structType.setBody([]);
    this.llvmType = structType.getPointerTo();
  }

  getLLVMType(): llvm.PointerType {
    return this.llvmType;
  }

  getLLVMCall() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const callDeclaration = declaration.members.find((m) => ts.isMethodDeclaration(m) && m.name.getText() === "call");

    if (!callDeclaration) {
      error("No function declaration for TSClosure.call provided");
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
      error("External symbol for ts closure call not found");
    }

    const llvmReturnType = llvm.Type.getInt8PtrTy(this.generator.context);
    const llvmArgumentTypes = [this.getLLVMType()];
    const { fn: call } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
    return call;
  }

  getLLVMGetEnvironment() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const getEnvironmentDeclaration = declaration.members.find(
      (m) => ts.isMethodDeclaration(m) && m.name.getText() === "getEnvironment"
    );

    if (!getEnvironmentDeclaration) {
      error("No function declaration for TSClosure.getEnvironment provided");
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      getEnvironmentDeclaration,
      undefined,
      thisType,
      [],
      this.generator
    );
    if (!isExternalSymbol) {
      error("External symbol for TSClosure.getEnvironment not found");
    }

    const llvmReturnType = llvm.Type.getInt8PtrTy(this.generator.context);
    const llvmArgumentTypes = [this.getLLVMType()];
    const { fn: getEnvironment } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
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
      error("No constuctor declaration provided for TSClosure");
    }

    const argTypes = constructorDeclaration.parameters.map((p) => this.generator.checker.getTypeAtLocation(p));

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator
    );
    if (!isExternalSymbol) {
      error("External symbol TSClosure constructor not found");
    }

    const llvmReturnType = llvm.Type.getVoidTy(this.generator.context);
    const llvmArgumentTypes = [
      this.getLLVMType(),
      llvm.Type.getInt8PtrTy(this.generator.context),
      llvm.Type.getInt8PtrTy(this.generator.context).getPointerTo(),
      llvm.Type.getInt32Ty(this.generator.context),
    ];
    const { fn: constructor } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
    );
    return constructor;
  }

  createClosure(fn: llvm.Value, env: llvm.Value, numArgs: number) {
    if (getPointerLevel(fn.type) !== 1 || !unwrapPointerType(fn.type).isFunctionTy()) {
      error("Malformed function");
    }
    if (getPointerLevel(env.type) !== 1) {
      error("Malformed environment");
    }

    const thisValue = this.generator.gc.allocate(unwrapPointerType(this.getLLVMType()));
    const untypedFn = this.generator.xbuilder.asVoidStar(fn);
    const untypedEnv = this.generator.xbuilder.asVoidStarStar(env);

    const constructor = this.getLLVMConstructor();
    this.generator.xbuilder.createSafeCall(constructor, [
      thisValue,
      untypedFn,
      untypedEnv,
      llvm.ConstantInt.get(this.generator.context, numArgs, 32),
    ]);
    return thisValue;
  }
}

export class BuiltinString extends Builtin {
  private readonly llvmType: llvm.PointerType;
  constructor(generator: LLVMGenerator) {
    super("string", generator);
    const structType = llvm.StructType.create(generator.context, "string");
    // Don't really care about how this struct is represented. Allocator will take known size ignoring struct body.
    structType.setBody([]);
    this.llvmType = structType.getPointerTo();
  }

  getLLVMType(): llvm.PointerType {
    return this.llvmType;
  }

  getLLVMConstructor(expression: ts.Expression, constructorArg?: ts.Expression): llvm.Function {
    const declaration = this.getDeclaration();
    const llvmThisType = this.getLLVMType();

    const constructorDeclaration = declaration.members.find(ts.isConstructorDeclaration)!;
    const thisType = this.generator.checker.getTypeAtLocation(expression);

    const argType = constructorArg
      ? this.generator.checker.getTypeAtLocation(constructorArg)
      : this.generator.builtinInt8.getTSType();

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      [argType],
      this.generator
    );

    if (!isExternalSymbol) {
      error(`String constructor for '${this.generator.checker.typeToString(thisType)}' not found`);
    }

    const llvmReturnType = llvmThisType;
    const llvmArgumentType = constructorArg
      ? correctCppPrimitiveType(getLLVMType(argType, constructorArg, this.generator))
      : this.generator.builtinInt8.getLLVMType().getPointerTo();

    const llvmArgumentTypes = [llvmThisType, llvmArgumentType];
    const { fn: constructor } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
    );

    return constructor;
  }

  getLLVMConcat(expression: ts.Expression): llvm.Function {
    const declaration = this.getDeclaration();
    const thisType = this.generator.checker.getTypeAtLocation(expression);
    const llvmThisType = this.getLLVMType();

    const concatDeclaration = declaration.members.find(
      (m) => ts.isMethodDeclaration(m) && m.name.getText() === "concat"
    );
    const argTypes = (concatDeclaration! as ts.MethodDeclaration).parameters.map((p) =>
      this.generator.checker.getTypeAtLocation(p)
    );
    const { qualifiedName } = FunctionMangler.mangle(concatDeclaration!, undefined, thisType, argTypes, this.generator);

    const llvmArgumentTypes = [llvm.Type.getInt8PtrTy(this.generator.context), llvmThisType];
    const { fn: concat } = createLLVMFunction(llvmThisType, llvmArgumentTypes, qualifiedName, this.generator.module);

    return concat;
  }

  getLLVMLength(expression: ts.Expression): llvm.Function {
    const declaration = this.getDeclaration();
    const thisType = this.generator.checker.getTypeAtLocation(expression);
    const llvmThisType = this.getLLVMType();

    const lengthDeclaration = declaration.members.find((m) => ts.isGetAccessor(m) && m.name.getText() === "length");

    const { qualifiedName } = FunctionMangler.mangle(lengthDeclaration!, undefined, thisType, [], this.generator);

    const llvmReturnType = llvm.Type.getInt32Ty(this.generator.context);
    const llvmArgumentTypes = [llvmThisType];
    const { fn: length } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
    return length;
  }

  getLLVMEquals(expression: ts.Expression): llvm.Function {
    const declaration = this.getDeclaration();
    const thisType = this.generator.checker.getTypeAtLocation(expression);
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

    const llvmReturnType = llvm.Type.getInt1Ty(this.generator.context);
    const llvmArgumentTypes = [llvmThisType, llvmThisType];
    const { fn: equals } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
    return equals;
  }
}

import { LLVMGenerator } from "@generator";
import { getTypeSize, createLLVMFunction, getSyntheticBody } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { ThisData, Scope } from "@scope";
import { FunctionMangler } from "@mangling";
import { SIZEOF_STRING } from "@cpp";

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
    const size = getTypeSize(type, this.generator.module);
    const returnValue = this.generator.xbuilder.createSafeCall(this.allocateFn, [
      llvm.ConstantInt.get(this.generator.context, size > 0 ? size : 1, 32),
    ]);

    return this.generator.builder.createBitCast(returnValue, type.isPointerTy() ? type : type.getPointerTo());
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
    return this.thisData!.type as llvm.PointerType;
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

export class BuiltinString extends Builtin {
  private readonly llvmType: llvm.PointerType;
  constructor(generator: LLVMGenerator) {
    super("string", generator);
    const structType = llvm.StructType.create(generator.context, "string");
    const syntheticBody = getSyntheticBody(SIZEOF_STRING, generator.context);
    structType.setBody(syntheticBody);
    this.llvmType = structType.getPointerTo();
  }

  getLLVMType(): llvm.PointerType {
    return this.llvmType;
  }

  getLLVMConstructor(expression: ts.Expression): llvm.Function {
    const declaration = this.getDeclaration();
    const llvmThisType = this.getLLVMType();

    const constructorDeclaration = declaration.members.find(ts.isConstructorDeclaration)!;
    const thisType = this.generator.checker.getTypeAtLocation(expression);
    const { qualifiedName } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      [this.generator.builtinInt8.getTSType()],
      this.generator
    );
    const llvmReturnType = llvmThisType;
    const llvmArgumentTypes = [llvmThisType, this.generator.builtinInt8.getLLVMType().getPointerTo()];
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

    const { qualifiedName } = FunctionMangler.mangle(concatDeclaration!, undefined, thisType, [], this.generator);

    const llvmReturnType = llvmThisType;
    const llvmArgumentTypes = [llvmThisType, llvmThisType, llvmThisType];
    const { fn: concat } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
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

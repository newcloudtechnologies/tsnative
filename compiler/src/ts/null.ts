import { LLVMGenerator } from "../generator";
import * as ts from "typescript";
import { Declaration } from "./declaration";
import { FunctionMangler } from "../mangling";
import { LLVMType } from "../llvm/type";
import { LLVMConstant, LLVMGlobalVariable, LLVMValue } from "../llvm/value";

const stdlib = require("std/constants");

export class TSNull {
  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;
  private readonly declaration: Declaration;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.NULL_DEFINITION);
    if (!stddefs) {
      throw new Error("No null definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(stddefs) === "Null";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Null' declaration in std library definitions");
    }

    this.declaration = Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);

    this.llvmType = this.declaration.getLLVMStructType("null");
  }

  init() {
    const nullInstanceDeclaration = this.declaration.members.find((m) => m.name?.getText() === "instance");

    if (!nullInstanceDeclaration) {
      throw new Error(`Unable to find 'instance' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      nullInstanceDeclaration,
      undefined,
      this.declaration.type,
      [],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'instance' for 'Null'`);
    }

    const llvmReturnType = this.getLLVMType();
    const llvmArgumentTypes: LLVMType[] = [];

    const { fn: instanceFn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    const instance = this.generator.builder.createSafeCall(instanceFn, []);

    const nullValue = LLVMConstant.createNullValue(this.llvmType, this.generator);
    const globalNull = LLVMGlobalVariable.make(this.generator, this.llvmType, false, nullValue, "null_constant");

    this.generator.builder.createSafeStore(instance, globalNull);

    this.generator.symbolTable.globalScope.set("null", globalNull, true);
  }

  getLLVMType() {
    return this.llvmType;
  }

  get() {
    const ptr = this.generator.symbolTable.globalScope.get("null") as LLVMValue;
    return this.generator.builder.createLoad(ptr);
  }
}

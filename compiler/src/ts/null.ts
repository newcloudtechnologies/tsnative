/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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
    const undefinedCtorDeclaration = this.declaration.members.find((m) => m.isConstructor());

    if (!undefinedCtorDeclaration) {
      throw new Error(`Unable to find constructor at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      undefinedCtorDeclaration,
      undefined,
      this.declaration.type,
      [],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx constructor for 'Null'`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

    const { fn: ctor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    const allocated = this.generator.gc.allocateObject(this.llvmType.getPointerElementType());
    const thisUntyped = this.generator.builder.asVoidStar(allocated);

    this.generator.builder.createSafeCall(ctor, [thisUntyped]);

    const nullValue = LLVMConstant.createNullValue(this.llvmType, this.generator);
    const globalNull = LLVMGlobalVariable.make(this.generator, this.llvmType, false, nullValue, "null_constant");
    this.generator.builder.createSafeStore(this.generator.builder.createLoad(allocated), globalNull);

    this.generator.symbolTable.globalScope.set("null", globalNull);
    this.generator.gc.removeRoot(globalNull);
    this.generator.gc.addRoot(thisUntyped);
  }

  getLLVMType() {
    return this.llvmType;
  }

  get() {
    const ptr = this.generator.symbolTable.globalScope.get("null") as LLVMValue;
    return this.generator.builder.createLoad(ptr);
  }
}

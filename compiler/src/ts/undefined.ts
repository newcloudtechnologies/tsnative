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
import { Declaration } from "./declaration";
import { FunctionMangler } from "../mangling";
import { LLVMType } from "../llvm/type";
import { LLVMConstant, LLVMGlobalVariable, LLVMValue } from "../llvm/value";

const stdlib = require("std/constants");

export class TSUndefined {
  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;
  private readonly declaration: Declaration;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.UNDEFINED_DEFINITION);

    if (!stddefs) {
      throw new Error("No undefined definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(stddefs) === "Undefined";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Undefined' declaration in std library definitions");
    }

    this.declaration = Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);

    this.llvmType = this.declaration.getLLVMStructType("undefined");
  }

  init() {
    const undefinedInstanceDeclaration = this.declaration.members.find((m) => m.name?.getText() === "instance");

    if (!undefinedInstanceDeclaration) {
      throw new Error(`Unable to find 'instance' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      undefinedInstanceDeclaration,
      undefined,
      this.declaration.type,
      [],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'instance' for 'Undefined'`);
    }

    const llvmReturnType = this.getLLVMType();
    const llvmArgumentTypes: LLVMType[] = [];

    const { fn: instanceFn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    const instance = this.generator.builder.createSafeCall(instanceFn, []);

    const nullValue = LLVMConstant.createNullValue(this.llvmType, this.generator);
    const globalUndef = LLVMGlobalVariable.make(this.generator, this.llvmType, false, nullValue, "undefined_constant");
    this.generator.builder.createSafeStore(instance, globalUndef);

    this.generator.symbolTable.globalScope.set("undefined", globalUndef, true);
  }

  getLLVMType() {
    return this.llvmType;
  }

  get() {
    const ptr = this.generator.symbolTable.globalScope.get("undefined") as LLVMValue;
    return this.generator.builder.createLoad(ptr);
  }
}

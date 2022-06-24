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
import { LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMConstant, LLVMGlobalVariable, LLVMValue } from "../llvm/value";
import { SIZEOF_UNDEFINED } from "../cppintegration";

const stdlib = require("std/constants");

export class TSUndefined {
  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    const structType = LLVMStructType.create(generator, "undefined");
    const syntheticBody = structType.getSyntheticBody(SIZEOF_UNDEFINED);
    structType.setBody(syntheticBody);
    this.llvmType = structType.getPointer();
  }

  init() {
    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.UNDEFINED_DEFINITION);
    if (!stddefs) {
      throw new Error("No undefined definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText() === "Undefined";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Undefined' declaration in std library definitions");
    }

    const wrappedDeclaration = Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
    const undefinedCtorDeclaration = wrappedDeclaration.members.find((m) => m.isConstructor());

    if (!undefinedCtorDeclaration) {
      throw new Error(`Unable to find constructor at '${wrappedDeclaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      undefinedCtorDeclaration,
      undefined,
      wrappedDeclaration.type,
      [],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx constructor for 'Undefined'`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

    const { fn: ctor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    const allocated = this.generator.gc.allocate(this.llvmType.getPointerElementType());
    const thisUntyped = this.generator.builder.asVoidStar(allocated);

    this.generator.builder.createSafeCall(ctor, [thisUntyped]);

    const nullValue = LLVMConstant.createNullValue(this.llvmType, this.generator);
    const globalUndef = LLVMGlobalVariable.make(this.generator, this.llvmType, false, nullValue, "undefined_constant");
    this.generator.builder.createSafeStore(this.generator.builder.createLoad(allocated), globalUndef);

    this.generator.symbolTable.globalScope.set("undefined", globalUndef);
  }

  getLLVMType() {
    return this.llvmType;
  }

  get() {
    const ptr = this.generator.symbolTable.globalScope.get("undefined") as LLVMValue;
    return this.generator.builder.createLoad(ptr);
  }
}

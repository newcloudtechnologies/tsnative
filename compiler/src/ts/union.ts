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
import { LLVMValue } from "../llvm/value";

const stdlib = require("std/constants");

export class TSUnion {
  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;
  private readonly declaration: Declaration;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.UNION_DEFINITION);
    if (!stddefs) {
      throw new Error("No union definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(stddefs) === "Union";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Union' declaration in std library definitions");
    }

    this.declaration = Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
    this.llvmType = this.declaration.getLLVMStructType("union");
  }

  private getCtorFn() {
    const ctorDeclaration = this.declaration.members.find((m) => m.isConstructor());

    if (!ctorDeclaration) {
      throw new Error(`Unable to find constructor at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      ctorDeclaration,
      undefined,
      this.declaration.type,
      [],
      this.generator,
      undefined,
      ["Object*"]
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx constructor for 'Union'`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [
      LLVMType.getInt8Type(this.generator).getPointer(),
      LLVMType.getInt8Type(this.generator).getPointer(),
    ];

    const { fn: ctor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return ctor;
  }

  private getGetFn() {
    const getDeclaration = this.declaration.members.find((m) => m.name?.getText() === "getValue");

    if (!getDeclaration) {
      throw new Error(`Unable to find 'get' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      getDeclaration,
      undefined,
      this.declaration.type,
      [],
      this.generator,
      undefined
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'get' for 'Union'`);
    }

    const llvmReturnType = this.generator.ts.obj.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

    const { fn: get } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return get;
  }

  private getSetFn() {
    const setDeclaration = this.declaration.members.find((m) => m.name?.getText() === "setValue");

    if (!setDeclaration) {
      throw new Error(`Unable to find 'get' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      setDeclaration,
      undefined,
      this.declaration.type,
      [],
      this.generator,
      undefined,
      ["Object*"]
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'set' for 'Union'`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [
      LLVMType.getInt8Type(this.generator).getPointer(),
      LLVMType.getInt8Type(this.generator).getPointer(),
    ];

    const { fn: set } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return set;
  }

  private getToBoolFn() {
    const toBoolDeclaration = this.declaration.members.find((m) => m.name?.getText() === "toBool");

    if (!toBoolDeclaration) {
      throw new Error(`Unable to find constructor at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      toBoolDeclaration,
      undefined,
      this.declaration.type,
      [],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find 'toBool' for 'Union'`);
    }

    const llvmReturnType = this.generator.builtinBoolean.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

    const { fn: toBool } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return toBool;
  }

  create(initializer?: LLVMValue) {
    const ctor = this.getCtorFn();

    const allocated = this.generator.gc.allocateObject(this.llvmType.getPointerElementType());
    const thisUntyped = this.generator.builder.asVoidStar(allocated);
    const args = [thisUntyped];

    initializer = initializer || this.generator.ts.undef.get();
    const initializerUntyped = this.generator.builder.asVoidStar(initializer);
    args.push(initializerUntyped);

    this.generator.builder.createSafeCall(ctor, args);

    return allocated;
  }

  get(union: LLVMValue) {
    const get = this.getGetFn();
    const thisUntyped = this.generator.builder.asVoidStar(union.derefToPtrLevel1());

    return this.generator.builder.createSafeCall(get, [thisUntyped]);
  }

  set(union: LLVMValue, value: LLVMValue) {
    const set = this.getSetFn();
    const thisUntyped = this.generator.builder.asVoidStar(union.derefToPtrLevel1());
    const valueUntyped = this.generator.builder.asVoidStar(value.derefToPtrLevel1());

    return this.generator.builder.createSafeCall(set, [thisUntyped, valueUntyped]);
  }

  toBool(union: LLVMValue) {
    const toBool = this.getToBoolFn();
    const thisUntyped = this.generator.builder.asVoidStar(union);

    return this.generator.builder.createSafeCall(toBool, [thisUntyped]);
  }

  getLLVMType() {
    return this.llvmType;
  }

  getDeclaration() {
    return this.declaration;
  }
}

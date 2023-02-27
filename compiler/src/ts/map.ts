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

export class TSMap {
  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;
  private readonly declaration: Declaration;

  private readonly constructorFns = new Map<string, LLVMValue>();
  private readonly setFns = new Map<string, LLVMValue>();

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    this.declaration = this.initClassDeclaration();
    this.llvmType = this.declaration.getLLVMStructType("map");
  }

  private initClassDeclaration() {
    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.MAP_DEFINITION);

    if (!stddefs) {
      throw new Error("No Map definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(stddefs) === "Map";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Map' declaration in std library definitions");
    }

    return Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
  }

  private getCtorFn(templateTypes: string[]) {
    const id = templateTypes.join();

    if (this.constructorFns.has(id)) {
      return this.constructorFns.get(id)!;
    }

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
      templateTypes
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx constructor for 'Map' and argument of type 'String*' and 'void*'`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

    const { fn: ctor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    this.constructorFns.set(id, ctor);

    return ctor;
  }

  private getSetFn(templateTypes: string[]) {
    const id = templateTypes.join();

    if (this.setFns.has(id)) {
      return this.setFns.get(id)!;
    }

    const setDeclaration = this.declaration.members.find((m) => m.name?.getText() === "set");

    if (!setDeclaration) {
      throw new Error(`Unable to find 'set' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      setDeclaration,
      undefined,
      this.declaration.type,
      [],
      this.generator,
      templateTypes,
      templateTypes
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'set' for 'Map' and argument of types 'String*' and 'void*'`);
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [
      LLVMType.getInt8Type(this.generator).getPointer(),
      this.generator.ts.str.getLLVMType(),
      LLVMType.getInt8Type(this.generator).getPointer(),
    ];

    const { fn: set } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    this.setFns.set(id, set);

    return set;
  }

  create(templateTypes: string[]) {
    const allocated = this.generator.gc.allocate(this.llvmType.getPointerElementType());
    const thisUntyped = this.generator.builder.asVoidStar(allocated);

    const ctor = this.getCtorFn(templateTypes);

    this.generator.builder.createSafeCall(ctor, [thisUntyped]);

    return allocated;
  }

  set(thisValue: LLVMValue, key: LLVMValue, value: LLVMValue, templateTypes: string[]) {
    const set = this.getSetFn(templateTypes);
    const thisUntyped = this.generator.builder.asVoidStar(thisValue);

    return this.generator.builder.createSafeCall(set, [thisUntyped, key, value]);
  }
}

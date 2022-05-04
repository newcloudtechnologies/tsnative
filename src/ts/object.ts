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
import { OBJECT_DEFINITION } from "../../std/constants";
import { Declaration } from "./declaration";
import { FunctionMangler } from "../mangling";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";
import { SIZEOF_OBJECT } from "../cppintegration";

export class TSObject {
  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;
  private readonly declaration: Declaration;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === OBJECT_DEFINITION);
    if (!stddefs) {
      throw new Error("No object definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText() === "Object";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Object' declaration in std library definitions");
    }

    this.declaration = Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);

    const structType = LLVMStructType.create(generator, "object");
    const syntheticBody = [this.generator.builtinNumber.getLLVMType(), this.generator.builtinNumber.getLLVMType()]; //structType.getSyntheticBody(SIZEOF_OBJECT);
    structType.setBody(syntheticBody);
    this.llvmType = structType.getPointer();
  }

  private getCtorFn(isDefault: boolean) {
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
      isDefault ? undefined : ["Map<String*, void*>*"]
    );

    if (!isExternalSymbol) {
      throw new Error("Unable to find cxx constructor for 'Object'");
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

    if (!isDefault) {
      llvmArgumentTypes.push(LLVMType.getInt8Type(this.generator).getPointer());
    }

    const { fn: ctor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return ctor;
  }

  private getSetFn() {
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
      undefined,
      ["String*", "void*"]
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'set' for 'Object'`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [
      LLVMType.getInt8Type(this.generator).getPointer(),
      this.generator.ts.str.getLLVMType(),
      LLVMType.getInt8Type(this.generator).getPointer(),
    ];

    const { fn: set } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return set;
  }

  private getGetFn() {
    const getDeclaration = this.declaration.members.find((m) => m.name?.getText() === "get");

    if (!getDeclaration) {
      throw new Error(`Unable to find 'get' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      getDeclaration,
      undefined,
      this.declaration.type,
      [this.generator.ts.str.getDeclaration().type],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'get' for 'Object'`);
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer(), this.generator.ts.str.getLLVMType()];

    const { fn: get } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return get;
  }

  create(props?: LLVMValue) {
    const allocated = this.generator.gc.allocate(this.llvmType.getPointerElementType());

    const thisUntyped = this.generator.builder.asVoidStar(allocated);

    const args = [thisUntyped];
    if (props) {
      const propsUntyped = this.generator.builder.asVoidStar(props);
      args.push(propsUntyped);
    }

    const ctor = this.getCtorFn(!props);

    this.generator.builder.createSafeCall(ctor, args);

    return allocated;
  }

  get(thisValue: LLVMValue, key: string) {
    const get = this.getGetFn();
    const thisUntyped = this.generator.builder.asVoidStar(thisValue);
    const llvmKey = this.generator.ts.str.create(key);

    return this.generator.builder.createSafeCall(get, [thisUntyped, llvmKey]);
  }

  set(thisValue: LLVMValue, key: LLVMValue, value: LLVMValue) {
    const set = this.getSetFn();

    const thisUntyped = this.generator.builder.asVoidStar(thisValue);
    const valueUntyped = this.generator.builder.asVoidStar(value);

    return this.generator.builder.createSafeCall(set, [thisUntyped, key, valueUntyped]);
  }

  getLLVMType() {
    return this.llvmType;
  }

  getTSType() {
    return this.declaration.type;
  }
}

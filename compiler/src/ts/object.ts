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
import { LLVMValue } from "../llvm/value";

const stdlib = require("std/constants");

export class TSObject {
  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;
  private readonly declaration: Declaration;

  private readonly ctorFn: LLVMValue;
  private readonly defaultCtorFn: LLVMValue;
  private readonly getFn: LLVMValue;
  private readonly setFn: LLVMValue;
  private readonly keysFn: LLVMValue;
  private readonly copyPropsFn: LLVMValue;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    this.declaration = this.initClassDeclaration();
    this.llvmType = this.declaration.getLLVMStructType("object");

    const { ctor, defaultCtor } = this.initCtors();
    this.ctorFn = ctor;
    this.defaultCtorFn = defaultCtor;

    this.getFn = this.initGetFn();
    this.setFn = this.initSetFn();
    this.keysFn = this.initKeysFn();
    this.copyPropsFn = this.initCopyPropsFn();
  }

  private initClassDeclaration() {
    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.OBJECT_DEFINITION);

    if (!stddefs) {
      throw new Error("No object definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(stddefs) === "Object";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Object' declaration in std library definitions");
    }

    return Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
  }

  private initCtors() {
    const ctorDeclaration = this.declaration.members.find((m) => m.isConstructor());

    if (!ctorDeclaration) {
      throw new Error(`Unable to find constructor at '${this.declaration.getText()}'`);
    }

    const { qualifiedName: defaultCtorQualifiedName, isExternalSymbol: isDefaultConstructorExternalSymbol } = FunctionMangler.mangle(
      ctorDeclaration,
      undefined,
      this.declaration.type,
      [],
      this.generator
    );

    if (!isDefaultConstructorExternalSymbol) {
      throw new Error("Unable to find default constructor CXX for 'Object'");
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

    const { fn: defaultCtor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, defaultCtorQualifiedName);

    const { qualifiedName: constructorQualifiedName, isExternalSymbol: isConstructorExternalSymbol } = FunctionMangler.mangle(
      ctorDeclaration,
      undefined,
      this.declaration.type,
      [],
      this.generator,
      undefined,
      ["Map<String*, void*>*"]
    );

    if (!isConstructorExternalSymbol) {
      throw new Error("Unable to find constructor CXX for 'Object'");
    }

    llvmArgumentTypes.push(LLVMType.getInt8Type(this.generator).getPointer());

    const { fn: ctor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, constructorQualifiedName);

    return { ctor, defaultCtor };
  }


  private initSetFn() {
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

  private initGetFn() {
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

  private initKeysFn() {
    const keysDeclaration = this.declaration.members.find((m) => m.name?.getText() === "keys");

    if (!keysDeclaration) {
      throw new Error(`Unable to find 'keys' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      keysDeclaration,
      undefined,
      undefined,
      [this.declaration.type],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'keys' for 'Object'`);
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(keysDeclaration);
    const tsReturnType = signature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const llvmArgumentTypes = [this.llvmType];

    const { fn: keys } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return keys;
  }

  private initCopyPropsFn() {
    const copyPropsDeclaration = this.declaration.members.find((m) => m.name?.getText() === "copyPropsTo");

    if (!copyPropsDeclaration) {
      throw new Error(`Unable to find 'copyPropsTo' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      copyPropsDeclaration,
      undefined,
      this.declaration.type,
      [this.declaration.type],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'copyPropsTo' for 'Object'`);
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(copyPropsDeclaration);
    const tsReturnType = signature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const llvmArgumentTypes = [this.llvmType, this.llvmType];

    const { fn: copyProps } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return copyProps;
  }

  private getCtorFn(isDefault: boolean) {
    if (isDefault) {
      return this.defaultCtorFn;
    }

    return this.ctorFn;
  }

  copyProps(source: LLVMValue, target: LLVMValue) {
    const castedSource = this.generator.builder.createBitCast(
      source,
      this.llvmType
    );

    const castedTarget = this.generator.builder.createBitCast(
      target,
      this.llvmType
    );

    this.generator.builder.createSafeCall(this.copyPropsFn, [castedSource, castedTarget]);
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

  getKeys(obj: LLVMValue): LLVMValue {
    const castedObject = this.generator.builder.createBitCast(
      obj,
      this.generator.ts.obj.getLLVMType()
    );

    return this.generator.builder.createSafeCall(this.keysFn, [castedObject]);
  }

  get(thisValue: LLVMValue, key: string) {
    const thisUntyped = this.generator.builder.asVoidStar(thisValue);
    const llvmKey = this.generator.ts.str.create(key);

    return this.generator.builder.createSafeCall(this.getFn, [thisUntyped, llvmKey]);
  }

  set(thisValue: LLVMValue, key: string, value: LLVMValue) {
    const thisUntyped = this.generator.builder.asVoidStar(thisValue);
    const valueUntyped = this.generator.builder.asVoidStar(value);

    const wrappedKey = this.generator.ts.str.create(key);

    return this.generator.builder.createSafeCall(this.setFn, [thisUntyped, wrappedKey, valueUntyped]);
  }

  getLLVMType() {
    return this.llvmType;
  }

  getTSType() {
    return this.declaration.type;
  }
}

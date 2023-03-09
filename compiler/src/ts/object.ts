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
import { Declaration } from "./declaration";
import { FunctionMangler } from "../mangling";
import { LLVMArrayType, LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";

import * as ts from "typescript";
import * as llvm from "llvm-node";

const stdlib = require("std/constants");

export class TSObject {
  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;
  private readonly declaration: Declaration;

  private ctorFn: LLVMValue | undefined;
  private defaultCtorFn: LLVMValue | undefined;
  private getFn: LLVMValue | undefined;
  private setFn: LLVMValue | undefined;
  private keysFn: LLVMValue | undefined;
  private copyPropsFn: LLVMValue | undefined;
  private operatorInFn: LLVMValue | undefined;
  private isUndefinedFn: LLVMValue | undefined;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    this.declaration = this.initClassDeclaration();
    this.llvmType = this.declaration.getLLVMStructType("object");
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
      ["Map<String*, Object*>*"]
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
      [this.generator.ts.str.getDeclaration().type, this.declaration.type],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'set' for 'Object'`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [
      this.getLLVMType(),
      this.generator.ts.str.getLLVMType(),
      this.getLLVMType(),
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

    const llvmReturnType = this.getLLVMType();
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
      this.generator.ts.obj.getTSType(),
      [this.generator.ts.obj.getTSType()],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'keys' for 'Object'`);
    }

    const llvmReturnType = LLVMType.getCXXVoidStarType(this.generator);
    const llvmArgumentTypes = [LLVMType.getCXXVoidStarType(this.generator)];

    const { fn: keys } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return keys;
  }

  private initTypeCheckerFn(name: string) {
    const declaration = this.declaration.members.find((m) => m.name?.getText() === name);

    if (!declaration) {
      throw new Error(`Unable to find '${name}' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      declaration,
      undefined,
      this.generator.ts.obj.getTSType(),
      [this.generator.ts.obj.getTSType()],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx '${name}' for 'Object'`);
    }

    const llvmReturnType = LLVMType.getCXXVoidStarType(this.generator);
    const llvmArgumentTypes = [LLVMType.getCXXVoidStarType(this.generator)];

    const { fn: result } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return result;
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

  private initOperatorInFn() {
    const operatorInDeclaration = this.declaration.members.find((m) => m.name?.getText() === "operatorIn");

    if (!operatorInDeclaration) {
      throw new Error(`Unable to find 'operatorIn' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      operatorInDeclaration,
      undefined,
      this.declaration.type,
      [this.generator.ts.str.getDeclaration().type],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Unable to find cxx 'operatorIn' for 'Object'`);
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer(), this.generator.ts.str.getLLVMType()];

    const { fn: operatorIn } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return operatorIn;
  }

  private getVPtrFn(thisValue: LLVMValue, functionName: string) {
    const vtables = this.generator.builder.createBitCast(
      thisValue,
      LLVMType.getInt8Type(this.generator).getPointer().getPointer()
    );

    const vtable = this.generator.builder.createLoad(vtables);
    const vtableAsArray = this.generator.builder.createBitCast(
      vtable,
      LLVMArrayType.get(
        this.generator,
        LLVMType.getInt8Type(this.generator).getPointer(),
        this.declaration.vtableSize
      ).getPointer()
    );

    const methodDeclaration = this.declaration.members.find((m) => m.name?.getText() === functionName);

    if (!methodDeclaration) {
      throw new Error(`Unable to find '${functionName}' at '${this.declaration.getText()}'`);
    }

    const virtualFnPtr = this.generator.builder.createSafeInBoundsGEP(vtableAsArray, [
      0,
      methodDeclaration.vtableIndex
    ]);

    return virtualFnPtr;
  }

  private getEqualsFunctionPtr(thisValue: LLVMValue) {
    const cxxVoidStarType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [cxxVoidStarType, cxxVoidStarType];

    const type = llvm.FunctionType.get(
      cxxVoidStarType.unwrapped,
      llvmArgumentTypes.map((t) => t.unwrapped),
      false
    ).getPointerTo().getPointerTo();

    let eqFn = this.getVPtrFn(thisValue, "equals");
    eqFn = this.generator.builder.createBitCast(eqFn, LLVMType.make(type, this.generator));

    return this.generator.builder.createLoad(eqFn);
  }

  private getToBoolFunctionPtr(thisValue: LLVMValue) {
    const cxxVoidStarType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [cxxVoidStarType];

    const type = llvm.FunctionType.get(
      cxxVoidStarType.unwrapped,
      llvmArgumentTypes.map((t) => t.unwrapped),
      false
    ).getPointerTo().getPointerTo();

    let toBoolFn = this.getVPtrFn(thisValue, "toBool");
    toBoolFn = this.generator.builder.createBitCast(toBoolFn, LLVMType.make(type, this.generator));

    return this.generator.builder.createLoad(toBoolFn);
  }

  private getToStringFunctionPtr(thisValue: LLVMValue) {
    const cxxVoidStarType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [cxxVoidStarType];

    const type = llvm.FunctionType.get(
      cxxVoidStarType.unwrapped,
      llvmArgumentTypes.map((t) => t.unwrapped),
      false
    ).getPointerTo().getPointerTo();

    let toStringFn = this.getVPtrFn(thisValue, "toString");
    toStringFn = this.generator.builder.createBitCast(toStringFn, LLVMType.make(type, this.generator));

    return this.generator.builder.createLoad(toStringFn);
  }

  private getCtorFn(isDefault: boolean) {
    if (!this.ctorFn || !this.defaultCtorFn) {
      const { ctor, defaultCtor } = this.initCtors();
      this.ctorFn = ctor;
      this.defaultCtorFn = defaultCtor;
    }

    if (isDefault) {
      return this.defaultCtorFn;
    }

    return this.ctorFn;
  }

  copyProps(source: LLVMValue, target: LLVMValue) {
    if (!this.copyPropsFn) {
      this.copyPropsFn = this.initCopyPropsFn();
    }

    const castedSource = this.generator.builder.createBitCast(
      source.derefToPtrLevel1(),
      this.llvmType
    );

    const castedTarget = this.generator.builder.createBitCast(
      target.derefToPtrLevel1(),
      this.llvmType
    );

    this.generator.builder.createSafeCall(this.copyPropsFn, [castedSource, castedTarget]);
  }

  create(props?: LLVMValue) {
    let allocated = this.generator.gc.allocate(this.llvmType.getPointerElementType());
    allocated = this.createInplace(allocated, props);
    return allocated;
  }

  createInplace(memory: LLVMValue, props?: LLVMValue) {
    const thisUntyped = this.generator.builder.asVoidStar(memory);

    const args = [thisUntyped];
    if (props) {
      const propsUntyped = this.generator.builder.asVoidStar(props);
      args.push(propsUntyped);
    }

    const ctor = this.getCtorFn(!props);

    this.generator.builder.createSafeCall(ctor, args);

    return memory;
  }

  getKeys(obj: LLVMValue): LLVMValue {
    if (!this.keysFn) {
      this.keysFn = this.initKeysFn();
    }

    const castedObject = this.generator.builder.createBitCast(
      obj.derefToPtrLevel1(),
      LLVMType.getCXXVoidStarType(this.generator)
    );

    const keys = this.generator.builder.createSafeCall(this.keysFn, [castedObject]);
    return this.generator.builder.createBitCast(keys, this.generator.ts.array.getLLVMType());
  }

  get(thisValue: LLVMValue, key: string) {
    if (!this.getFn) {
      this.getFn = this.initGetFn();
    }

    const thisUntyped = this.generator.builder.asVoidStar(thisValue.derefToPtrLevel1());
    const llvmKey = this.generator.ts.str.create(key);

    const value = this.generator.builder.createSafeCall(this.getFn, [thisUntyped, llvmKey]);
    return value;
  }

  set(thisValue: LLVMValue, key: string, value: LLVMValue) {
    if (!this.setFn) {
      this.setFn = this.initSetFn();
    }

    const thisUntyped = this.generator.builder.createBitCast(thisValue.derefToPtrLevel1(), this.llvmType);
    const valueUntyped = this.generator.builder.createBitCast(value.derefToPtrLevel1(), this.llvmType);

    const wrappedKey = this.generator.ts.str.create(key);

    return this.generator.builder.createSafeCall(this.setFn, [thisUntyped, wrappedKey, valueUntyped]);
  }

  equals(lhs: LLVMValue, rhs: LLVMValue) {
    const equalsFn = this.getEqualsFunctionPtr(lhs);

    const thisUntyped = this.generator.builder.asVoidStar(lhs);
    const valueUntyped = this.generator.builder.asVoidStar(rhs);

    let result = this.generator.builder.createSafeCall(equalsFn, [thisUntyped, valueUntyped]);
    result = this.generator.builder.createBitCast(result, this.generator.builtinBoolean.getLLVMType());

    return result;
  }

  objectToString(thisValue: LLVMValue) {
    const toStringFn = this.getToStringFunctionPtr(thisValue);

    const thisUntyped = this.generator.builder.asVoidStar(thisValue);

    let result = this.generator.builder.createSafeCall(toStringFn, [thisUntyped]);
    result = this.generator.builder.createBitCast(result, this.generator.ts.str.getLLVMType());

    return result;
  }

  toBool(thisValue: LLVMValue) {
    thisValue = thisValue.derefToPtrLevel1();

    const toBoolFn = this.getToBoolFunctionPtr(thisValue);

    const thisUntyped = this.generator.builder.asVoidStar(thisValue);

    let result = this.generator.builder.createSafeCall(toBoolFn, [thisUntyped]);
    result = this.generator.builder.createBitCast(result, this.generator.builtinBoolean.getLLVMType());

    return result;
  }

  createOperatorIn(thisValue: LLVMValue, key: LLVMValue) {
    if (!this.operatorInFn) {
      this.operatorInFn = this.initOperatorInFn();
    }

    const thisUntyped = this.generator.builder.asVoidStar(thisValue);
    return this.generator.builder.createSafeCall(this.operatorInFn, [thisUntyped, key]);
  }

  createIsUndefined(thisValue: LLVMValue) {
    if (!this.isUndefinedFn) {
      this.isUndefinedFn = this.initTypeCheckerFn("isUndefined");
    }

    const thisUntyped = this.generator.builder.asVoidStar(thisValue);
    const result = this.generator.builder.createSafeCall(this.isUndefinedFn, [thisUntyped]);
    return this.generator.builder.createBitCast(result, this.generator.builtinBoolean.getLLVMType());
  }

  getLLVMType() {
    return this.llvmType;
  }

  getTSType() {
    return this.declaration.type;
  }
}

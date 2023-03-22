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
import { TSType } from "./type";

const stdlib = require("std/constants");

export class TSString {
  private readonly generator: LLVMGenerator;
  private readonly declaration: Declaration;
  private readonly llvmType: LLVMType;
  
  private readonly constructorFns = new Map<string, LLVMValue>();
  private subscriptFn : LLVMValue | undefined;
  private lengthFn: LLVMValue | undefined;
  private concatFn: LLVMValue | undefined;
  private cloneFn: LLVMValue | undefined;
  private negateFn: LLVMValue | undefined;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    this.declaration = this.initClassDeclaration();
    this.llvmType = this.declaration.getLLVMStructType("string");
  }

  private initClassDeclaration() {
    const defs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.STRING_DEFINITION);

    if (!defs) {
      throw new Error("No string definition source file found");
    }

    const classDeclaration = defs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(defs) === "String";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'String' declaration in std library definitions");
    }

    return Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
  }

  private initConcatFn() {
    const declaration = this.getDeclaration();
    const thisType = declaration.type;
    const llvmThisType = this.getLLVMType();

    const concatDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "concat")!;
    const argTypes = concatDeclaration.parameters.map((p) => this.generator.ts.checker.getTypeAtLocation(p));
    const { qualifiedName } = FunctionMangler.mangle(concatDeclaration, undefined, thisType, argTypes, this.generator);

    const llvmArgumentTypes = [
      LLVMType.getInt8Type(this.generator).getPointer(),
      LLVMType.getInt8Type(this.generator).getPointer(),
    ];
    const { fn: concat } = this.generator.llvm.function.create(llvmThisType, llvmArgumentTypes, qualifiedName);

    return concat;
  }

  private initLengthFn() {
    const declaration = this.getDeclaration();
    const thisType = declaration.type;

    const lengthDeclaration = declaration.members.find((m) => m.isGetAccessor() && m.name?.getText() === "length");
    if (!lengthDeclaration) {
      throw new Error(`Unable to find 'length' at '${declaration.getText()}'`);
    }

    const { qualifiedName } = FunctionMangler.mangle(lengthDeclaration, undefined, thisType, [], this.generator);

    const llvmReturnType = this.generator.builtinNumber.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    const { fn: length } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return length;
  }

  private initCloneFn() {
    const declaration = this.getDeclaration();
    const thisType = declaration.type;
    const llvmThisType = this.getLLVMType();

    const equalsDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "clone")!;

    const { qualifiedName } = FunctionMangler.mangle(
      equalsDeclaration,
      undefined,
      thisType,
      [thisType],
      this.generator
    );

    const llvmReturnType = llvmThisType;
    const llvmArgumentTypes = [llvmThisType];
    const { fn: clone } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return clone;
  }

  private initNegateFn() {
    const declaration = this.getDeclaration();
    const thisType = declaration.type;
    const llvmThisType = this.getLLVMType();

    const equalsDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "negate")!;

    const { qualifiedName } = FunctionMangler.mangle(
      equalsDeclaration,
      undefined,
      thisType,
      [thisType],
      this.generator
    );

    const llvmReturnType = this.generator.builtinNumber.getLLVMType();
    const llvmArgumentTypes = [llvmThisType];
    const { fn: result } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return result;
  }

  getTSType() {
    return this.declaration.type;
  }

  getLLVMType() {
    return this.llvmType;
  }

  getDeclaration() {
    return this.declaration;
  }

  getLLVMConstructor(constructorArg?: ts.Expression) {
    const declaration = this.getDeclaration();

    const id = !constructorArg ? "default" : this.generator.ts.checker.getTypeAtLocation(constructorArg).toString();

    if (this.constructorFns.has(id)) {
      return this.constructorFns.get(id)!;
    }

    const constructorDeclaration = declaration.members.find((m) => m.isConstructor())!;
    const thisType = declaration.type;

    const argTypes: TSType[] = constructorArg ? [this.generator.ts.checker.getTypeAtLocation(constructorArg)] : [];

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator,
      undefined,
      constructorArg ? undefined : ["char"]
    );

    if (!isExternalSymbol) {
      throw new Error(`String constructor for '${thisType.toString()}' not found`);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    if (argTypes.length > 0) {
      llvmArgumentTypes.push(argTypes[0].getLLVMType());
    } else {
      llvmArgumentTypes.push(LLVMType.getInt8Type(this.generator).getPointer());
    }

    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    this.constructorFns.set(id, constructor);

    return constructor;
  }

  createConcat(lhs: LLVMValue, rhs: LLVMValue) {
    const concatFn = this.getLLVMConcat();
    const lhsVoidStar = this.generator.builder.asVoidStar(lhs.derefToPtrLevel1());
    const rhsVoidStar = this.generator.builder.asVoidStar(rhs.derefToPtrLevel1());
    const result = this.generator.builder.createSafeCall(concatFn, [lhsVoidStar, rhsVoidStar]);
    return this.generator.builder.createBitCast(result, this.getLLVMType());
  }

  private getLLVMConcat() {
    if (!this.concatFn) {
      this.concatFn = this.initConcatFn();
    }

    return this.concatFn;
  }

  createNegate(thisValue: LLVMValue) {
    if (!this.negateFn) {
      this.negateFn = this.initNegateFn();
    }

    return this.generator.builder.createSafeCall(this.negateFn, [thisValue.derefToPtrLevel1()]);
  }

  getLLVMLength() {
    if (!this.lengthFn) {
      this.lengthFn = this.initLengthFn();
    }

    return this.lengthFn;
  }

  create(value: string) {
    const llvmThisType = this.llvmType;
    const constructor = this.getLLVMConstructor();
    const ptr = this.generator.builder.createGlobalStringPtr(value);
    const allocated = this.generator.gc.allocate(llvmThisType.getPointerElementType());
    const thisUntyped = this.generator.builder.asVoidStar(allocated);
    this.generator.builder.createSafeCall(constructor, [thisUntyped, ptr]);
    return allocated;
  }

  clone(value: LLVMValue) {
    if (!this.cloneFn) {
      this.cloneFn = this.initCloneFn();
    }

    return this.generator.builder.createSafeCall(this.cloneFn, [value]);
  }

  createSubscription() {
    if (this.subscriptFn) {
      return this.subscriptFn;
    }

    const stringType = this.generator.ts.str.getTSType();
    const valueDeclaration = stringType.getSymbol().valueDeclaration;
    if (!valueDeclaration) {
      throw new Error("No declaration for String found");
    }
    const declaration = valueDeclaration.members.find((m) => m.isIndexSignature())!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      declaration,
      undefined,
      stringType,
      [this.generator.builtinNumber.getTSType()],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`String 'subscription' for type '${stringType.toString()}' not found`);
    }

    const { fn: subscript } = this.generator.llvm.function.create(
      this.generator.ts.str.getLLVMType(),
      [LLVMType.getInt8Type(this.generator).getPointer(), this.generator.builtinNumber.getLLVMType()],
      qualifiedName
    );

    this.subscriptFn = subscript;

    return subscript;
  }
}

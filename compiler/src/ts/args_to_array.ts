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
import { LLVMConstantInt, LLVMValue } from "../llvm/value";
import { FunctionMangler } from "../mangling/functionmangler";
import { LLVMType } from "../llvm/type";
import { Declaration } from "./declaration";

const stdlib = require("std/constants");

export class ArgsToArray {
  private readonly generator: LLVMGenerator;
  private readonly classDeclaration: Declaration;
  private readonly llvmType: LLVMType;

  private constructorFn: LLVMValue;
  private addObjectFn: LLVMValue;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    this.classDeclaration = this.initClassDeclaration();
    this.constructorFn = this.findConstructor();
    this.addObjectFn = this.findAddObject();

    this.llvmType = this.classDeclaration.getLLVMStructType("args_to_array");
  }

  // TODO Can be generalized with other classes?
  private initClassDeclaration() {
    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.ARGS_TO_ARRAY_DEFINITION);
    if (!stddefs) {
      throw new Error("No ArgsToArray definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(stddefs) === "ArgsToArray";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find ArgsToArray in std library definitions");
    }

    return Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
  }

  private findConstructor() : LLVMValue {
    const constructorDeclaration = this.classDeclaration.members.find((m) => m.isConstructor())!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      this.classDeclaration.type,
      [],
      this.generator,
      undefined,
      ["Array<Object*>*"]
    );
    if (!isExternalSymbol) {
      throw new Error(`ArgsToArray::constructor not found`);
    }

    const voidStarType = LLVMType.getInt8Type(this.generator).getPointer();
    const { fn: constructor } = this.generator.llvm.function.create(
        LLVMType.getVoidType(this.generator),
        [voidStarType, voidStarType],
        qualifiedName);

    return constructor;
  }

  private findAddObject() {
    const addObjectDeclaration = this.classDeclaration.members.find((m) => m.isMethod() && m.name?.getText() === "addObject")!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
        addObjectDeclaration,
        undefined,
        this.classDeclaration.type,
        [],
        this.generator,
        undefined,
        ["Object*, Boolean*"]
      );
      if (!isExternalSymbol) {
        throw new Error(`ArgsToArray::addObject not found`);
      }
  
      const voidStarType = LLVMType.getInt8Type(this.generator).getPointer();
      const objectType = this.generator.ts.obj.getLLVMType();
      const boolType = this.generator.builtinBoolean.getLLVMType();

      const { fn: addObjectFn } = this.generator.llvm.function.create(
          LLVMType.getVoidType(this.generator),
          [voidStarType, objectType, boolType],
          qualifiedName);
  
      return addObjectFn;
  }

  getLLVMType() {
    return this.llvmType;
  }

  callConstructor(memory: LLVMValue, arr: LLVMValue) {
    const memoryVoidStar = this.generator.builder.asVoidStar(memory);
    const arrVoidStar = this.generator.builder.asVoidStar(arr);
    this.generator.builder.createSafeCall(this.constructorFn, [memoryVoidStar, arrVoidStar]);
  }

  callAddObject(thisPtr: LLVMValue, obj: LLVMValue, isSpread: boolean) {
    const thisVoidStar = this.generator.builder.asVoidStar(thisPtr);
    const castedObjPtr = this.generator.builder.createBitCast(obj, this.generator.ts.obj.getLLVMType());

    const spreadConstant = isSpread ? LLVMConstantInt.getTrue(this.generator) : LLVMConstantInt.getFalse(this.generator)
    const spreadPtr = this.generator.builtinBoolean.createStack(spreadConstant);

    this.generator.builder.createSafeCall(this.addObjectFn, [thisVoidStar, castedObjPtr, spreadPtr]);
  }
}

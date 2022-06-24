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
import { LLVMValue } from "../llvm/value";
import { SIZEOF_STRING } from "../cppintegration";
import { TSType } from "./type";

const stdlib = require("std/constants");

export class TSString {
  private readonly generator: LLVMGenerator;
  private readonly declaration: Declaration;
  private readonly llvmType: LLVMType;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

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

    this.declaration = Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);

    const structType = LLVMStructType.create(generator, "string");
    const syntheticBody = structType.getSyntheticBody(SIZEOF_STRING);
    structType.setBody(syntheticBody);
    this.llvmType = structType.getPointer();
  }

  getLLVMType() {
    return this.llvmType;
  }

  getDeclaration() {
    return this.declaration;
  }

  getLLVMConstructor(constructorArg?: ts.Expression) {
    const declaration = this.getDeclaration();

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
      constructorArg ? undefined : ["signed char"]
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

    return constructor;
  }

  getLLVMConcat() {
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

  getLLVMLength() {
    const declaration = this.getDeclaration();
    const thisType = declaration.type;

    const lengthDeclaration = declaration.members.find((m) => m.isGetAccessor() && m.name?.getText() === "length")!;

    const { qualifiedName } = FunctionMangler.mangle(lengthDeclaration, undefined, thisType, [], this.generator);

    const llvmReturnType = this.generator.builtinNumber.getLLVMType();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    const { fn: length } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return length;
  }

  getLLVMEquals() {
    const declaration = this.getDeclaration();
    const thisType = declaration.type;
    const llvmThisType = this.getLLVMType();

    const equalsDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "equals");
    if (!equalsDeclaration) {
      throw new Error(`Unable to find 'equals' at '${declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      equalsDeclaration,
      undefined,
      thisType,
      [thisType],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error("Unable to find external symbol for 'String.equals'");
    }

    const llvmReturnType = this.generator.builtinBoolean.getLLVMType();
    const llvmArgumentTypes = [llvmThisType, llvmThisType];
    const { fn: equals } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return equals;
  }

  private getCloneFn() {
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
    const cloneFn = this.getCloneFn();
    return this.generator.builder.createSafeCall(cloneFn, [value]);
  }
}

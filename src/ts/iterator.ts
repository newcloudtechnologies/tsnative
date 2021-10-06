/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { LLVMGenerator } from "../generator";
import { LLVMType } from "../llvm/type";
import { FunctionMangler } from "../mangling";
import * as ts from "typescript";
import { TSType } from "./type";

export class TSIterator {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  getNext(expression: ts.Expression, genericType: TSType) {
    const type = this.generator.ts.checker.getTypeAtLocation(expression);

    const symbol = type.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;

    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.getText()}'`);
    }

    const iteratorDeclaration = valueDeclaration.members.find((m) => m.name?.getText() === "[Symbol.iterator]")!;
    const signature = this.generator.ts.checker.getSignatureFromDeclaration(iteratorDeclaration);

    const returnType = signature.getReturnType();

    const declaration = returnType.getSymbol().valueDeclaration!;
    const thisType = returnType;

    const nextDeclaration = declaration.members.find((m) => m.name?.getText() === "next")!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      nextDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      [genericType]
    );

    if (!isExternalSymbol) {
      throw new Error(`External symbol for 'next' is not found at '${declaration.getText()}'`);
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    const { fn: next } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return next;
  }
}

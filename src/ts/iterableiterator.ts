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
import * as ts from "typescript";
import { FunctionMangler } from "../mangling/functionmangler";
import { LLVMType } from "../llvm/type";

export class TSIterableIterator {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  createIterator(expression: ts.Expression) {
    const type = this.generator.ts.checker.getTypeAtLocation(expression);

    const symbol = type.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;

    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.getText()}'`);
    }

    const iteratorDeclaration = valueDeclaration.members.find((m) => m.name?.getText() === "[Symbol.iterator]")!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      iteratorDeclaration,
      expression,
      type,
      [],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Iterator for type '${type.toString()}' not found`);
    }

    const parentScope = valueDeclaration.getScope(type);
    if (!parentScope.thisData) {
      throw new Error("No 'this' data found");
    }

    const { fn: iterator } = this.generator.llvm.function.create(
      LLVMType.getInt8Type(this.generator).getPointer(),
      [LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    return iterator;
  }
}

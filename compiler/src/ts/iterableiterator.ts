/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
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

    const { fn: iterator } = this.generator.llvm.function.create(
      LLVMType.getInt8Type(this.generator).getPointer(),
      [LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    return iterator;
  }
}

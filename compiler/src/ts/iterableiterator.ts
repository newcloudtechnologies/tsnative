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
import { FunctionMangler } from "../mangling/functionmangler";
import { LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";
import { Declaration } from "./declaration";

export class TSIterableIterator {
  private readonly generator: LLVMGenerator;

  private readonly iteratorFns = new Map<string, LLVMValue>();

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  createIterator(valueDeclaration: Declaration, knownGenericTypes?: string[]) {
    let id = valueDeclaration.type.toString();
    if (knownGenericTypes) {
      id += knownGenericTypes.join();
    }

    if (this.iteratorFns.has(id)) {
      return this.iteratorFns.get(id)!;
    }

    const iteratorDeclaration = valueDeclaration.members.find((m) => m.name?.getText() === "[Symbol.iterator]");

    if (!iteratorDeclaration) {
      throw new Error(`Unable to find '[Symbol.iterator]' at '${valueDeclaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      iteratorDeclaration,
      undefined,
      valueDeclaration.type,
      [],
      this.generator,
      knownGenericTypes
    );

    if (!isExternalSymbol) {
      throw new Error(`Iterator for declaration '${valueDeclaration.getText()}' not found`);
    }

    const { fn: iterator } = this.generator.llvm.function.create(
      LLVMType.getInt8Type(this.generator).getPointer(),
      [LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    this.iteratorFns.set(id, iterator);

    return iterator;
  }
}

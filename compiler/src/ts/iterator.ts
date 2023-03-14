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
import { LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";
import { FunctionMangler } from "../mangling";
import { TSType } from "./type";
import { Declaration } from "./declaration";

export class TSIterator {
  private readonly generator: LLVMGenerator;

  private readonly nextFns = new Map<string, LLVMValue>();

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  // Create iterator next() method getter function
  getNext(iteratorDeclaration: Declaration, genericType: TSType) : LLVMValue {
    const id = iteratorDeclaration.type.toString() + genericType.toString();

    if (this.nextFns.has(id)) {
      const iteratorFn = this.nextFns.get(id);
      if (!iteratorFn) {
        throw new Error(`Can't happen: Map.has() returned true and Map.get() returned undefined`);
      }
      return iteratorFn;
    }
    const thisType = this.generator.ts.checker.getTypeAtLocation(iteratorDeclaration.unwrapped);

    const nextDeclaration = iteratorDeclaration.members.find((m) => m.name?.getText() === "next");
    if (!nextDeclaration) {
      throw new Error(`Symbol for 'next' is not found at '${iteratorDeclaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      nextDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      [genericType.toCppType()]
    );

    if (!isExternalSymbol) {
      throw new Error(`External symbol for 'next' is not found at '${iteratorDeclaration.getText()}'`);
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    const { fn: next } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    this.nextFns.set(id, next);

    return next;
  }
}

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

  getNext(valueDeclaration: Declaration, genericType: TSType) {
    const id = valueDeclaration.type.toString() + genericType.toString();

    if (this.nextFns.has(id)) {
      return this.nextFns.get(id)!;
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
      [genericType.toCppType()]
    );

    if (!isExternalSymbol) {
      throw new Error(`External symbol for 'next' is not found at '${declaration.getText()}'`);
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];
    const { fn: next } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    this.nextFns.set(id, next);

    return next;
  }
}

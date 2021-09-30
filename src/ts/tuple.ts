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

export class TSTuple {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  createSubscription(expression: ts.ElementAccessExpression) {
    const tupleType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const valueDeclaration = tupleType.getSymbol().valueDeclaration;
    if (!valueDeclaration) {
      throw new Error("No declaration for Tuple found");
    }
    const declaration = valueDeclaration.members.find((m) => m.isIndexSignature())!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      declaration,
      expression,
      tupleType,
      [], // @todo?
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Tuple 'subscription' for type '${tupleType.toString()}' not found`);
    }

    const retType = LLVMType.getInt8Type(this.generator).getPointer(); // void*; caller have to perform cast

    const { fn: subscript } = this.generator.llvm.function.create(
      retType,
      [LLVMType.getInt8Type(this.generator).getPointer(), LLVMType.getDoubleType(this.generator)],
      qualifiedName
    );

    return subscript;
  }
}

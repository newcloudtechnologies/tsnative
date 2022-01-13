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
import { FunctionMangler } from "../mangling/functionmangler";
import { LLVMType } from "../llvm/type";
import { TSType } from "./type";
import * as ts from "typescript";

export class TSTuple {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  createSubscription(tupleType: TSType) {
    const valueDeclaration = tupleType.getSymbol().valueDeclaration;
    if (!valueDeclaration) {
      throw new Error("No declaration for Tuple found");
    }
    const declaration = valueDeclaration.members.find((m) => m.isIndexSignature())!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      declaration,
      undefined,
      tupleType,
      [this.generator.builtinNumber.getTSType()],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Tuple 'subscription' for type '${tupleType.toString()}' not found`);
    }

    const retType = LLVMType.getInt8Type(this.generator).getPointer(); // void*; caller have to perform cast

    const { fn: subscript } = this.generator.llvm.function.create(
      retType,
      [LLVMType.getInt8Type(this.generator).getPointer(), this.generator.builtinNumber.getLLVMType()],
      qualifiedName
    );

    return subscript;
  }

  // Actually a better place for this method is in ts.Node's wrapper which is yet not written
  static isTupleFromVariableDeclaration(node: ts.Node) {
    return Boolean(ts.isVariableDeclaration(node.parent) && node.parent.type && ts.isTupleTypeNode(node.parent.type));
  }

  // Actually a better place for this method is in ts.Node's wrapper which is yet not written
  static isTupleFromAssignment(node: ts.Node) {
    return Boolean(
      ts.isArrayLiteralExpression(node) &&
        ts.isBinaryExpression(node.parent) &&
        node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isArrayLiteralExpression(node.parent.left)
    );
  }
}

/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { castToInt32AndBack, Conversion, emitBinaryWithConversion, isConvertible } from "@emitter";
import { LLVMGenerator } from "@generator";
import { error } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export class BitwiseEmitter {
  emitBitwiseAnd(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], generator, ([leftInt, rightInt]) =>
        generator.builder.createAnd(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createAnd(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createAnd,
        generator
      );
    }

    return error("Invalid operand types to bitwise AND");
  }

  emitBitwiseOr(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], generator, ([leftInt, rightInt]) =>
        generator.builder.createOr(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createOr(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createOr,
        generator
      );
    }

    return error("Invalid operand types to bitwise OR");
  }

  emitBitwiseXor(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], generator, ([leftInt, rightInt]) =>
        generator.builder.createXor(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createXor(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createXor,
        generator
      );
    }

    return error("Invalid operand types to bitwise XOR");
  }

  emitLeftShift(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], generator, ([leftInt, rightInt]) =>
        generator.builder.createShl(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createShl(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createShl,
        generator
      );
    }

    return error("Invalid operand types to left shift");
  }

  emitRightShift(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], generator, ([leftInt, rightInt]) =>
        generator.builder.createAShr(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createAShr(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createAShr,
        generator
      );
    }

    return error("Invalid operand types to right shift");
  }

  emitLogicalRightShift(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], generator, ([leftInt, rightInt]) =>
        generator.builder.createLShr(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createLShr(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createLShr,
        generator
      );
    }

    return error("Invalid operand types to logical right shift");
  }
}

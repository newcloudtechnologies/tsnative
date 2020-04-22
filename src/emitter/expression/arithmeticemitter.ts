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

import { getBuiltin } from "@builtins";
import { isSigned } from "@cpp";
import { Conversion, emitBinaryWithConversion, isConvertible, promoteIntegralToFP } from "@emitter";
import { LLVMGenerator } from "@generator";
import { error, isLLVMString } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export class ArithmeticEmitter {
  emitBinaryPlus(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFAdd(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createAdd(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createAdd,
        generator
      );
    }

    if (isLLVMString(left.type) && isLLVMString(right.type)) {
      const concat = getBuiltin("string__concat", generator.context, generator.module);
      return generator.builder.createCall(concat.callee, [left, right]);
    }

    return error("Invalid operand types to binary plus");
  }

  emitBinaryMinus(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFSub(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createSub(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createSub,
        generator
      );
    }

    return error("Invalid operand types to binary minus");
  }

  emitMultiply(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFMul(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createMul(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFMul,
        generator
      );
    }

    return error("Invalid operand types to multiply");
  }

  emitDivision(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    let left: llvm.Value = generator.emitExpression(lhs);
    let right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFDiv(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      const doubleType = llvm.Type.getDoubleTy(generator.context);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, generator), generator);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, generator), generator);
      return generator.builder.createFDiv(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFDiv,
        generator
      );
    }

    return error("Invalid operand types to division");
  }

  emitModulo(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    let left: llvm.Value = generator.emitExpression(lhs);
    let right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFRem(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      const doubleType = llvm.Type.getDoubleTy(generator.context);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, generator), generator);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, generator), generator);
      return generator.builder.createFRem(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFRem,
        generator
      );
    }

    return error("Invalid operand types to modulo");
  }
}

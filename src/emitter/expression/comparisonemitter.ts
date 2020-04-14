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
import { bothSigned, bothUnsigned, isSigned } from "@cpp";
import {
  castFPToIntegralType,
  Conversion,
  emitBinaryWithConversion,
  isConvertible,
  promoteIntegralToFP
} from "@emitter";
import { LLVMGenerator } from "@generator";
import { error, isLLVMString } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export class ComparisonEmitter {
  emitStrictEquals(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    let right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFCmpOEQ(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createICmpEQ(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isDoubleTy()) {
      const signed = isSigned(lhs, generator);
      right = castFPToIntegralType(right, left.type, signed, generator);
      return generator.builder.createICmpEQ(left, right);
    }

    if (left.type.isDoubleTy() && right.type.isIntegerTy()) {
      const signed = isSigned(rhs, generator);
      right = promoteIntegralToFP(right, left.type, signed, generator);
      return generator.builder.createFCmpOEQ(left, right);
    }

    if (isLLVMString(left.type) && isLLVMString(right.type)) {
      const compare = getBuiltin("string__compare", generator.context, generator.module);
      return generator.builder.createCall(compare, [left, right]);
    }

    return error(`Invalid operand types to strict equals ${left.type.typeID} ${right.type.typeID}`);
  }

  emitStrictNotEquals(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    let right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFCmpONE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return generator.builder.createICmpNE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isDoubleTy()) {
      const signed = isSigned(lhs, generator);
      right = castFPToIntegralType(right, left.type, signed, generator);
      return generator.builder.createICmpNE(left, right);
    }

    if (left.type.isDoubleTy() && right.type.isIntegerTy()) {
      const signed = isSigned(rhs, generator);
      right = promoteIntegralToFP(right, left.type, signed, generator);
      return generator.builder.createFCmpONE(left, right);
    }

    if (isLLVMString(left.type) && isLLVMString(right.type)) {
      const compare = getBuiltin("string__compare", generator.context, generator.module);
      return generator.builder.createNot(generator.builder.createCall(compare, [left, right]));
    }

    return error("Invalid operand types to strict not equals");
  }

  emitLessThan(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFCmpOLT(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, generator)) {
        return generator.builder.createICmpSLT(left, right);
      } else if (bothUnsigned(lhs, rhs, generator)) {
        return generator.builder.createICmpULT(left, right);
      } else {
        return error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOLT,
        generator
      );
    }

    return error("Invalid operand types to less than comparison");
  }

  emitGreaterThan(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFCmpOGT(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, generator)) {
        return generator.builder.createICmpSGT(left, right);
      } else if (bothUnsigned(lhs, rhs, generator)) {
        return generator.builder.createICmpUGT(left, right);
      } else {
        return error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOGT,
        generator
      );
    }

    return error("Invalid operand types to greater than comparison");
  }

  emitLessEqualsThan(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFCmpOLE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, generator)) {
        return generator.builder.createICmpSLE(left, right);
      } else if (bothUnsigned(lhs, rhs, generator)) {
        return generator.builder.createICmpULE(left, right);
      } else {
        return error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOLE,
        generator
      );
    }

    return error("Invalid operand types to less equals than comparison");
  }

  emitGreaterEqualsThan(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const left: llvm.Value = generator.emitExpression(lhs);
    const right: llvm.Value = generator.emitExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return generator.builder.createFCmpOGE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, generator)) {
        return generator.builder.createICmpSGE(left, right);
      } else if (bothUnsigned(lhs, rhs, generator)) {
        return generator.builder.createICmpUGE(left, right);
      } else {
        return error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return emitBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOGE,
        generator
      );
    }

    return error("Invalid operand types to less than comparison");
  }
}

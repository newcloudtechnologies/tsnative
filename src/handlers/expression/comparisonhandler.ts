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

import { bothSigned, bothUnsigned, isSigned } from "@cpp";
import {
  castFPToIntegralType,
  Conversion,
  handleBinaryWithConversion,
  isConvertible,
  promoteIntegralToFP,
} from "@handlers";
import { error, checkIfLLVMString } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";

export class ComparisonHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression): llvm.Value | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.EqualsEqualsEqualsToken:
          return this.handleStrictEquals(left, right);
        case ts.SyntaxKind.ExclamationEqualsEqualsToken:
          return this.handleStrictNotEquals(left, right);

        case ts.SyntaxKind.LessThanToken:
          return this.handleLessThan(left, right);
        case ts.SyntaxKind.GreaterThanToken:
          return this.handleGreaterThan(left, right);
        case ts.SyntaxKind.LessThanEqualsToken:
          return this.handleLessEqualsThan(left, right);
        case ts.SyntaxKind.GreaterThanEqualsToken:
          return this.handleGreaterEqualsThan(left, right);
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression);
    }

    return;
  }

  private handleStrictEquals(lhs: ts.Expression, rhs: ts.Expression): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs);
    let right: llvm.Value = this.generator.handleExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpOEQ(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createICmpEQ(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isDoubleTy()) {
      const signed = isSigned(lhs, this.generator);
      right = castFPToIntegralType(right, left.type, signed, this.generator);
      return this.generator.builder.createICmpEQ(left, right);
    }

    if (left.type.isDoubleTy() && right.type.isIntegerTy()) {
      const signed = isSigned(rhs, this.generator);
      right = promoteIntegralToFP(right, left.type, signed, this.generator);
      return this.generator.builder.createFCmpOEQ(left, right);
    }

    if (checkIfLLVMString(left.type) && checkIfLLVMString(right.type)) {
      const equals = this.generator.builtinString.getLLVMEquals(lhs);
      return this.generator.builder.createCall(equals, [left, right]);
    }

    return error(`Invalid operand types to strict equals ${left.type.typeID} ${right.type.typeID}`);
  }

  private handleStrictNotEquals(lhs: ts.Expression, rhs: ts.Expression): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs);
    let right: llvm.Value = this.generator.handleExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpONE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createICmpNE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isDoubleTy()) {
      const signed = isSigned(lhs, this.generator);
      right = castFPToIntegralType(right, left.type, signed, this.generator);
      return this.generator.builder.createICmpNE(left, right);
    }

    if (left.type.isDoubleTy() && right.type.isIntegerTy()) {
      const signed = isSigned(rhs, this.generator);
      right = promoteIntegralToFP(right, left.type, signed, this.generator);
      return this.generator.builder.createFCmpONE(left, right);
    }

    if (checkIfLLVMString(left.type) && checkIfLLVMString(right.type)) {
      const equals = this.generator.builtinString.getLLVMEquals(lhs);
      return this.generator.builder.createNot(this.generator.builder.createCall(equals, [left, right]));
    }

    return error("Invalid operand types to strict not equals");
  }

  private handleLessThan(lhs: ts.Expression, rhs: ts.Expression): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs);
    const right: llvm.Value = this.generator.handleExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpOLT(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpSLT(left, right);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpULT(left, right);
      } else {
        return error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOLT,
        this.generator
      );
    }

    return error("Invalid operand types to less than comparison");
  }

  private handleGreaterThan(lhs: ts.Expression, rhs: ts.Expression): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs);
    const right: llvm.Value = this.generator.handleExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpOGT(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpSGT(left, right);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpUGT(left, right);
      } else {
        return error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOGT,
        this.generator
      );
    }

    return error("Invalid operand types to greater than comparison");
  }

  private handleLessEqualsThan(lhs: ts.Expression, rhs: ts.Expression): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs);
    const right: llvm.Value = this.generator.handleExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpOLE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpSLE(left, right);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpULE(left, right);
      } else {
        return error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOLE,
        this.generator
      );
    }

    return error("Invalid operand types to less equals than comparison");
  }

  private handleGreaterEqualsThan(lhs: ts.Expression, rhs: ts.Expression): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs);
    const right: llvm.Value = this.generator.handleExpression(rhs);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpOGE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpSGE(left, right);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpUGE(left, right);
      } else {
        return error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOGE,
        this.generator
      );
    }

    return error("Invalid operand types to less than comparison");
  }
}

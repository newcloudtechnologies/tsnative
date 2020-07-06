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

import { castToInt32AndBack, Conversion, handleBinaryWithConversion, isConvertible } from "@handlers";
import { error } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";

export class BitwiseHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.AmpersandToken:
          return this.handleBitwiseAnd(left, right, env);
        case ts.SyntaxKind.BarToken:
          return this.handleBitwiseOr(left, right, env);
        case ts.SyntaxKind.CaretToken:
          return this.handleBitwiseXor(left, right, env);
        case ts.SyntaxKind.LessThanLessThanToken:
          return this.handleLeftShift(left, right, env);
        case ts.SyntaxKind.GreaterThanGreaterThanToken:
          return this.handleRightShift(left, right, env);
        case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
          return this.handleLogicalRightShift(left, right, env);
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleBitwiseAnd(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs, env);
    const right: llvm.Value = this.generator.handleExpression(rhs, env);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], this.generator, ([leftInt, rightInt]) =>
        this.generator.builder.createAnd(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createAnd(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createAnd,
        this.generator
      );
    }

    return error("Invalid operand types to bitwise AND");
  }

  private handleBitwiseOr(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs, env);
    const right: llvm.Value = this.generator.handleExpression(rhs, env);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], this.generator, ([leftInt, rightInt]) =>
        this.generator.builder.createOr(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createOr(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createOr,
        this.generator
      );
    }

    return error("Invalid operand types to bitwise OR");
  }

  private handleBitwiseXor(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs, env);
    const right: llvm.Value = this.generator.handleExpression(rhs, env);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], this.generator, ([leftInt, rightInt]) =>
        this.generator.builder.createXor(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createXor(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createXor,
        this.generator
      );
    }

    return error("Invalid operand types to bitwise XOR");
  }

  private handleLeftShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs, env);
    const right: llvm.Value = this.generator.handleExpression(rhs, env);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], this.generator, ([leftInt, rightInt]) =>
        this.generator.builder.createShl(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createShl(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createShl,
        this.generator
      );
    }

    return error("Invalid operand types to left shift");
  }

  private handleRightShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs, env);
    const right: llvm.Value = this.generator.handleExpression(rhs, env);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], this.generator, ([leftInt, rightInt]) =>
        this.generator.builder.createAShr(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createAShr(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createAShr,
        this.generator
      );
    }

    return error("Invalid operand types to right shift");
  }

  private handleLogicalRightShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.handleExpression(lhs, env);
    const right: llvm.Value = this.generator.handleExpression(rhs, env);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return castToInt32AndBack([left, right], this.generator, ([leftInt, rightInt]) =>
        this.generator.builder.createLShr(leftInt, rightInt)
      );
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createLShr(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createLShr,
        this.generator
      );
    }

    return error("Invalid operand types to logical right shift");
  }
}

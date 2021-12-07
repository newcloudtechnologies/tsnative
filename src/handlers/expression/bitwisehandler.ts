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

import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { Conversion, LLVMValue } from "../../llvm/value";
import { Builder } from "../../builder/builder";

export class BitwiseHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.AmpersandToken:
          return this.handleBitwiseAnd(left, right, env).createHeapAllocated();
        case ts.SyntaxKind.BarToken:
          return this.handleBitwiseOr(left, right, env).createHeapAllocated();
        case ts.SyntaxKind.CaretToken:
          return this.handleBitwiseXor(left, right, env).createHeapAllocated();
        case ts.SyntaxKind.LessThanLessThanToken:
          return this.handleLeftShift(left, right, env).createHeapAllocated();
        case ts.SyntaxKind.GreaterThanGreaterThanToken:
          return this.handleRightShift(left, right, env).createHeapAllocated();
        case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
          return this.handleLogicalRightShift(left, right, env).createHeapAllocated();
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleBitwiseAnd(lhs: ts.Expression, rhs: ts.Expression, env?: Environment) {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (
      (left.type.isIntegerType() && right.type.isIntegerType()) ||
      (left.type.isDoubleType() && right.type.isDoubleType())
    ) {
      return this.generator.builder.createAnd(left, right);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left.handleBinaryWithConversion(lhs, rhs, right, Conversion.Narrowing, Builder.prototype.createAnd);
    }

    throw new Error("Invalid operand types to bitwise AND");
  }

  private handleBitwiseOr(lhs: ts.Expression, rhs: ts.Expression, env?: Environment) {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (
      (left.type.isIntegerType() && right.type.isIntegerType()) ||
      (left.type.isDoubleType() && right.type.isDoubleType())
    ) {
      return this.generator.builder.createOr(left, right);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left.handleBinaryWithConversion(lhs, rhs, right, Conversion.Narrowing, Builder.prototype.createOr);
    }

    throw new Error("Invalid operand types to bitwise OR");
  }

  private handleBitwiseXor(lhs: ts.Expression, rhs: ts.Expression, env?: Environment) {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (
      (left.type.isIntegerType() && right.type.isIntegerType()) ||
      (left.type.isDoubleType() && right.type.isDoubleType())
    ) {
      return this.generator.builder.createXor(left, right);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left.handleBinaryWithConversion(lhs, rhs, right, Conversion.Narrowing, Builder.prototype.createXor);
    }

    throw new Error("Invalid operand types to bitwise XOR");
  }

  private handleLeftShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment) {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (
      (left.type.isIntegerType() && right.type.isIntegerType()) ||
      (left.type.isDoubleType() && right.type.isDoubleType())
    ) {
      return this.generator.builder.createShl(left, right);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left.handleBinaryWithConversion(lhs, rhs, right, Conversion.Narrowing, Builder.prototype.createShl);
    }

    throw new Error("Invalid operand types to left shift");
  }

  private handleRightShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment) {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (
      (left.type.isIntegerType() && right.type.isIntegerType()) ||
      (left.type.isDoubleType() && right.type.isDoubleType())
    ) {
      return this.generator.builder.createAShr(left, right);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left.handleBinaryWithConversion(lhs, rhs, right, Conversion.Narrowing, Builder.prototype.createAShr);
    }

    throw new Error("Invalid operand types to right shift");
  }

  private handleLogicalRightShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment) {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (
      (left.type.isIntegerType() && right.type.isIntegerType()) ||
      (left.type.isDoubleType() && right.type.isDoubleType())
    ) {
      return this.generator.builder.createLShr(left, right);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left.handleBinaryWithConversion(lhs, rhs, right, Conversion.Narrowing, Builder.prototype.createLShr);
    }

    throw new Error("Invalid operand types to logical right shift");
  }
}

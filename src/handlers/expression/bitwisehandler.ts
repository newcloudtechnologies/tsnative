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

import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMValue } from "../../llvm/value";

export class BitwiseHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
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
          throw new Error(`Logical shift right is not supported. Error at '${expression.getText()}'`);
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
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createBitwiseAnd(right);
    }

    throw new Error("Invalid operand types to bitwise AND");
  }

  private handleBitwiseOr(lhs: ts.Expression, rhs: ts.Expression, env?: Environment) {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createBitwiseOr(right);
    }

    throw new Error("Invalid operand types to bitwise OR");
  }

  private handleBitwiseXor(lhs: ts.Expression, rhs: ts.Expression, env?: Environment) {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createBitwiseXor(right);
    }

    throw new Error("Invalid operand types to bitwise XOR");
  }

  private handleLeftShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment) {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createBitwiseLeftShift(right);
    }

    throw new Error("Invalid operand types to left shift");
  }

  private handleRightShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment) {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createBitwiseRightShift(right);
    }

    throw new Error("Invalid operand types to right shift");
  }
}

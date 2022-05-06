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
import { LLVMValue, MathFlags } from "../../llvm/value";

export class CompoundAssignmentHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression) && this.canHandle(expression)) {
      let left = this.generator.handleExpression(expression.left, env);
      let right = this.generator.handleExpression(expression.right, env);

      left = this.generator.builder.createLoad(left);
      right = this.generator.builder.createLoad(right);

      switch (expression.operatorToken.kind) {
        case ts.SyntaxKind.PlusEqualsToken:
          return left.createAdd(right, MathFlags.Inplace);
        case ts.SyntaxKind.MinusEqualsToken:
          return left.createSub(right, MathFlags.Inplace);
        case ts.SyntaxKind.AsteriskEqualsToken:
          return left.createMul(right, MathFlags.Inplace);
        case ts.SyntaxKind.SlashEqualsToken:
          return left.createDiv(right, MathFlags.Inplace);
        case ts.SyntaxKind.PercentEqualsToken:
          return left.createMod(right, MathFlags.Inplace);

        case ts.SyntaxKind.AmpersandEqualsToken:
          return left.createBitwiseAnd(right, MathFlags.Inplace);
        case ts.SyntaxKind.BarEqualsToken:
          return left.createBitwiseOr(right, MathFlags.Inplace);
        case ts.SyntaxKind.CaretEqualsToken:
          return left.createBitwiseXor(right, MathFlags.Inplace);
        case ts.SyntaxKind.LessThanLessThanEqualsToken:
          return left.createBitwiseLeftShift(right, MathFlags.Inplace);
        case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
          return left.createBitwiseRightShift(right, MathFlags.Inplace);
        case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
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

  private canHandle(expression: ts.BinaryExpression) {
    switch (expression.operatorToken.kind) {
      case ts.SyntaxKind.PlusEqualsToken:
      case ts.SyntaxKind.MinusEqualsToken:
      case ts.SyntaxKind.AsteriskEqualsToken:
      case ts.SyntaxKind.SlashEqualsToken:
      case ts.SyntaxKind.PercentEqualsToken:

      case ts.SyntaxKind.AmpersandEqualsToken:
      case ts.SyntaxKind.BarEqualsToken:
      case ts.SyntaxKind.CaretEqualsToken:
      case ts.SyntaxKind.LessThanLessThanEqualsToken:
      case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
        return true;
      default:
        return false;
    }
  }
}

/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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
    if (ts.isBinaryExpression(expression) && this.canHandle(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;

      this.generator.emitLocation(binaryExpression.left);
      this.generator.emitLocation(binaryExpression.right);

      const left = this.generator.handleExpression(binaryExpression.left, env).derefToPtrLevel1();
      const right = this.generator.handleExpression(binaryExpression.right, env).derefToPtrLevel1();

      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.AmpersandToken:
          return left.createBitwiseAnd(right);
        case ts.SyntaxKind.BarToken:
          return left.createBitwiseOr(right);
        case ts.SyntaxKind.CaretToken:
          return left.createBitwiseXor(right);
        case ts.SyntaxKind.LessThanLessThanToken:
          return left.createBitwiseLeftShift(right);
        case ts.SyntaxKind.GreaterThanGreaterThanToken:
          return left.createBitwiseRightShift(right);
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

  private canHandle(expression: ts.BinaryExpression) {
    switch (expression.operatorToken.kind) {
      case ts.SyntaxKind.AmpersandToken:
      case ts.SyntaxKind.BarToken:
      case ts.SyntaxKind.CaretToken:
      case ts.SyntaxKind.LessThanLessThanToken:
      case ts.SyntaxKind.GreaterThanGreaterThanToken:
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
        return true;
      default:
        return false;
    }
  }
}

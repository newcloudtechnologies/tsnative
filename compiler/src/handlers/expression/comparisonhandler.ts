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

export class ComparisonHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression) && this.canHandle(expression)) {

      this.generator.emitLocation(expression.left);
      this.generator.emitLocation(expression.right);

      let left = this.generator.handleExpression(expression.left, env);
      let right = this.generator.handleExpression(expression.right, env);

      switch (expression.operatorToken.kind) {
        case ts.SyntaxKind.EqualsEqualsToken:
        case ts.SyntaxKind.ExclamationEqualsToken:
          throw new Error(
            `Non-strict equality operator (==) is not supported. Use '===' or '!==' instead. Error at: '${expression.getText()}'`
          );
        case ts.SyntaxKind.EqualsEqualsEqualsToken:
          return left.createEquals(right);
        case ts.SyntaxKind.ExclamationEqualsEqualsToken:
          return left.createNotEquals(right);
        case ts.SyntaxKind.LessThanToken:
          return left.createLessThan(right);
        case ts.SyntaxKind.GreaterThanToken:
          return left.createGreaterThan(right);
        case ts.SyntaxKind.LessThanEqualsToken:
          return left.createLessThanEquals(right);
        case ts.SyntaxKind.GreaterThanEqualsToken:
          return left.createGreaterThanEquals(right);
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
      case ts.SyntaxKind.EqualsEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsToken:
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
      case ts.SyntaxKind.LessThanToken:
      case ts.SyntaxKind.GreaterThanToken:
      case ts.SyntaxKind.LessThanEqualsToken:
      case ts.SyntaxKind.GreaterThanEqualsToken:
        return true;
      default:
        return false;
    }
  }
}

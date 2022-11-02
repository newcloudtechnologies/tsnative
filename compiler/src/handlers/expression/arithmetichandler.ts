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

export class ArithmeticHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression) && this.canHandle(expression)) {
      this.generator.emitLocation(expression.left);
      this.generator.emitLocation(expression.right);
      const left = this.generator.handleExpression(expression.left, env);
      const right = this.generator.handleExpression(expression.right, env);

      switch (expression.operatorToken.kind) {
        case ts.SyntaxKind.PlusToken:
          return left.createAdd(right);
        case ts.SyntaxKind.MinusToken:
          return left.createSub(right);
        case ts.SyntaxKind.AsteriskToken:
          return left.createMul(right);
        case ts.SyntaxKind.SlashToken:
          return left.createDiv(right);
        case ts.SyntaxKind.PercentToken:
          return left.createMod(right);
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
      case ts.SyntaxKind.PlusToken:
      case ts.SyntaxKind.MinusToken:
      case ts.SyntaxKind.AsteriskToken:
      case ts.SyntaxKind.SlashToken:
      case ts.SyntaxKind.PercentToken:
        return true;
      default:
        return false;
    }
  }
}

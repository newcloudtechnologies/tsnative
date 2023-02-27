/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
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

export class OperatorInHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression) && this.canHandle(expression)) {

      this.generator.emitLocation(expression.left);
      this.generator.emitLocation(expression.right);

      const left = this.generator.handleExpression(expression.left, env).derefToPtrLevel1();
      const right = this.generator.handleExpression(expression.right, env).derefToPtrLevel1();

      if (expression.operatorToken.kind === ts.SyntaxKind.InKeyword) {
          return this.generator.ts.obj.createOperatorIn(right, left);
      }
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private canHandle(expression: ts.BinaryExpression) {
    switch (expression.operatorToken.kind) {
      case ts.SyntaxKind.InKeyword:
        return true;
      default:
        return false;
    }
  }
}

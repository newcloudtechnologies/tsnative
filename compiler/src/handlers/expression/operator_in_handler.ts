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

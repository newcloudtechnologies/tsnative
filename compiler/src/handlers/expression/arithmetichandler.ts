import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMValue } from "../../llvm/value";

export class ArithmeticHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression) && this.canHandle(expression)) {
      this.generator.emitLocation(expression.left);
      this.generator.emitLocation(expression.right);
      const left = this.generator.handleExpression(expression.left, env).derefToPtrLevel1();
      const right = this.generator.handleExpression(expression.right, env).derefToPtrLevel1();

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

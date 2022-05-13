import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMValue } from "../../llvm/value";

export class UnaryHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isPrefixUnaryExpression(expression)) {
      return this.handlePrefixUnaryExpression(expression, env);
    } else if (ts.isPostfixUnaryExpression(expression)) {
      return this.handlePostfixUnaryExpression(expression, env);
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handlePrefixUnaryExpression(expression: ts.PrefixUnaryExpression, env?: Environment): LLVMValue {
    const { operand } = expression;

    switch (expression.operator) {
      case ts.SyntaxKind.PlusToken:
        return this.generator.handleExpression(operand, env);
      case ts.SyntaxKind.MinusToken: {
        const value = this.generator.handleExpression(operand, env);
        return value.createNegate();
      }
      case ts.SyntaxKind.PlusPlusToken: {
        const value = this.generator.handleExpression(operand, env);
        return value.createPrefixIncrement();
      }
      case ts.SyntaxKind.MinusMinusToken: {
        const value = this.generator.handleExpression(operand, env);
        return value.createPrefixDecrement();
      }
      // case ts.SyntaxKind.TildeToken: @todo
      case ts.SyntaxKind.ExclamationToken:
        return this.generator.handleExpression(operand, env).makeBoolean().createNegate();
      default:
        throw new Error(`Unhandled unary operator '${ts.SyntaxKind[expression.operator]}'`);
    }
  }

  private handlePostfixUnaryExpression(expression: ts.PostfixUnaryExpression, env?: Environment): LLVMValue {
    const { operand } = expression;

    switch (expression.operator) {
      case ts.SyntaxKind.PlusPlusToken: {
        const value = this.generator.handleExpression(operand, env);
        return value.createPostfixIncrement();
      }
      case ts.SyntaxKind.MinusMinusToken: {
        const value = this.generator.handleExpression(operand, env);
        return value.createPostfixDecrement();
      }
    }
  }
}

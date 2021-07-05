import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { LLVMConstantFP, LLVMValue } from "../../llvm/value";

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
        const negated = this.generator.builder.createFNeg(this.generator.createLoadIfNecessary(value));
        return value.makeAssignment(negated);
      }
      case ts.SyntaxKind.PlusPlusToken: {
        const value = this.generator.handleExpression(operand, env);
        const oldValue = value.getValue();
        const newValue = this.generator.builder.createAdd(oldValue, LLVMConstantFP.get(this.generator, 1));
        return value.makeAssignment(newValue);
      }
      case ts.SyntaxKind.MinusMinusToken: {
        const value = this.generator.handleExpression(operand, env);
        const oldValue = value.getValue();
        const newValue = this.generator.builder.createSub(oldValue, LLVMConstantFP.get(this.generator, 1));
        return value.makeAssignment(newValue);
      }
      // case ts.SyntaxKind.TildeToken: @todo
      case ts.SyntaxKind.ExclamationToken:
        return this.generator.builder.createNot(this.generator.handleExpression(operand, env).makeBoolean());
      default:
        throw new Error(`Unhandled unary operator '${ts.SyntaxKind[expression.operator]}'`);
    }
  }

  private handlePostfixUnaryExpression(expression: ts.PostfixUnaryExpression, env?: Environment): LLVMValue {
    const { operand } = expression;

    switch (expression.operator) {
      case ts.SyntaxKind.PlusPlusToken: {
        const value = this.generator.handleExpression(operand, env);
        const oldValue = value.getValue();
        const newValue = this.generator.builder.createAdd(oldValue, LLVMConstantFP.get(this.generator, 1));
        value.makeAssignment(newValue);
        return oldValue.createHeapAllocated();
      }
      case ts.SyntaxKind.MinusMinusToken: {
        const value = this.generator.handleExpression(operand, env);
        const oldValue = value.getValue();
        const newValue = this.generator.builder.createSub(oldValue, LLVMConstantFP.get(this.generator, 1));
        value.makeAssignment(newValue);
        return oldValue.createHeapAllocated();
      }
    }
  }
}

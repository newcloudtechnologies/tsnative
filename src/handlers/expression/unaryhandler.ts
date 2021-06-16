import { castToInt32AndBack, makeBoolean, makeAssignment } from "@handlers";
import { createHeapAllocatedFromValue, error } from "@utils";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { LLVMConstantFP, LLVMValue } from "../../llvm/value";

export class UnaryHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PrefixUnaryExpression:
        return this.handlePrefixUnaryExpression(expression as ts.PrefixUnaryExpression, env);
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.handlePostfixUnaryExpression(expression as ts.PostfixUnaryExpression, env);
      default:
        break;
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
        return makeAssignment(value, negated, this.generator);
      }
      case ts.SyntaxKind.PlusPlusToken: {
        const value = this.generator.handleExpression(operand, env);
        const oldValue = value.getValue();
        const newValue = this.generator.builder.createFAdd(oldValue, LLVMConstantFP.get(this.generator, 1));
        makeAssignment(value, newValue, this.generator);
        return value;
      }
      case ts.SyntaxKind.MinusMinusToken: {
        const value = this.generator.handleExpression(operand, env);
        const oldValue = value.getValue();
        const newValue = this.generator.builder.createFSub(oldValue, LLVMConstantFP.get(this.generator, 1));
        makeAssignment(value, newValue, this.generator);
        return value;
      }
      case ts.SyntaxKind.TildeToken:
        return castToInt32AndBack(
          [this.generator.handleExpression(operand, env).getValue()],
          this.generator,
          ([value]) => this.generator.builder.createNot(value)
        );
      case ts.SyntaxKind.ExclamationToken:
        return this.generator.builder.createNot(
          makeBoolean(this.generator.handleExpression(operand, env), operand, this.generator)
        );
      default:
        error(`Unhandled unary operator '${ts.SyntaxKind[expression.operator]}'`);
    }
  }

  private handlePostfixUnaryExpression(expression: ts.PostfixUnaryExpression, env?: Environment): LLVMValue {
    const { operand } = expression;

    switch (expression.operator) {
      case ts.SyntaxKind.PlusPlusToken: {
        const value = this.generator.handleExpression(operand, env);
        const oldValue = value.getValue();
        const newValue = this.generator.builder.createFAdd(oldValue, LLVMConstantFP.get(this.generator, 1));
        makeAssignment(value, newValue, this.generator);
        return createHeapAllocatedFromValue(oldValue, this.generator);
      }
      case ts.SyntaxKind.MinusMinusToken: {
        const value = this.generator.handleExpression(operand, env);
        const oldValue = value.getValue();
        const newValue = this.generator.builder.createFSub(oldValue, LLVMConstantFP.get(this.generator, 1));
        makeAssignment(value, newValue, this.generator);
        return createHeapAllocatedFromValue(oldValue, this.generator);
      }
    }
  }
}

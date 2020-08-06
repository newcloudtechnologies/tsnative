import { castToInt32AndBack, makeBoolean, makeAssignment } from "@handlers";
import { error } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";

export class UnaryHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PrefixUnaryExpression:
        return this.handlePrefixUnaryExpression(expression as ts.PrefixUnaryExpression);
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.handlePostfixUnaryExpression(expression as ts.PostfixUnaryExpression);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handlePrefixUnaryExpression(expression: ts.PrefixUnaryExpression, env?: Environment): llvm.Value {
    const { operand } = expression;

    switch (expression.operator) {
      case ts.SyntaxKind.PlusToken:
        return this.generator.handleExpression(operand, env);
      case ts.SyntaxKind.MinusToken:
        return this.generator.builder.createFNeg(this.generator.handleExpression(operand, env));
      case ts.SyntaxKind.PlusPlusToken: {
        const value = this.generator.handleValueExpression(operand, env);
        const oldValue = this.generator.createLoadIfNecessary(value);
        const newValue = this.generator.builder.createFAdd(oldValue, llvm.ConstantFP.get(this.generator.context, 1));
        return makeAssignment(value, newValue, this.generator);
      }
      case ts.SyntaxKind.MinusMinusToken: {
        const value = this.generator.handleValueExpression(operand, env);
        const oldValue = this.generator.createLoadIfNecessary(value);
        const newValue = this.generator.builder.createFSub(oldValue, llvm.ConstantFP.get(this.generator.context, 1));
        return makeAssignment(value, newValue, this.generator);
      }
      case ts.SyntaxKind.TildeToken:
        return castToInt32AndBack([this.generator.handleExpression(operand, env)], this.generator, ([value]) =>
          this.generator.builder.createNot(value)
        );
      case ts.SyntaxKind.ExclamationToken:
        return this.generator.builder.createNot(
          makeBoolean(this.generator.handleExpression(operand, env), operand, this.generator)
        );
      default:
        error(`Unhandled unary operator '${ts.SyntaxKind[expression.operator]}'`);
    }
  }

  private handlePostfixUnaryExpression(expression: ts.PostfixUnaryExpression, env?: Environment): llvm.Value {
    const { operand } = expression;

    switch (expression.operator) {
      case ts.SyntaxKind.PlusPlusToken: {
        const value = this.generator.handleValueExpression(operand, env);
        const oldValue = this.generator.createLoadIfNecessary(value);
        const newValue = this.generator.builder.createFAdd(oldValue, llvm.ConstantFP.get(this.generator.context, 1));
        makeAssignment(value, newValue, this.generator);
        return oldValue;
      }
      case ts.SyntaxKind.MinusMinusToken: {
        const value = this.generator.handleValueExpression(operand, env);
        const oldValue = this.generator.createLoadIfNecessary(value);
        const newValue = this.generator.builder.createFSub(oldValue, llvm.ConstantFP.get(this.generator.context, 1));
        makeAssignment(value, newValue, this.generator);
        return oldValue;
      }
    }
  }
}

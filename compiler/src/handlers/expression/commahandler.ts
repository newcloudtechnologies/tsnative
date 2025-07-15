import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMValue } from "../../llvm/value";

export class CommaHandler extends AbstractExpressionHandler {
	handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
		if (
			ts.isBinaryExpression(expression) &&
			expression.operatorToken.kind === ts.SyntaxKind.CommaToken
		) {
			const binaryExpression = expression as ts.BinaryExpression;

			this.generator.handleExpression(binaryExpression.left, env);
			return this.generator.handleExpression(binaryExpression.right, env);
		}

		if (this.next) {
			return this.next.handle(expression, env);
		}

		return;
	}
}

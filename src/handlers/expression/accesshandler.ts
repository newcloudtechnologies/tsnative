import { Scope, Environment } from "@scope";
import { error, indexOfProperty } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

import { AbstractExpressionHandler } from "./expressionhandler";
import { createArraySubscription } from "@handlers";

export class AccessHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PropertyAccessExpression:
        const symbol = this.generator.checker.getSymbolAtLocation(expression);
        const valueDeclaration = symbol!.valueDeclaration;
        if (ts.isGetAccessorDeclaration(valueDeclaration)) {
          // Handle get accessors in FunctionHandler.
          break;
        }

        return this.handlePropertyAccessExpression(expression as ts.PropertyAccessExpression);
      case ts.SyntaxKind.ElementAccessExpression:
        return this.handleElementAccessExpression(expression as ts.ElementAccessExpression);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handlePropertyAccessExpression(expression: ts.PropertyAccessExpression): llvm.Value {
    const left = expression.expression;
    const propertyName = expression.name.text;

    if (ts.isIdentifier(left)) {
      const value = this.generator.symbolTable.get((left as ts.Identifier).text);
      if (value instanceof Scope) {
        return value.get(propertyName) as llvm.Value;
      }
    }

    return this.handlePropertyAccessGEP(propertyName, left);
  }

  private handleElementAccessExpression(expression: ts.ElementAccessExpression): llvm.Value {
    const subscription = createArraySubscription(expression, this.generator);
    const array = this.generator.handleExpression(expression.expression);
    const index = this.generator.handleExpression(expression.argumentExpression);
    return this.generator.builder.createCall(subscription, [array, index]);
  }

  private handlePropertyAccessGEP(propertyName: string, expression: ts.Expression): llvm.Value {
    const value = this.generator.handleExpression(expression);

    if (!value.type.isPointerTy() || !value.type.elementType.isStructTy()) {
      return error(`Expected pointer to struct, got '${value.type}'`);
    }

    const { checker, builder, context } = this.generator;

    const type = checker.getTypeAtLocation(expression);
    const index = indexOfProperty(propertyName, checker.getApparentType(type), checker);
    const indexList = [llvm.ConstantInt.get(context, 0), llvm.ConstantInt.get(context, index)];

    return builder.createInBoundsGEP(value, indexList, propertyName);
  }
}

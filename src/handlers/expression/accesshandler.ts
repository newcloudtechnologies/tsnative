import { Environment, Scope } from "@scope";
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

        return this.handlePropertyAccessExpression(expression as ts.PropertyAccessExpression, env);
      case ts.SyntaxKind.ElementAccessExpression:
        return this.handleElementAccessExpression(expression as ts.ElementAccessExpression, env);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handlePropertyAccessExpression(expression: ts.PropertyAccessExpression, env?: Environment): llvm.Value {
    const left = expression.expression;
    const propertyName = expression.name.text;

    if (ts.isIdentifier(left)) {
      if (env) {
        const index = env.varNames.indexOf(propertyName);
        if (index > -1) {
          const agg = env.data.type.isPointerTy() ? this.generator.builder.createLoad(env.data) : env.data;
          if ((agg.type as llvm.StructType).numElements === 0) {
            error("Identifier handler: Trying to extract a value from an empty struct");
          }
          return this.generator.builder.createExtractValue(agg, [index]);
        }
      }

      let scope;
      try {
        // It's not an error to not find it in symbol table
        scope = this.generator.symbolTable.get(left.getText());

        // Ignore empty catch block
        // tslint:disable-next-line
      } catch (_) { }

      if (scope && scope instanceof Scope) {
        const value = scope.get(propertyName);
        if (!value) {
          error(`Property '${propertyName}' not found in '${left.getText()}'`);
        }

        if (!(value instanceof llvm.Value)) {
          error(`Property '${propertyName}' is not a llvm.Value`);
        }

        return value;
      }
    }

    return this.handlePropertyAccessGEP(propertyName, left, env);
  }

  private handleElementAccessExpression(expression: ts.ElementAccessExpression, env?: Environment): llvm.Value {
    const subscription = createArraySubscription(expression, this.generator);
    const array = this.generator.handleExpression(expression.expression, env);
    const index = this.generator.createLoadIfNecessary(
      this.generator.handleExpression(expression.argumentExpression, env)
    );
    return this.generator.builder.createCall(subscription, [array, index]);
  }

  private handlePropertyAccessGEP(propertyName: string, expression: ts.Expression, env?: Environment): llvm.Value {
    let value = this.generator.handleExpression(expression, env);

    if (!value.type.isPointerTy()) {
      error(`Expected pointer, got '${value.type}'`);
    }

    while ((value.type as llvm.PointerType).elementType.isPointerTy()) {
      value = this.generator.builder.createLoad(value);
    }

    const { checker, builder, context } = this.generator;

    const type = checker.getTypeAtLocation(expression);
    const index = indexOfProperty(propertyName, checker.getApparentType(type), checker);
    const indexList = [llvm.ConstantInt.get(context, 0), llvm.ConstantInt.get(context, index)];

    return builder.createInBoundsGEP(value, indexList, propertyName);
  }
}

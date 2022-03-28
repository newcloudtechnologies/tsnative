/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
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
import { LLVMConstantFP, LLVMConstantInt, LLVMValue } from "../../llvm/value";

export class AssignmentHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression)) {
      const isSetAccessor = (expr: ts.Expression): boolean => {
        if (!expr.parent) {
          return false;
        }

        if (!this.generator.ts.checker.nodeHasSymbolAndDeclaration(expr)) {
          return false;
        }

        const symbol = this.generator.ts.checker.getSymbolAtLocation(expr);

        if (symbol.declarations.length === 1) {
          return symbol.declarations[0].kind === ts.SyntaxKind.SetAccessor;
        } else if (symbol.declarations.length > 1) {
          if (ts.isBinaryExpression(expr.parent)) {
            const binary = expr.parent as ts.BinaryExpression;

            if (ts.isPropertyAccessExpression(binary.left) || ts.isPropertyAccessExpression(binary.right)) {
              if (binary.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                return true;
              }
            }
          }
        }

        return false;
      };

      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;

      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.EqualsToken:
          if (ts.isArrayLiteralExpression(left) && ts.isArrayLiteralExpression(right)) {
            return this.handleTupleDestructuring(left, right, env);
          }

          const lhs = this.generator.handleExpression(left, env);
          let rhs;

          if (isSetAccessor(left)) {
            return lhs;
          }

          rhs =
            right.kind === ts.SyntaxKind.NullKeyword
              ? this.generator.ts.union.create(this.generator.ts.null.get())
              : this.generator.handleExpression(right, env);

          return lhs.makeAssignment(rhs);
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleTupleDestructuring(lhs: ts.ArrayLiteralExpression, rhs: ts.ArrayLiteralExpression, env?: Environment) {
    const identifiers: ts.Identifier[] = [];
    lhs.elements.forEach((e) => {
      if (!ts.isIdentifier(e)) {
        throw new Error(
          `Expected identifier in destructing binding, got '${ts.SyntaxKind[e.kind]}' at '${e.getText()}'`
        );
      }

      identifiers.push(e);
    });

    const tupleInitializer = this.generator.handleExpression(rhs, env);

    const tupleUntyped = this.generator.builder.asVoidStar(tupleInitializer);
    const tupleType = this.generator.ts.checker.getTypeAtLocation(rhs);
    const elementTypes = rhs.elements.map((e) => this.generator.ts.checker.getTypeAtLocation(e));

    const subscription = this.generator.ts.tuple.createSubscription(tupleType);

    identifiers.forEach((identifier, index) => {
      const llvmDoubleIndex = LLVMConstantFP.get(this.generator, index);
      const llvmNumberIndex = this.generator.builtinNumber.create(llvmDoubleIndex);

      const destructedValueUntyped = this.generator.builder.createSafeCall(subscription, [
        tupleUntyped,
        llvmNumberIndex,
      ]);
      const destructedValue = this.generator.builder.createBitCast(
        destructedValueUntyped,
        elementTypes[index].getLLVMType()
      );

      const name = identifier.getText();
      this.generator.symbolTable.currentScope.overwriteThroughParentChain(name, destructedValue);
    });

    // Have to return something.
    return LLVMConstantInt.getFalse(this.generator);
  }
}

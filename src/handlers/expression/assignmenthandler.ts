/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment, HeapVariableDeclaration, Scope } from "../../scope";
import { LLVMConstantInt, LLVMValue } from "../../llvm/value";
import { LLVMType } from "../../llvm/type";

export class AssignmentHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression)) {
      const isSetAccessor = (expr: ts.Expression): boolean => {
        if (!expr.parent) {
          return false;
        }

        if (!this.generator.ts.checker.nodeHasSymbol(expr)) {
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

          if (right.kind === ts.SyntaxKind.NullKeyword) {
            if (!lhs.type.isUnionWithNull()) {
              throw new Error(
                `Expected left hand side operand to be union with null type, got '${lhs.type
                  .unwrapPointer()
                  .toString()}'`
              );
            }

            rhs = this.generator.gc.allocate(lhs.type.unwrapPointer());
            const markerPtr = this.generator.builder.createSafeInBoundsGEP(rhs, [0, 0]);

            const allocatedMarker = this.generator.gc.allocate(LLVMType.getInt8Type(this.generator));
            const markerValue = LLVMConstantInt.get(this.generator, -1, 8);
            this.generator.builder.createSafeStore(markerValue, allocatedMarker);

            this.generator.builder.createSafeStore(allocatedMarker, markerPtr);
          } else {
            rhs = this.generator.handleExpression(right, env);
          }

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
      const llvmIntegralIndex = LLVMConstantInt.get(this.generator, index);
      const llvmDoubleIndex = this.generator.builder.createSIToFP(
        llvmIntegralIndex,
        LLVMType.getDoubleType(this.generator)
      );
      const destructedValueUntyped = this.generator.builder.createSafeCall(subscription, [
        tupleUntyped,
        llvmDoubleIndex,
      ]);
      const destructedValue = this.generator.builder.createBitCast(
        destructedValueUntyped,
        elementTypes[index].getLLVMType()
      );

      const currentScope = this.generator.symbolTable.currentScope;
      const name = identifier.getText();
      let valueToOverwrite = currentScope.tryGetThroughParentChain(name);
      if (!valueToOverwrite) {
        throw new Error(`Identifier '${name}' is not found in scope chain.`);
      }

      if (valueToOverwrite instanceof Scope) {
        throw new Error(`'${name}' is Scope unexpectedly.`);
      }

      if (valueToOverwrite instanceof HeapVariableDeclaration) {
        valueToOverwrite = valueToOverwrite.allocated;
      }

      valueToOverwrite.makeAssignment(destructedValue);
    });

    // Have to return something.
    return LLVMConstantInt.getFalse(this.generator);
  }
}

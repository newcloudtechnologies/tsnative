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

import { makeAssignment } from "@handlers";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { error } from "@utils";
import { LLVMConstantInt, LLVMValue } from "../../llvm/value";

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
          const lhs = this.generator.handleExpression(left, env);
          let rhs;

          if (isSetAccessor(left)) {
            return lhs;
          }

          if (right.kind === ts.SyntaxKind.NullKeyword) {
            if (!this.generator.types.union.isUnionWithNull(lhs.type)) {
              error(
                `Expected left hand side operand to be union with null type, got '${lhs.type
                  .unwrapPointer()
                  .toString()}'`
              );
            }

            rhs = this.generator.gc.allocate(lhs.type.unwrapPointer());
            const marker = this.generator.builder.createSafeInBoundsGEP(rhs, [0, 0]);
            this.generator.builder.createSafeStore(LLVMConstantInt.get(this.generator, -1, 8), marker);
          } else {
            rhs = this.generator.handleExpression(right, env);
          }

          return makeAssignment(lhs, rhs, this.generator);
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }
}

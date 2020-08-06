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
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { isUnionWithNullLLVMType } from "@utils";

export class AssignmentHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.EqualsToken:
          const lhs = this.generator.handleExpression(left, env);
          let rhs;
          if (right.kind === ts.SyntaxKind.NullKeyword) {
            rhs = llvm.Constant.getNullValue(lhs.type);
            if (isUnionWithNullLLVMType(lhs.type)) {
              rhs = this.generator.builder.createInsertValue(rhs, llvm.ConstantInt.get(this.generator.context, -1, 8), [
                0,
              ]);
            }
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

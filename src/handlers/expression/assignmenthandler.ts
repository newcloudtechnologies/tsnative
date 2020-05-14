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

export class AssignmentHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression): llvm.Value | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.EqualsToken:
          return makeAssignment(
            this.generator.handleValueExpression(left),
            this.generator.handleExpression(right),
            this.generator
          );
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression);
    }

    return;
  }
}

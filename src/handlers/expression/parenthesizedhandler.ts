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
import { Environment } from "@scope";

export class ParenthesizedHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.ParenthesizedExpression:
        return this.generator.handleExpression((expression as ts.ParenthesizedExpression).expression, env);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }
}

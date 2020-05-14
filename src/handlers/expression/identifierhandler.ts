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

import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";

export class IdentifierHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.Identifier:
        return this.handleIdentifier(expression as ts.Identifier);
      case ts.SyntaxKind.ThisKeyword:
        return this.handleThis();
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression);
    }

    return;
  }

  private handleIdentifier(expression: ts.Identifier): llvm.Value {
    return this.generator.symbolTable.get(expression.text) as llvm.Value;
  }

  private handleThis(): llvm.Value {
    return this.generator.symbolTable.get("this") as llvm.Value;
  }
}

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
import { HeapVariableDeclaration, Environment } from "@scope";
import { error } from "@utils";

export class IdentifierHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.Identifier:
        return this.handleIdentifier(expression as ts.Identifier, env);
      case ts.SyntaxKind.ThisKeyword:
        return this.handleThis();
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleIdentifier(expression: ts.Identifier, env?: Environment): llvm.Value {
    if (env) {
      const index = env.varNames.indexOf(expression.text);
      if (index > -1) {
        const agg = env.data.type.isPointerTy() ? this.generator.builder.createLoad(env.data) : env.data;
        if ((agg.type as llvm.StructType).numElements === 0) {
          error("Identifier handler: Trying to extract a value from an empty struct");
        }
        return this.generator.builder.createExtractValue(agg, [index]);
      }
    }

    const value = this.generator.symbolTable.currentScope.tryGetThroughParentChain(expression.text, false);
    if (value) {
      if (value instanceof HeapVariableDeclaration) {
        return value.allocated;
      }

      if (!(value instanceof llvm.Value)) {
        error(`Identifier handler: llvm.Value for '${expression.text}' not found`);
      }

      return value as llvm.Value;
    }

    error(`Identifier '${expression.text}' not found in local scope nor environment`);
  }

  private handleThis(): llvm.Value {
    return this.generator.symbolTable.get("this") as llvm.Value;
  }
}

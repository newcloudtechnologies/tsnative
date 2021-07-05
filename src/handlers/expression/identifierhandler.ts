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
import { HeapVariableDeclaration, Environment } from "@scope";
import { LLVMValue } from "../../llvm/value";

export class IdentifierHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.Identifier:
        return this.handleIdentifier(expression as ts.Identifier, env);
      case ts.SyntaxKind.ThisKeyword:
        return this.handleThis(env);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleIdentifier(expression: ts.Identifier, env?: Environment): LLVMValue {
    if (env) {
      const index = env.getVariableIndex(expression.text);
      if (index > -1) {
        const agg = this.generator.builder.createLoad(env.typed);
        return this.generator.builder.createSafeExtractValue(agg, [index]);
      }
    }

    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const declaration = symbol.valueDeclaration;

    let identifier = expression.getText();
    if (declaration && (declaration.isClass() || declaration.isInterface())) {
      const type = this.generator.ts.checker.getTypeOfSymbolAtLocation(symbol, expression);
      const namespace = declaration.getNamespace();
      identifier = namespace.concat(type.mangle()).join(".");
    }

    const value = this.generator.symbolTable.currentScope.tryGetThroughParentChain(identifier);
    if (value) {
      if (value instanceof HeapVariableDeclaration) {
        return value.allocated;
      }

      if (!value) {
        throw new Error(`Identifier handler: LLVMValue for '${expression.text}' not found`);
      }

      return value as LLVMValue;
    }

    throw new Error(`Identifier '${expression.text}' not found in local scope nor environment`);
  }

  private handleThis(env?: Environment): LLVMValue {
    if (env) {
      const index = env.getVariableIndex(this.generator.internalNames.This);
      if (index > -1) {
        const agg = this.generator.builder.createLoad(env.typed);
        return this.generator.builder.createSafeExtractValue(agg, [index]);
      }
    }

    return this.generator.symbolTable.get(this.generator.internalNames.This) as LLVMValue;
  }
}

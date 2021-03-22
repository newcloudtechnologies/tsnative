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
import {
  error,
  getAliasedSymbolIfNecessary,
  getDeclarationNamespace,
  InternalNames,
  tryResolveGenericTypeIfNecessary,
} from "@utils";
import { TypeMangler } from "@mangling";

export class IdentifierHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
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

  private handleIdentifier(expression: ts.Identifier, env?: Environment): llvm.Value {
    if (env) {
      const index = env.getVariableIndex(expression.text);
      if (index > -1) {
        const agg = this.generator.builder.createLoad(env.reference!);
        return this.generator.xbuilder.createSafeExtractValue(agg, [index]);
      }
    }

    let symbol = this.generator.checker.getSymbolAtLocation(expression);
    if (!symbol) {
      error("No symbol found");
    }

    symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);
    const declaration = symbol.valueDeclaration;

    let identifier = expression.getText();
    if (declaration && (ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration))) {
      let type = this.generator.checker.getTypeOfSymbolAtLocation(symbol, expression);
      type = tryResolveGenericTypeIfNecessary(type, this.generator);

      const namespace = getDeclarationNamespace(declaration);
      identifier = namespace.concat(TypeMangler.mangle(type, this.generator.checker, declaration)).join(".");
    }

    const value = this.generator.symbolTable.currentScope.tryGetThroughParentChain(identifier, false);
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

  private handleThis(env?: Environment): llvm.Value {
    if (env) {
      const index = env.getVariableIndex(InternalNames.This);
      if (index > -1) {
        const agg = this.generator.builder.createLoad(env.reference!);
        return this.generator.xbuilder.createSafeExtractValue(agg, [index]);
      }
    }

    return this.generator.symbolTable.get(InternalNames.This) as llvm.Value;
  }
}

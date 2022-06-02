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
import { HeapVariableDeclaration, Environment, Scope } from "../../scope";
import { LLVMValue } from "../../llvm/value";

export class IdentifierHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.Identifier:
        this.generator.emitLocation(expression);
        return this.handleIdentifier(expression as ts.Identifier, env);
      case ts.SyntaxKind.ThisKeyword:
      case ts.SyntaxKind.SuperKeyword:
        this.generator.emitLocation(expression);
        return this.handleThis(env);
      case ts.SyntaxKind.UndefinedKeyword:
        this.generator.emitLocation(expression);
        return this.generator.ts.undef.get();
      case ts.SyntaxKind.NullKeyword:
        this.generator.emitLocation(expression);
        return this.generator.ts.null.get();
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleIdentifier(expression: ts.Identifier, env?: Environment): LLVMValue {
    if (expression.getText() === "null") {
      return this.generator.ts.null.get();
    } else if (expression.getText() === "undefined") {
      return this.generator.ts.undef.get();
    }

    let identifier = expression.getText();

    if (env) {
      const index = env.getVariableIndex(identifier);
      if (index > -1) {
        const agg = this.generator.builder.createLoad(env.typed);

        const extracted = this.generator.builder.createSafeExtractValue(agg, [index]);

        return extracted;
      }
    }

    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const declaration = symbol.valueDeclaration;

    if (declaration && (declaration.isClass() || declaration.isInterface())) {
      const type = this.generator.ts.checker.getTypeOfSymbolAtLocation(symbol, expression);
      const declarationNamespace = declaration.getNamespace();
      identifier = declarationNamespace.concat(type.mangle()).join(".");
    }

    const value = this.generator.symbolTable.currentScope.tryGetThroughParentChain(identifier);
    if (value) {
      if (value instanceof HeapVariableDeclaration) {
        return value.allocated;
      }

      if (value instanceof Scope) {
        throw new Error(`Identifier handler: LLVMValue for '${expression.text}' not found (Scope)`);
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

        const extracted = this.generator.builder.createSafeExtractValue(agg, [index]);

        return extracted;
      }
    }

    return this.generator.symbolTable.get(this.generator.internalNames.This) as LLVMValue;
  }
}

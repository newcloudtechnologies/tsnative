/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
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
import { VariableFinder } from "../variablefinder"

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
    const varFinder = new VariableFinder(this.generator);
    if (env) {
      const valueFromEnv = varFinder.findInsideEnv(identifier, env);
      if (valueFromEnv) {
        return valueFromEnv;
      }
    }

    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const declaration = symbol.valueDeclaration;

    if (declaration && (declaration.isClass() || declaration.isInterface())) {
      const type = this.generator.ts.checker.getTypeOfSymbolAtLocation(symbol, expression);
      const declarationNamespace = declaration.getNamespace();
      identifier = declarationNamespace.concat(type.mangle()).join(".");
    }

    const value = varFinder.findInsideScopes(identifier);
    if (!value) {
      throw new Error(`Identifier '${expression.text}' not found in local scope nor environment`);
    }

    const memoryPtrPtr = value instanceof HeapVariableDeclaration ? value.allocated : value;

    if (memoryPtrPtr instanceof Scope) {
      throw new Error(`Identifier handler: LLVMValue for '${expression.text}' not found (Scope)`);
    }

    return memoryPtrPtr;
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

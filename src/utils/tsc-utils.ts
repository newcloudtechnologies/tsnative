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

import { TypeChecker } from "../ts/typechecker";
import * as ts from "typescript";

export function isConst(node: ts.VariableDeclaration | ts.VariableDeclarationList): boolean {
  return Boolean(ts.getCombinedNodeFlags(node) & ts.NodeFlags.Const);
}

export function checkIfStaticMethod(valueDeclaration: ts.Declaration): boolean {
  return valueDeclaration.getText().startsWith(ts.ScriptElementKindModifier.staticModifier);
}

export function checkIfStaticProperty(propertyDeclaration: ts.PropertyDeclaration): boolean {
  let result = false;
  if (propertyDeclaration.modifiers) {
    const found = propertyDeclaration.modifiers!.find((it: ts.Modifier): boolean => {
      return it.kind === ts.SyntaxKind.StaticKeyword;
    });

    result = Boolean(found);
  }

  return result;
}

export function checkIfMethod(expression: ts.Expression, checker: TypeChecker): boolean {
  return Boolean(
    ts.isPropertyAccessExpression(expression) &&
      (checker.getTypeAtLocation(expression).getSymbol().flags & ts.SymbolFlags.Method) !== 0 &&
      !checkIfStaticMethod(checker.getTypeAtLocation(expression).getSymbol().valueDeclaration)
  );
}

export function checkIfProperty(symbol: ts.Symbol): boolean {
  return Boolean(symbol.flags & ts.SymbolFlags.Property);
}

export function getParentFromOriginal(node: ts.Node): ts.Node | undefined {
  // @ts-ignore
  let original = node.original;
  while (original) {
    if (original.parent) {
      return original.parent;
    }

    original = original.original;
  }

  return undefined;
}

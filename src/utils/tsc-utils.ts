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
import { error } from "./common";

export function isConst(node: ts.VariableDeclaration | ts.VariableDeclarationList): boolean {
  return Boolean(ts.getCombinedNodeFlags(node) & ts.NodeFlags.Const);
}

export function indexOfProperty(name: string, type: ts.Type, checker: ts.TypeChecker): number {
  const index = checker.getPropertiesOfType(type).findIndex((property) => property.name === name);
  if (index < 0) {
    return error(`No property '${name}' on type '${checker.typeToString(type)}'`);
  }
  return index;
}

export function getTypeGenericArguments(type: ts.Type) {
  if (type.flags & ts.TypeFlags.Object) {
    if ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
      return (type as ts.TypeReference).typeArguments || [];
    }
  }
  return [];
}

export function getTypename(type: ts.Type, checker: ts.TypeChecker) {
  return type.symbol ? type.symbol.name : checker.typeToString(checker.getBaseTypeOfLiteralType(type));
}

export function checkIfMethod(expression: ts.Expression, checker: ts.TypeChecker): boolean {
  return (
    ts.isPropertyAccessExpression(expression) &&
    (checker.getTypeAtLocation(expression).symbol.flags & ts.SymbolFlags.Method) !== 0
  );
}

export function checkIfObject(type: ts.Type): boolean {
  return Boolean(type.flags & ts.TypeFlags.Object);
}

export function checkIfFunction(type: ts.Type): boolean {
  return Boolean(type.symbol?.flags & ts.SymbolFlags.Function);
}

export function checkIfArray(type: ts.Type): boolean {
  return type.symbol && type.symbol.name === "Array";
}

export function checkIfString(type: ts.Type, checker: ts.TypeChecker): boolean {
  return (
    Boolean(type.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral)) || checker.typeToString(type) === "String"
  );
}

export function checkIfBoolean(type: ts.Type): boolean {
  return Boolean(type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral));
}

export function checkIfNumber(type: ts.Type): boolean {
  return Boolean(type.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral));
}

export function checkIfVoid(type: ts.Type): boolean {
  return Boolean(type.flags & ts.TypeFlags.Void);
}

export function checkIfProperty(symbol: ts.Symbol): boolean {
  return Boolean(symbol.flags & ts.SymbolFlags.Property);
}

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
import { error, getProperties } from "@utils";

export function isConst(node: ts.VariableDeclaration | ts.VariableDeclarationList): boolean {
  return Boolean(ts.getCombinedNodeFlags(node) & ts.NodeFlags.Const);
}

export function indexOfProperty(name: string, type: ts.Type, checker: ts.TypeChecker): number {
  const index = getProperties(type, checker).findIndex((property) => property.name === name);
  if (index < 0) {
    error(`No property '${name}' on type '${checker.typeToString(type)}'`);
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

export function checkIfMethod(expression: ts.Expression, checker: ts.TypeChecker): boolean {
  return Boolean(
    ts.isPropertyAccessExpression(expression) &&
      (checker.getTypeAtLocation(expression).symbol?.flags & ts.SymbolFlags.Method) !== 0 &&
      checker.getTypeAtLocation(expression).getSymbol() &&
      !checkIfStaticMethod(checker.getTypeAtLocation(expression).getSymbol()!.valueDeclaration)
  );
}

export function checkIfUndefined(type: ts.Type, checker: ts.TypeChecker): boolean {
  return checker.typeToString(type) === "undefined";
}

export function checkIfNull(type: ts.Type, checker: ts.TypeChecker): boolean {
  return checker.typeToString(type) === "null";
}

export function checkIfObject(type: ts.Type): boolean {
  return Boolean(type.flags & ts.TypeFlags.Object) && !checkIfFunction(type);
}

export function checkIfFunction(type: ts.Type): boolean {
  return (
    Boolean(type.symbol?.flags & ts.SymbolFlags.Function) ||
    Boolean(type.symbol?.members?.get(ts.InternalSymbolName.Call))
  );
}

export function checkIfArray(type: ts.Type): boolean {
  return Boolean(type.symbol?.name === "Array");
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

export function checkIfUnion(type: ts.Type): type is ts.UnionType {
  return type.isUnion() && (type.flags & ts.TypeFlags.BooleanLike) === 0;
}

export function checkIfIntersection(type: ts.Type): boolean {
  return type.isIntersection();
}

export function checkIfProperty(symbol: ts.Symbol): boolean {
  return Boolean(symbol.flags & ts.SymbolFlags.Property);
}

export function isTSObjectType(type: ts.Type, checker: ts.TypeChecker) {
  return (
    (checkIfObject(type) || checkIfIntersection(type) || checkIfUnion(type)) &&
    !checkIfArray(type) &&
    !checkIfString(type, checker) &&
    !type.symbol?.valueDeclaration?.getSourceFile().isDeclarationFile
  );
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

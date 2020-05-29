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
import { checkIfProperty } from "./tsc-utils";
import { error, isTypeSupported } from "@utils";
import { LLVMGenerator } from "@generator";

const returnsValueTypeDecorator: string = "ReturnsValueType";
export function checkIfReturnsValueType(declaration: ts.FunctionLikeDeclaration): boolean {
  return Boolean(
    declaration.decorators?.some((decorator) => decorator.expression.getText() === returnsValueTypeDecorator)
  );
}

const valueTypeDecorator: string = "ValueType";
export function checkIfValueTypeProperty(declaration: ts.Declaration): boolean {
  return Boolean(declaration.decorators?.some((decorator) => decorator.getText() === valueTypeDecorator));
}

export function getExpressionTypename(expression: ts.Expression, checker: ts.TypeChecker): string {
  return checker.typeToString(checker.getTypeAtLocation(expression));
}

export function getProperties(type: ts.Type, checker: ts.TypeChecker) {
  return checker.getPropertiesOfType(type).filter(checkIfProperty);
}

export function getAliasedSymbolIfNecessary(symbol: ts.Symbol, checker: ts.TypeChecker) {
  if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
    return checker.getAliasedSymbol(symbol);
  }
  return symbol;
}

export function getDeclarationNamespace(declaration: ts.Declaration): string[] {
  let parentNode = declaration.parent;
  let moduleBlockSeen = false;
  let stopTraversing = false;
  const namespace: string[] = [];

  while (parentNode && !stopTraversing) {
    // skip declarations. block itself is in the next node
    if (!ts.isModuleDeclaration(parentNode)) {
      if (ts.isModuleBlock(parentNode)) {
        namespace.unshift(parentNode.parent.name.text);
        moduleBlockSeen = true;
      } else if (moduleBlockSeen) {
        stopTraversing = true;
      }
    }
    parentNode = parentNode.parent;
  }

  return namespace;
}

export function getGenericsToActualMapFromSignature(
  signature: ts.Signature,
  expression: ts.CallExpression,
  checker: ts.TypeChecker
): { [_: string]: ts.Type } {
  const formalTypeParameters = signature.getTypeParameters()!;
  const formalParameters = signature.getParameters();
  const resolvedSignature = checker.getResolvedSignature(expression)!;
  const map: { [key: string]: ts.Type } = {};
  const actualParameters = resolvedSignature.getParameters();

  for (let i = 0; i < formalParameters.length; ++i) {
    const parameter = formalParameters[i];
    const type = checker.getTypeOfSymbolAtLocation(parameter, expression);
    const typename = checker.typeToString(type);

    if (isTypeSupported(type, checker) || map[typename]) {
      continue;
    }

    const actualType = checker.getTypeOfSymbolAtLocation(actualParameters[i], expression);
    map[typename] = actualType;
  }

  const formalTypeParametersNames = formalTypeParameters.map((parameter) => checker.typeToString(parameter));
  // @todo: keep order?
  const readyTypes = Object.keys(map);
  const difference = formalTypeParametersNames.filter((type) => !readyTypes.includes(type));
  if (difference.length === 1) {
    map[difference[0]] = resolvedSignature.getReturnType();
  } else if (difference.length > 1) {
    return error("Cannot map generic type arguments to template arguments");
  }

  return map;
}

export function getArgumentTypes(expression: ts.CallExpression, generator: LLVMGenerator): ts.Type[] {
  return expression.arguments.map((arg) => {
    const type = generator.checker.getTypeAtLocation(arg);
    if (Boolean(type.flags & ts.TypeFlags.TypeParameter)) {
      const typenameAlias = generator.checker.typeToString(type);
      return generator.symbolTable.currentScope.tryGetThroughParentChain(typenameAlias)! as ts.Type;
    } else {
      return generator.checker.getTypeAtLocation(arg);
    }
  });
}

export function getReturnType(expression: ts.CallExpression, generator: LLVMGenerator): ts.Type {
  const resolvedSignature = generator.checker.getResolvedSignature(expression)!;
  let returnType = generator.checker.getReturnTypeOfSignature(resolvedSignature);
  if (returnType.isTypeParameter()) {
    const typenameAlias = generator.checker.typeToString(returnType);
    returnType = generator.symbolTable.get(typenameAlias) as ts.Type;
  }
  return returnType;
}

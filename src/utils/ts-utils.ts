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
import { checkIfProperty, checkIfFunction } from "./tsc-utils";
import { isTypeSupported, error } from "@utils";
import { LLVMGenerator } from "@generator";

import { cloneDeep } from "lodash";

const returnsValueTypeDecorator: string = "ReturnsValueType";
export function checkIfReturnsValueType(declaration: ts.FunctionLikeDeclaration): boolean {
  return Boolean(
    declaration.decorators?.some((decorator) => decorator.expression.getText() === returnsValueTypeDecorator)
  );
}

const valueTypeDecorator: string = "ValueType";
export function checkIfValueTypeProperty(declaration: ts.Declaration): boolean {
  return Boolean(declaration.decorators?.some((decorator) => decorator.expression.getText() === valueTypeDecorator));
}

const withVTableDecorator: string = "VTable";
export function checkIfHasVTable(declaration: ts.ClassDeclaration) {
  return Boolean(declaration.decorators?.some((decorator) => decorator.expression.getText() === withVTableDecorator));
}

const unalignedDecorator: string = "Unaligned";
export function checkIfUnaligned(declaration: ts.ClassDeclaration) {
  return Boolean(declaration.decorators?.some((decorator) => decorator.expression.getText() === unalignedDecorator));
}

const nonPodDecorator = "NonPod";
export function checkIfNonPod(declaration: ts.ClassDeclaration) {
  return Boolean(declaration.decorators?.some((decorator) => decorator.expression.getText() === nonPodDecorator));
}

const hasConstructorDecorator = "HasConstructor";
export function checkIfHasConstructor(declaration: ts.ClassDeclaration) {
  return Boolean(
    declaration.decorators?.some((decorator) => decorator.expression.getText() === hasConstructorDecorator)
  );
}

const hasInheritanceDecorator = "HasInheritance";
export function checkIfHasInheritance(declaration: ts.ClassDeclaration) {
  return Boolean(
    declaration.decorators?.some((decorator) => decorator.expression.getText() === hasInheritanceDecorator)
  );
}

export function getExpressionTypename(expression: ts.Expression, checker: ts.TypeChecker): string {
  return checker.typeToString(checker.getTypeAtLocation(expression));
}

export function getProperties(type: ts.Type, checker: ts.TypeChecker) {
  return checker.getPropertiesOfType(type).filter(checkIfProperty);
}

export function getAliasedSymbolIfNecessary(symbol: ts.Symbol, checker: ts.TypeChecker) {
  if ((symbol?.flags & ts.SymbolFlags.Alias) !== 0) {
    return checker.getAliasedSymbol(symbol);
  }
  return symbol;
}

export function getTypeNamespace(type: ts.Type) {
  const symbol = type.symbol;
  if (!symbol || !symbol.valueDeclaration) {
    return "";
  }

  return getDeclarationNamespace(symbol.valueDeclaration).join("::");
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
  expression: ts.CallLikeExpression,
  generator: LLVMGenerator
): Map<string, ts.Type> {
  const { checker } = generator;
  const resolvedSignature = checker.getResolvedSignature(expression);
  if (!resolvedSignature) {
    error(`Failed to get resolved signature for '${expression.getText()}'`);
  }

  const typenameTypeMap = new Map<string, ts.Type>();

  const actualParameters = resolvedSignature.getParameters();
  const formalParameters = signature.getParameters();

  function handleType(type: ts.Type, typename: string, actualType: ts.Type) {
    if ((isTypeSupported(type, checker) && !checkIfFunction(type)) || typenameTypeMap.get(typename)) {
      return;
    }

    if (checkIfFunction(actualType)) {
      const parameterFormalParameters = type.getCallSignatures()[0].parameters;
      for (let k = 0; k < parameterFormalParameters.length; ++k) {
        const formalParameter = parameterFormalParameters[k];
        const formalParameterType = checker.getTypeOfSymbolAtLocation(formalParameter, expression);
        const formalParameterTypename = checker.typeToString(formalParameterType);

        const actualParameter = actualType.getCallSignatures()[0].parameters[k];
        const actualParameterType = checker.getTypeOfSymbolAtLocation(actualParameter, expression);

        typenameTypeMap.set(formalParameterTypename, actualParameterType);
      }
    } else {
      typenameTypeMap.set(typename, actualType);
    }
  }

  for (let i = 0; i < formalParameters.length; ++i) {
    const parameter = formalParameters[i];
    const type = checker.getTypeOfSymbolAtLocation(parameter, expression);

    if (type.isUnionOrIntersection()) {
      const actualType = checker.getTypeOfSymbolAtLocation(actualParameters[i], expression);
      if (!actualType.isUnionOrIntersection()) {
        error(`Expected actual type to be of UnionOrIntersection, got '${checker.typeToString(actualType)}'`);
      }

      type.types.forEach((subtype, index) => {
        const typename = checker.typeToString(subtype);
        handleType(subtype, typename, actualType.types[index]);
      });

      continue;
    }

    const typename = checker.typeToString(type);
    const actualType = checker.getTypeOfSymbolAtLocation(actualParameters[i], expression);
    handleType(type, typename, actualType);
  }

  const formalTypeParameters = signature.getTypeParameters();
  const formalTypeParametersNames = formalTypeParameters?.map((parameter) => checker.typeToString(parameter)) || [];

  const readyTypenames = Object.keys(typenameTypeMap);
  const difference = formalTypeParametersNames.filter((type) => !readyTypenames.includes(type));
  if (difference.length === 1 && !typenameTypeMap.get(difference[0])) {
    typenameTypeMap.set(difference[0], resolvedSignature.getReturnType());
  } else if (difference.length > 1) {
    console.log("Cannot map generic type arguments to template arguments.\nNot an external symbol?");
  }

  return typenameTypeMap;
}

export function getArgumentTypes(expression: ts.CallExpression, generator: LLVMGenerator): ts.Type[] {
  return expression.arguments.map((arg) => {
    const type = generator.checker.getTypeAtLocation(arg);
    if (Boolean(type.flags & ts.TypeFlags.TypeParameter)) {
      const typenameAlias = generator.checker.typeToString(type);
      return generator.symbolTable.currentScope.typeMapper!.get(typenameAlias) as ts.Type;
    } else {
      return type;
    }
  });
}

export function getReturnType(expression: ts.CallExpression, generator: LLVMGenerator): ts.Type {
  const resolvedSignature = generator.checker.getResolvedSignature(expression)!;
  const returnType = generator.checker.getReturnTypeOfSignature(resolvedSignature);
  return tryResolveGenericTypeIfNecessary(returnType, generator);
}

export function tryResolveGenericTypeIfNecessary(tsType: ts.Type, generator: LLVMGenerator): ts.Type {
  let result = tsType;

  if (!isTypeSupported(tsType, generator.checker)) {
    if (tsType.isUnionOrIntersection()) {
      const typeClone = cloneDeep(tsType);
      typeClone.types = typeClone.types.map((type) => {
        if (type.isUnionOrIntersection()) {
          return tryResolveGenericTypeIfNecessary(type, generator);
        }
        if (!isTypeSupported(type, generator.checker)) {
          const typename = generator.checker.typeToString(type);
          return generator.symbolTable.currentScope.typeMapper!.get(typename) as ts.Type;
        } else {
          return type;
        }
      });

      result = typeClone;
    } else {
      const typename = generator.checker.typeToString(tsType);
      result = generator.symbolTable.currentScope.typeMapper!.get(typename) as ts.Type;
    }
    if (!result) {
      error(`Unsupported type: '${generator.checker.typeToString(tsType)}'`);
    }
  }

  return result;
}

export function withObjectProperties<R>(
  expression: ts.ObjectLiteralExpression,
  action: (property: ts.ObjectLiteralElementLike, index: number, array: R[]) => R
): R[] {
  const resultArray: R[] = [];
  for (const property of expression.properties) {
    switch (property.kind) {
      case ts.SyntaxKind.PropertyAssignment:
      case ts.SyntaxKind.ShorthandPropertyAssignment:
      case ts.SyntaxKind.SpreadAssignment:
        resultArray.push(action(property, resultArray.length, resultArray));
        break;
      default:
        error(`Unhandled ts.ObjectLiteralElementLike '${ts.SyntaxKind[property.kind]}'`);
    }
  }
  return resultArray;
}

export function getRandomString() {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 5);
}

export function createTSObjectName(props: string[]) {
  // Reduce object's props names to string to store them as object's name.
  // Later this name may be used for out-of-order object initialization and property access.
  return getRandomString() + InternalNames.Object + props.join(".");
}

export function getExpressionText(expression: ts.Expression): string {
  // @todo: are there any other ts.Kinds we might be interested in?
  if (ts.isParenthesizedExpression(expression)) {
    return getExpressionText(expression.expression);
  }
  if (ts.isAsExpression(expression)) {
    return getExpressionText(expression.expression);
  }

  return expression.getText();
}

export enum InternalNames {
  Environment = "__environment__",
  Closure = "__closure__",
  FunctionScope = "__function_scope__",
  Object = "__object__",
}

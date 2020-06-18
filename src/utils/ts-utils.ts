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
  expression: ts.Expression,
  generator: LLVMGenerator
): { [_: string]: ts.Type } {
  const { checker } = generator;
  const formalTypeParameters = signature.getTypeParameters();
  const formalParameters = signature.getParameters();
  const resolvedSignature = checker.getResolvedSignature(expression as ts.CallLikeExpression)!;
  const map: { [key: string]: ts.Type } = {};
  const actualParameters = resolvedSignature.getParameters();

  for (let i = 0; i < formalParameters.length; ++i) {
    const parameter = formalParameters[i];
    const type = checker.getTypeOfSymbolAtLocation(parameter, expression);
    const typename = checker.typeToString(type);

    if ((isTypeSupported(type, checker) && !checkIfFunction(type)) || map[typename]) {
      continue;
    }

    const actualType = checker.getTypeOfSymbolAtLocation(actualParameters[i], expression);
    if (checkIfFunction(actualType)) {
      const parameterFormalParameters = type.getCallSignatures()[0].parameters;
      for (let k = 0; k < parameterFormalParameters.length; ++k) {
        const formalParameter = parameterFormalParameters[k];
        const formalParameterType = checker.getTypeOfSymbolAtLocation(formalParameter, expression);
        const formalParameterTypename = checker.typeToString(formalParameterType);
        const actualParameter = actualType.getCallSignatures()[0].parameters[k];
        const actualParameterType = generator.checker.getTypeOfSymbolAtLocation(actualParameter, expression);
        map[formalParameterTypename] = actualParameterType;
      }
    } else {
      map[typename] = actualType;
    }
  }

  const formalTypeParametersNames = formalTypeParameters?.map((parameter) => checker.typeToString(parameter)) || [];
  // @todo: keep order?
  const readyTypes = Object.keys(map);
  const difference = formalTypeParametersNames.filter((type) => !readyTypes.includes(type));
  if (difference.length === 1 && !map[difference[0]]) {
    map[difference[0]] = resolvedSignature.getReturnType();
  } else if (difference.length > 1) {
    console.log("Cannot map generic type arguments to template arguments.\nNot an external symbol?");
  }

  return map;
}

export function getArgumentTypes(expression: ts.CallExpression, generator: LLVMGenerator): ts.Type[] {
  return expression.arguments.map((arg) => {
    let type = generator.checker.getTypeAtLocation(arg);
    if (Boolean(type.flags & ts.TypeFlags.TypeParameter)) {
      const typenameAlias = generator.checker.typeToString(type);
      type = generator.symbolTable.currentScope.tryGetThroughParentChain(typenameAlias) as ts.Type;
      return type;
    } else {
      return type;
    }
  });
}

export function getReturnType(expression: ts.CallExpression, generator: LLVMGenerator): ts.Type {
  const symbol = generator.checker.getTypeAtLocation(expression.expression).symbol;
  const valueDeclaration = getAliasedSymbolIfNecessary(symbol, generator.checker)
    .valueDeclaration as ts.FunctionLikeDeclaration;
  const signature = generator.checker.getSignatureFromDeclaration(valueDeclaration as ts.SignatureDeclaration)!;
  let returnType = generator.checker.getReturnTypeOfSignature(signature);
  if (returnType.isTypeParameter()) {
    const typenameAlias = generator.checker.typeToString(returnType);
    returnType = generator.symbolTable.get(typenameAlias) as ts.Type;
  }
  return returnType;
}

export function tryResolveGenericTypeIfNecessary(tsType: ts.Type, generator: LLVMGenerator): ts.Type {
  if (!isTypeSupported(tsType, generator.checker)) {
    if (tsType.isUnionOrIntersection()) {
      tsType.types = tsType.types.map((type) => {
        if (!isTypeSupported(type, generator.checker)) {
          const typename = generator.checker.typeToString(type);
          return generator.symbolTable.currentScope.tryGetThroughParentChain(typename) as ts.Type;
        } else {
          return type;
        }
      });
    } else {
      const typename = generator.checker.typeToString(tsType);
      tsType = generator.symbolTable.currentScope.tryGetThroughParentChain(typename) as ts.Type;
    }
    if (!tsType) {
      return error(`Unsupported type: '${generator.checker.typeToString(tsType)}'`);
    }
  }

  return tsType;
}

export function findIndexOfSubarray(arr: llvm.Type[], subarr: llvm.Type[]): number {
  position_loop: for (let i = 0; i <= arr.length - subarr.length; ++i) {
    for (let j = 0; j < subarr.length; ++j) {
      if (!arr[i + j].equals(subarr[j])) {
        continue position_loop;
      }
    }
    return i;
  }
  return -1;
}

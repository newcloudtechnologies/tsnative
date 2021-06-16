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
import { error } from "@utils";
import { LLVMGenerator } from "@generator";
import { Type } from "../ts/type";

const valueTypeDecorator: string = "ValueType";
export function checkIfValueTypeProperty(declaration: ts.Declaration): boolean {
  return Boolean(declaration.decorators?.some((decorator) => decorator.expression.getText() === valueTypeDecorator));
}

const withVTableDecorator: string = "VTable";
export function checkIfHasVTable(declaration: ts.ClassDeclaration) {
  return Boolean(declaration.decorators?.some((decorator) => decorator.expression.getText() === withVTableDecorator));
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
) {
  const typenameTypeMap = new Map<string, Type>();

  const resolvedSignature = generator.ts.checker.getResolvedSignature(expression);
  const actualParameters = resolvedSignature.getParameters();
  const formalParameters = signature.getParameters();

  function handleType(type: Type, actualType: Type) {
    if ((type.isSupported() && !type.isFunction()) || typenameTypeMap.has(type.toString())) {
      return;
    }

    if (actualType.isFunction()) {
      const callSignature = type.getCallSignatures()[0];
      const actualCall = actualType.getCallSignatures()[0];
      const parameterFormalParameters = callSignature.parameters;

      for (let k = 0; k < parameterFormalParameters.length; ++k) {
        const formalParameter = parameterFormalParameters[k];
        const formalParameterType = generator.ts.checker.getTypeOfSymbolAtLocation(formalParameter, expression);
        const formalParameterTypename = formalParameterType.originTypename();

        const actualParameter = actualCall.parameters[k];
        const actualParameterType = generator.ts.checker.getTypeOfSymbolAtLocation(actualParameter, expression);

        typenameTypeMap.set(formalParameterTypename, actualParameterType);
      }

      const formalReturnType = generator.ts.checker.getReturnTypeOfSignature(callSignature);
      const formalReturnTypename = formalReturnType.originTypename();

      const actualReturnType = generator.ts.checker.getReturnTypeOfSignature(actualCall);

      typenameTypeMap.set(formalReturnTypename, actualReturnType);
    } else {
      typenameTypeMap.set(type.originTypename(), actualType);
    }
  }

  for (let i = 0; i < formalParameters.length; ++i) {
    const parameter = formalParameters[i];
    const type = generator.ts.checker.getTypeOfSymbolAtLocation(parameter, expression);

    if (type.isUnionOrIntersection()) {
      const actualType = generator.ts.checker.getTypeOfSymbolAtLocation(actualParameters[i], expression);
      if (!actualType.isUnionOrIntersection()) {
        error(`Expected actual type to be of UnionOrIntersection, got '${actualType.toString()}'`);
      }

      type.types.forEach((subtype, index) => {
        handleType(subtype, actualType.types[index]);
      });

      continue;
    }

    const actualType = generator.ts.checker.getTypeOfSymbolAtLocation(actualParameters[i], expression);
    handleType(type, actualType);
  }

  const formalTypeParameters = signature.getTypeParameters();
  const formalTypeParametersNames =
    formalTypeParameters?.map((parameter) => new Type(parameter, generator.ts.checker).toString()) || [];

  const readyTypenames = Object.keys(typenameTypeMap);
  const difference = formalTypeParametersNames.filter((type) => !readyTypenames.includes(type));
  if (difference.length === 1 && !typenameTypeMap.get(difference[0])) {
    typenameTypeMap.set(difference[0], new Type(resolvedSignature.getReturnType(), generator.ts.checker));
  } else if (difference.length > 1) {
    console.log("Cannot map generic type arguments to template arguments.\nNot an external symbol?");
  }

  return typenameTypeMap;
}

export function getArgumentTypes(expression: ts.CallExpression, generator: LLVMGenerator): Type[] {
  return expression.arguments.map((arg) => {
    const type = generator.ts.checker.getTypeAtLocation(arg);
    if (type.isTypeParameter()) {
      const typenameAlias = type.toString();
      return generator.symbolTable.currentScope.typeMapper.get(typenameAlias);
    } else {
      return type;
    }
  });
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

export function getAccessorType(
  expression: ts.Expression,
  generator: LLVMGenerator
): ts.SyntaxKind.GetAccessor | ts.SyntaxKind.SetAccessor | undefined {
  let result: ts.SyntaxKind.GetAccessor | ts.SyntaxKind.SetAccessor | undefined;

  const symbol = generator.ts.checker.getSymbolAtLocation(expression);
  if (symbol.declarations.length === 1) {
    if (ts.isGetAccessorDeclaration(symbol.declarations[0])) {
      result = ts.SyntaxKind.GetAccessor;
    } else if (ts.isSetAccessorDeclaration(symbol.declarations[0])) {
      result = ts.SyntaxKind.SetAccessor;
    }
  } else if (
    symbol.declarations.length > 1 &&
    symbol.declarations.some(
      (declaration) => ts.isGetAccessorDeclaration(declaration) || ts.isSetAccessorDeclaration(declaration)
    )
  ) {
    if (ts.isBinaryExpression(expression.parent)) {
      // @todo: what about property access chains?
      if (
        ts.isPropertyAccessExpression(expression.parent.left) ||
        ts.isPropertyAccessExpression(expression.parent.right)
      ) {
        result =
          expression.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
            ? ts.SyntaxKind.SetAccessor
            : ts.SyntaxKind.GetAccessor;
      } else if (ts.isPropertyAccessExpression(expression)) {
        result = ts.SyntaxKind.GetAccessor;
      }
    } else {
      result = ts.SyntaxKind.GetAccessor;
    }
  }

  return result;
}

export enum InternalNames {
  Environment = "__environment__",
  FunctionScope = "__function_scope__",
  Object = "__object__",
  This = "this",
}

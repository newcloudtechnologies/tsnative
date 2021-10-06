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

import { ExternalSymbolsProvider } from "../mangling";
import * as ts from "typescript";
import { LLVMGenerator } from "../generator";
import { TSType } from "../ts/type";
import { Declaration } from "../ts/declaration";
import { Expression } from "../ts/expression";

export class FunctionMangler {
  static mangle(
    declaration: Declaration,
    expression: ts.Expression | undefined,
    thisType: TSType | undefined,
    argumentTypes: TSType[],
    generator: LLVMGenerator,
    knownGenericTypes?: TSType[]
  ): { isExternalSymbol: boolean; qualifiedName: string } {
    const provider: ExternalSymbolsProvider = new ExternalSymbolsProvider(
      declaration,
      expression as ts.CallExpression | ts.NewExpression | undefined,
      argumentTypes,
      thisType,
      generator,
      declaration.mapping,
      knownGenericTypes
    );
    const maybeMangled = provider.tryGet(declaration);
    if (maybeMangled) {
      return {
        isExternalSymbol: true,
        qualifiedName: maybeMangled,
      };
    }

    const { parent } = declaration;
    let parentName: string | undefined;
    if (thisType) {
      parentName = thisType.mangle();
    } else if (ts.isModuleBlock(parent)) {
      parentName = declaration.getNamespace().join("__");
    }

    const scopePrefix = parentName ? parentName + "__" : "";

    let typeParametersNames = "";
    const typeParameters = declaration.typeParameters;
    if (typeParameters?.length) {
      typeParametersNames = argumentTypes.reduce((acc, curr) => {
        return acc + "__" + curr.toString();
      }, "");
    }

    const baseName = declaration.isConstructor()
      ? "constructor"
      : declaration.name?.getText() ||
        (expression && ts.isCallExpression(expression) && expression.expression.getText());

    if (!baseName) {
      throw new Error(`No base name at '${expression?.getText() || "<no expression>"}'`);
    }

    return {
      isExternalSymbol: false,
      qualifiedName: scopePrefix + baseName + typeParametersNames,
    };
  }

  static checkIfExternalSymbol(call: ts.CallExpression, generator: LLVMGenerator) {
    const argumentTypes = Expression.create(call, generator).getArgumentTypes();
    const isMethod = Expression.create(call.expression, generator).isMethod();
    let thisType;
    if (isMethod) {
      const methodReference = call.expression as ts.PropertyAccessExpression;
      thisType = generator.ts.checker.getTypeAtLocation(methodReference.expression);
    }

    const symbol = generator.ts.checker.getTypeAtLocation(call.expression).getSymbol();
    const valueDeclaration = symbol.declarations[0];

    const thisTypeForMangling = valueDeclaration.isStaticMethod()
      ? generator.ts.checker.getTypeAtLocation((call.expression as ts.PropertyAccessExpression).expression)
      : thisType;

    const { isExternalSymbol } = FunctionMangler.mangle(
      valueDeclaration,
      call,
      thisTypeForMangling,
      argumentTypes,
      generator
    );

    return isExternalSymbol;
  }
}

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

import { ExternalSymbolsProvider, TypeMangler } from "@mangling";
import { getDeclarationNamespace, getTypename } from "@utils";
import * as ts from "typescript";
import { LLVMGenerator } from "@generator";

export class FunctionMangler {
  static mangle(
    declaration: ts.NamedDeclaration,
    expression: ts.Expression | undefined,
    thisType: ts.Type | undefined,
    argumentTypes: ts.Type[],
    generator: LLVMGenerator,
    knownMethodName?: string
  ): { isExternalSymbol: boolean; qualifiedName: string } {
    const provider: ExternalSymbolsProvider = new ExternalSymbolsProvider(
      declaration,
      expression as ts.CallExpression | ts.NewExpression,
      argumentTypes,
      thisType,
      generator,
      knownMethodName
    );
    const mangled: string | undefined = provider.tryGet(declaration);
    if (mangled) {
      return {
        isExternalSymbol: true,
        qualifiedName: mangled,
      };
    }

    const { parent } = declaration;
    let parentName: string | undefined;
    if (thisType) {
      parentName = TypeMangler.mangle(thisType, generator.checker, declaration);
    } else if (ts.isModuleBlock(parent)) {
      parentName = getDeclarationNamespace(declaration).join("__");
    }

    const scopePrefix = parentName ? parentName + "__" : "";

    let typeParametersNames = "";
    const typeParameters = (declaration as ts.FunctionLikeDeclaration).typeParameters;
    if (typeParameters?.length) {
      typeParametersNames = argumentTypes.reduce((acc, curr) => {
        return acc + "__" + getTypename(curr, generator.checker);
      }, "");
    }

    const baseName = ts.isConstructorDeclaration(declaration) ? "constructor" : declaration.name?.getText() || "";
    return {
      isExternalSymbol: false,
      qualifiedName: scopePrefix + baseName + typeParametersNames,
    };
  }
}

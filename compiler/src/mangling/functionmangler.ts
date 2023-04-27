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

import { ExternalSymbolsProvider } from "../mangling";
import * as ts from "typescript";
import { GenericTypeMapper, LLVMGenerator } from "../generator";
import { TSType } from "../ts/type";
import { Declaration } from "../ts/declaration";

export class FunctionMangler {
  static mangle(
    declaration: Declaration,
    expression: ts.Expression | undefined,
    thisType: TSType | undefined,
    argumentTypes: TSType[],
    generator: LLVMGenerator,
    knownGenericTypes?: string[],
    knownArgumentTypes?: string[]
  ): { isExternalSymbol: boolean; qualifiedName: string } {
    if (declaration.isAmbient()) {
      const provider: ExternalSymbolsProvider = new ExternalSymbolsProvider(
        declaration,
        expression as ts.CallExpression | ts.NewExpression | ts.PropertyAccessExpression | undefined,
        argumentTypes,
        thisType,
        generator,
        declaration.mapping,
        knownGenericTypes,
        knownArgumentTypes
      );
      const maybeMangled = provider.tryGet();
      if (maybeMangled) {
        return {
          isExternalSymbol: true,
          qualifiedName: maybeMangled,
        };
      }
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

    if (declaration.isMethod()) {
      const classDeclaration = Declaration.create(declaration.parent as ts.ClassDeclaration, generator);
      const classTypeParameters = classDeclaration.typeParameters;
      if (classTypeParameters) {
        const typeMapper = generator.meta.getClassTypeMapper(classDeclaration);

        const types = classTypeParameters.map((typeParameter) => {
          let type = generator.ts.checker.getTypeAtLocation(typeParameter);
          if (!type.isSupported()) {
            type = typeMapper.get(type.toString());
          }
          return type.toString();
        });

        console.log("types", types)
      }
    }

    const typeParameters = declaration.typeParameters;
    if (typeParameters?.length) {

      console.log("===========================")
      console.log(expression?.getText())
      typeParameters.forEach((typeParameter) => {
        console.log(typeParameter.expression?.getText())
      })

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
}

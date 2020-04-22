import { ExternalSymbolsProvider, getDeclarationBaseName, TypeMangler } from "@mangling";
import { error } from "@utils";
import * as ts from "typescript";

export class FunctionMangler {
  static mangle(
    declaration: ts.NamedDeclaration,
    expression:
      | ts.NewExpression
      | ts.CallExpression
      | ts.ArrayLiteralExpression
      | ts.ElementAccessExpression
      | ts.Expression,
    thisType: ts.Type | undefined,
    argumentTypes: ts.Type[],
    checker: ts.TypeChecker
  ): { isExternalSymbol: boolean; qualifiedName: string } {
    const { parent } = declaration;
    let parentName: string | undefined;

    if (!thisType && (ts.isClassDeclaration(parent) || ts.isInterfaceDeclaration(parent))) {
      return error("Mangling methods requires thisType");
    }

    const provider: ExternalSymbolsProvider = new ExternalSymbolsProvider(
      declaration,
      expression as ts.CallExpression | ts.NewExpression,
      argumentTypes,
      thisType,
      checker
    );

    const mangled: string | undefined = provider.tryGet(declaration);

    if (mangled) {
      return {
        isExternalSymbol: true,
        qualifiedName: mangled
      };
    }
    if (thisType) {
      parentName = TypeMangler.mangle(thisType, checker, declaration);
    } else if (ts.isModuleBlock(parent)) {
      parentName = parent.parent.name.text;
    }

    const scopePrefix = parentName ? parentName + "__" : "";
    const baseName = getDeclarationBaseName(declaration);
    return {
      isExternalSymbol: false,
      qualifiedName: scopePrefix + baseName
    };
  }
}

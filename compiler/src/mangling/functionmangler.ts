import { ExternalSymbolsProvider } from "../mangling";
import * as ts from "typescript";
import { LLVMGenerator } from "../generator";
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
}

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

import { NmSymbolExtractor } from "@mangling";
import { error, flatten, getDeclarationNamespace, getTypeGenericArguments, getTypename, isTypeSupported } from "@utils";
import { lookpath } from "lookpath";
import * as ts from "typescript";

export let externalMangledSymbolsTable: string[] = [];
export let externalDemangledSymbolsTable: string[] = [];
export function injectExternalSymbolsTables(mangled: string[], demangled: string[]): void {
  if (mangled.length !== demangled.length) {
    return error("Symbols tables size mismatch");
  }

  externalMangledSymbolsTable = mangled;
  externalDemangledSymbolsTable = demangled;
}

export async function prepareExternalSymbols(cppDirs: string[]) {
  switch (process.platform) {
    case "aix":
    case "darwin":
    case "freebsd":
    case "linux":
    case "openbsd":
    case "sunos":
      const nm = await lookpath("nm");
      if (!nm) {
        error(`nm utility not found`);
      }

      const extractor: NmSymbolExtractor = new NmSymbolExtractor();
      return extractor.extractSymbols(cppDirs || []);
    case "win32":
    default:
      error(`Unsupported platform ${process.platform}`);
  }
}

class Itanium {
  static completeObjectConstructor: string = "C1";
}

type Predicate = (cppSignature: string, mangledIndex: number) => boolean;
export class ExternalSymbolsProvider {
  static jsTypeToCpp(type: ts.Type, checker: ts.TypeChecker): string {
    if (ts.isArrayTypeNode(checker.typeToTypeNode(type)!)) {
      const elementType: ts.Type | undefined = getTypeGenericArguments(type)[0];
      return `Array<${this.jsTypeToCpp(elementType!, checker)}>`;
    }

    let typename: string = "";

    if (type.isNumberLiteral()) {
      typename = "number";
    } else if (type.isStringLiteral()) {
      typename = "string";
    } else {
      typename = checker.typeToString(type);
    }

    switch (typename) {
      case "String": // @todo
        return "string";
      case "number":
        return "double";
      case "boolean":
        return "bool";
      case "int8_t":
        return "signed char";
      case "int16_t":
        return "short";
      case "int32_t":
        return "int";
      case "int64_t":
        return "long";
      case "uint8_t":
        return "unsigned char";
      case "uint16_t":
        return "unsigned short";
      case "uint32_t":
        return "unsigned int";
      case "uint64_t":
        return "unsigned long";
      default:
        return typename;
    }
  }
  private readonly namespace: string;
  private readonly thisTypeName: string = "";
  private readonly baseTypeNames: string[] = [];
  private readonly classTemplateParametersPattern: string = "";
  private readonly methodName: string;
  private readonly parametersPattern: string;
  private readonly functionTemplateParametersPattern: string;
  constructor(
    declaration: ts.Declaration,
    expression: ts.NewExpression | ts.CallExpression | undefined,
    argumentTypes: ts.Type[],
    thisType: ts.Type | undefined,
    checker: ts.TypeChecker,
    knownMethodName?: string
  ) {
    const namespace = getDeclarationNamespace(declaration).join("::");
    this.namespace = namespace ? namespace + "::" : "";
    if (thisType) {
      this.thisTypeName = getTypename(thisType, checker);
      this.baseTypeNames = this.extractBaseTypeNames(declaration);
      this.classTemplateParametersPattern = getTypeGenericArguments(thisType)
        .map((type) => this.jsStringTypeToCpp(checker.typeToString(type)))
        .join(",");
    }
    this.methodName = knownMethodName || this.getDeclarationBaseName(declaration);
    this.parametersPattern = argumentTypes.map((type) => ExternalSymbolsProvider.jsTypeToCpp(type, checker)).join(",");
    this.functionTemplateParametersPattern = this.extractFunctionTemplateParameters(declaration, expression, checker);
  }
  tryGet(declaration: ts.NamedDeclaration): string | undefined {
    let mangledName = this.tryGetImpl(declaration);

    if (mangledName) {
      return mangledName;
    }

    if (ts.isMethodDeclaration(declaration)) {
      for (const baseTypeName of this.baseTypeNames) {
        const classMethodPattern = new RegExp(
          `(?=(^| )${this.namespace}${baseTypeName}(<.*>::|::)${this.methodName}(\\(|<.*>\\())`
        );
        mangledName = this.handleDeclarationWithPredicate((cppSignature: string) => {
          return classMethodPattern.test(cppSignature);
        });
        if (mangledName) {
          return mangledName;
        }
      }
    }

    return;
  }
  private getDeclarationBaseName(declaration: ts.NamedDeclaration) {
    switch (declaration.kind) {
      case ts.SyntaxKind.IndexSignature:
        return "operator\\[]";
      default:
        return declaration.name?.getText() || "";
    }
  }
  private extractBaseTypeNames(declaration: ts.Declaration): string[] {
    let baseTypeNames: string[] = [];
    const declarationHeritageClausesToTypeNames = (classLikeDeclaration: ts.ClassLikeDeclaration): string[] => {
      return flatten(
        classLikeDeclaration.heritageClauses?.map((clause) => {
          return clause.types.map((expressionWithType) => expressionWithType.getText());
        }) || []
      );
    };
    if (ts.isConstructorDeclaration(declaration)) {
      const parentConstructorDeclaration = (declaration as ts.ConstructorDeclaration).parent;
      baseTypeNames = declarationHeritageClausesToTypeNames(parentConstructorDeclaration);
    } else if (ts.isMethodDeclaration(declaration)) {
      if (ts.isClassLike(declaration.parent)) {
        const parentClassLikeDeclaration = declaration.parent as ts.ClassLikeDeclaration;
        baseTypeNames = declarationHeritageClausesToTypeNames(parentClassLikeDeclaration);
      }
    }
    return baseTypeNames;
  }
  private extractFunctionTemplateParameters(
    declaration: ts.Declaration,
    expression: ts.Expression | undefined,
    checker: ts.TypeChecker
  ): string {
    let functionTemplateParametersPattern: string = "";

    if (!expression) {
      return functionTemplateParametersPattern;
    }

    const isConstructor = ts.isConstructorDeclaration(declaration);
    if (isConstructor) {
      return functionTemplateParametersPattern;
    }

    if (!ts.isCallExpression(expression) && !ts.isNewExpression(expression)) {
      return functionTemplateParametersPattern;
    }

    const signature = checker.getSignatureFromDeclaration(declaration as ts.SignatureDeclaration)!;
    const formalTypeParameters = signature.getTypeParameters();

    if (!formalTypeParameters) {
      return functionTemplateParametersPattern;
    }

    const formalParameters = signature.getParameters();
    const resolvedSignature = checker.getResolvedSignature(expression)!;
    if (formalParameters.length === 0) {
      functionTemplateParametersPattern = ExternalSymbolsProvider.jsTypeToCpp(
        resolvedSignature.getReturnType(),
        checker
      );

      return functionTemplateParametersPattern;
    }

    const map: { [key: string]: ts.Type } = {};
    const actualParameters = resolvedSignature.getParameters();
    const templateTypes: string[] = [];
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

    for (const type in map) {
      if (map.hasOwnProperty(type)) {
        templateTypes.push(ExternalSymbolsProvider.jsTypeToCpp(map[type], checker));
      }
    }

    functionTemplateParametersPattern = templateTypes.join(",");
    return functionTemplateParametersPattern;
  }
  private tryGetImpl(declaration: ts.NamedDeclaration): string | undefined {
    if (ts.isConstructorDeclaration(declaration)) {
      // `Ctor::Ctor(` or `Ctor<T>::Ctor(`
      const constructorPattern = new RegExp(
        `(?=^${this.namespace}${this.thisTypeName}(<.*>::|::)${this.thisTypeName}\\()`,
        "i" // @todo: potential pitfall, but handy for String-string case
      );
      return this.handleDeclarationWithPredicate((cppSignature: string, mangledIndex: number) => {
        return (
          constructorPattern.test(cppSignature) &&
          externalMangledSymbolsTable[mangledIndex].includes(Itanium.completeObjectConstructor)
        );
      });
    } else if (ts.isFunctionDeclaration(declaration)) {
      // `.*methodName<T>(` or `.*methodName(`
      // @todo is it possible to use mangled form to figure out if this is a class method or free function wrapped in namespace?
      const freeFunctionPattern = new RegExp(`(?=(^| )${this.namespace}${this.methodName}(\\(|<.*>\\())`);
      return this.handleDeclarationWithPredicate((cppSignature: string) => {
        return freeFunctionPattern.test(cppSignature);
      });
    } else if (
      ts.isMethodDeclaration(declaration) ||
      ts.isIndexSignatureDeclaration(declaration) ||
      ts.isPropertyDeclaration(declaration) ||
      ts.isGetAccessorDeclaration(declaration)
    ) {
      // `.*( | ns)Class::method(`
      // `.*( | ns)Class::method<U>(`
      // `.*( | ns)Class<T>::method(`
      // `.*( | ns)Class<T>::method<U>(`
      const classMethodPattern = new RegExp(
        `(?=(^| )${this.namespace}${this.thisTypeName}(<.*>::|::)${this.methodName}(\\(|<.*>\\())`
      );
      return this.handleDeclarationWithPredicate((cppSignature: string) => {
        return classMethodPattern.test(cppSignature);
      });
    }

    return error("Unhandled declaration");
  }
  private handleDeclarationWithPredicate(predicate: Predicate) {
    let candidates: {
      index: number;
      signature: string;
    }[] = [];
    for (let i = 0; i < externalDemangledSymbolsTable.length; ++i) {
      const candidate = externalDemangledSymbolsTable[i];
      if (predicate(candidate, i)) {
        candidates.push({ index: i, signature: candidate });
      }
    }
    if (candidates.length < 2) {
      return externalMangledSymbolsTable[candidates[0]?.index];
    }

    candidates = candidates.filter((candidate) => this.isMatching(candidate.signature));
    if (candidates.length > 1) {
      console.log(candidates);
      return error("Ambiguous function call");
    }
    return externalMangledSymbolsTable[candidates[0]?.index];
  }
  private extractParameterTypes(cppSignature: string): string {
    // @todo: use lazy cache
    return cppSignature
      .match(/(?<=\().*(?=\))/)![0]
      .split(",")
      .map((parameter) => {
        return parameter.replace(/(const|volatile|&|\*)/g, "").trim();
      })
      .join(",");
  }
  private extractTemplateParameterTypes(cppSignature: string): string[] {
    // @todo: use lazy cache
    const classTemplateParametersMatches = cppSignature.match(`(?<=${this.namespace}${this.thisTypeName}<).*(?=>::)`);
    const functionTemplateParametersMatches = cppSignature.match(`(?<=${this.methodName}<).*(?=>\\()`);

    let classTemplateParameters: string = "";
    let functionTemplateParameters: string = "";

    const extractTypes = (parameters: string): string => {
      return parameters
        .split(",")
        .map((parameter) => parameter.replace(/(const|volatile|&|\*)/g, "").trim())
        .join(",");
    };

    if (classTemplateParametersMatches) {
      classTemplateParameters = extractTypes(classTemplateParametersMatches[0]);
    }

    if (functionTemplateParametersMatches) {
      functionTemplateParameters = extractTypes(functionTemplateParametersMatches[0]);
    }

    return [classTemplateParameters, functionTemplateParameters];
  }
  private isMatching(cppSignature: string): boolean {
    const parameters: string = this.extractParameterTypes(cppSignature);

    let matching: boolean = parameters === this.parametersPattern;
    if (
      matching &&
      (this.classTemplateParametersPattern.length > 0 || this.functionTemplateParametersPattern.length > 0)
    ) {
      const [classTemplateParameters, functionTemplateParameters] = this.extractTemplateParameterTypes(cppSignature);
      matching =
        classTemplateParameters === this.classTemplateParametersPattern &&
        functionTemplateParameters === this.functionTemplateParametersPattern;
    }
    return matching;
  }
  private jsStringTypeToCpp(type: string): string {
    switch (type) {
      case "number":
        return "double";
      case "boolean":
        return "bool";
      default:
        return type;
    }
  }
}

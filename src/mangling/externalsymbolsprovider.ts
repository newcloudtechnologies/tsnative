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
import {
  error,
  getDeclarationNamespace,
  getTypeGenericArguments,
  getTypename,
  checkIfFunction,
  getGenericsToActualMapFromSignature,
  checkIfString,
  checkIfObject,
  getTypeNamespace,
  getAliasedSymbolIfNecessary,
  checkIfIntersection,
  checkIfUnion,
} from "@utils";
import * as ts from "typescript";
import { LLVMGenerator } from "@generator";

export let externalMangledSymbolsTable: string[] = [];
export let externalDemangledSymbolsTable: string[] = [];
export function injectExternalSymbolsTables(mangled: string[], demangled: string[]): void {
  if (mangled.length !== demangled.length) {
    error("Symbols tables size mismatch");
  }

  externalMangledSymbolsTable = mangled;
  externalDemangledSymbolsTable = demangled;
}

export async function prepareExternalSymbols(demangledTables: string[], mangledTables: string[]) {
  switch (process.platform) {
    case "aix":
    case "darwin":
    case "freebsd":
    case "linux":
    case "openbsd":
    case "sunos":
    case "win32":
      const extractor: NmSymbolExtractor = new NmSymbolExtractor();
      return extractor.readSymbols(demangledTables, mangledTables);
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
    if (checkIfFunction(type)) {
      return "TSClosure*";
    }
    if (ts.isArrayTypeNode(checker.typeToTypeNode(type)!)) {
      const elementType = getTypeGenericArguments(type)[0]!;
      let cppElementType = this.jsTypeToCpp(elementType, checker);
      if (checkIfString(elementType, checker) || checkIfObject(elementType)) {
        cppElementType += "*";
      }
      return `Array<${cppElementType}>`;
    }

    let typename: string = "";

    if (type.isNumberLiteral()) {
      typename = "number";
    } else if (type.isStringLiteral()) {
      typename = "string";
    } else {
      typename = checker.typeToString(type);
      if (checkIfUnion(type) || checkIfIntersection(type)) {
        typename = "void*";
      } else {
        let symbol = type.getSymbol();
        if (symbol) {
          symbol = getAliasedSymbolIfNecessary(symbol, checker);
          const declaration = symbol.declarations[0];

          if (ts.isClassDeclaration(declaration)) {
            const ambientDeclaration = !declaration.members.find(ts.isConstructorDeclaration)?.body;
            if (!ambientDeclaration) {
              typename = "void";
            }
          }
        }
      }
    }

    switch (typename) {
      case "String": // @todo
        return "string";
      case "Number":
      case "number":
        return "double";
      case "Boolean":
      case "boolean":
      case "true":
      case "false":
        return "bool";
      case "int8_t":
        return "signed char";
      case "int16_t":
        return "short";
      case "int32_t":
        return "int";
      case "int64_t":
        return getInt64Type();
      case "uint8_t":
        return "unsigned char";
      case "uint16_t":
        return "unsigned short";
      case "uint32_t":
        return "unsigned int";
      case "uint64_t":
        return getUInt64Type();
      default:
        return typename;
    }
  }

  private readonly namespace: string;
  private readonly thisTypeName: string = "";
  private readonly classTemplateParametersPattern: string = "";
  private readonly methodName: string;
  private readonly argumentsPattern: string;
  private readonly parametersPattern: string;
  private readonly functionTemplateParametersPattern: string;
  private readonly generator: LLVMGenerator;

  constructor(
    declaration: ts.Declaration,
    expression: ts.NewExpression | ts.CallExpression | undefined,
    argumentTypes: ts.Type[],
    thisType: ts.Type | undefined,
    generator: LLVMGenerator,
    knownMethodName?: string
  ) {
    this.generator = generator;
    const namespace = getDeclarationNamespace(declaration).join("::");
    this.namespace = namespace ? namespace + "::" : "";
    if (thisType) {
      this.thisTypeName = getTypename(thisType, generator.checker);
      this.classTemplateParametersPattern = ExternalSymbolsProvider.unqualifyParameters(
        getTypeGenericArguments(thisType).map((type) => ExternalSymbolsProvider.jsTypeToCpp(type, generator.checker))
      );
    }

    const functionLikeDeclaration = declaration as ts.FunctionLikeDeclaration;
    const parameterTypes = functionLikeDeclaration.parameters.map(generator.checker.getTypeAtLocation) || [];

    this.methodName = knownMethodName || this.getDeclarationBaseName(declaration);

    // defined in declaration
    this.parametersPattern = ExternalSymbolsProvider.unqualifyParameters(
      parameterTypes.map((type) => {
        const typeNamespace = getTypeNamespace(type);
        const cppTypename = ExternalSymbolsProvider.jsTypeToCpp(type, generator.checker);
        return typeNamespace.length > 0 ? typeNamespace + "::" + cppTypename : cppTypename;
      })
    );

    // passed in fact
    this.argumentsPattern = ExternalSymbolsProvider.unqualifyParameters(
      argumentTypes.map((type) => {
        const typeNamespace = getTypeNamespace(type);
        const cppTypename = ExternalSymbolsProvider.jsTypeToCpp(type, generator.checker);
        return typeNamespace.length > 0 ? typeNamespace + "::" + cppTypename : cppTypename;
      })
    );

    this.functionTemplateParametersPattern = this.extractFunctionTemplateParameters(declaration, expression, generator);
  }
  tryGet(declaration: ts.NamedDeclaration): string | undefined {
    let mangledName = this.tryGetImpl(declaration);

    if (mangledName) {
      return mangledName;
    }

    if (ts.isMethodDeclaration(declaration)) {
      const classDeclaration = declaration.parent as ts.ClassLikeDeclaration;

      for (const clause of classDeclaration.heritageClauses || []) {
        for (const type of clause.types) {
          let classSymbol = this.generator.checker.getSymbolAtLocation(type.expression);
          if (!classSymbol) {
            error(`No class symbol found at '${type.expression.getText()}'`);
          }

          classSymbol = getAliasedSymbolIfNecessary(classSymbol, this.generator.checker);

          const classNamespace = getDeclarationNamespace(classSymbol.declarations[0]).join("::");
          const className = classSymbol.escapedName;

          const classMethodPattern = new RegExp(
            `(?=(^| )${classNamespace.length > 0 ? classNamespace + "::" : ""}${className}(<.*>::|::)${
              this.methodName
            }(\\(|<.*>\\())`
          );

          mangledName = this.handleDeclarationWithPredicate((cppSignature: string) => {
            return classMethodPattern.test(cppSignature);
          });
          if (mangledName) {
            return mangledName;
          }
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

  private extractFunctionTemplateParameters(
    declaration: ts.Declaration,
    expression: ts.CallExpression | ts.NewExpression | undefined,
    generator: LLVMGenerator
  ): string {
    const { checker } = generator;
    let functionTemplateParametersPattern: string = "";

    if (!expression) {
      return functionTemplateParametersPattern;
    }

    const isConstructor = ts.isConstructorDeclaration(declaration);
    if (isConstructor) {
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

    const typenameTypeMap = getGenericsToActualMapFromSignature(signature, expression as ts.CallExpression, generator);
    const templateTypes: string[] = [];
    typenameTypeMap.forEach((value) => {
      templateTypes.push(ExternalSymbolsProvider.jsTypeToCpp(value, checker));
    });

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

    return;
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

    candidates = candidates.filter((candidate) => this.isMatching(candidate.signature));

    if (candidates.length > 1) {
      if (candidates.some((c) => c.signature.includes("*"))) {
        // @todo Very, VERY fragile thing
        candidates = candidates.filter((c) => c.signature.includes("*"));
      }

      // duplicates may appear because of TemplateInstantiator
      const duplicatesOnly = candidates.every((candidate) => candidate.signature === candidates[0].signature);
      if (candidates.length > 1 && !duplicatesOnly) {
        console.log(candidates);
        error("Ambiguous function call");
      }
    }
    return externalMangledSymbolsTable[candidates[0]?.index];
  }

  static getParametersFromSignature(signature: string) {
    const OPEN_PAREN = "(";
    const CLOSE_PAREN = ")";

    const stack = [];
    let parameters = "";
    const startIndex = signature.lastIndexOf(CLOSE_PAREN); // @todo: handle noexcept(...) case
    for (let i = startIndex; i >= 0; --i) {
      const token = signature[i];
      if (token === CLOSE_PAREN) {
        stack.push(token);
      } else if (token === OPEN_PAREN) {
        stack.pop();
        if (stack.length === 0) {
          break;
        }
      }

      parameters = token + parameters;
    }

    return parameters.substring(0, parameters.length - 1);
  }

  static extractParameterTypes(cppSignature: string): string {
    return this.unqualifyParameters(this.getParametersFromSignature(cppSignature).split(","));
  }
  static unqualifyParameters(parameters: string[]): string {
    return parameters
      .map((parameter) => {
        return parameter
          .replace(/(const|volatile|&|(?<!\()\*)/g, "")
          .trim()
          .replace(/\s\)/g, ")");
      })
      .join(",");
  }
  private extractTemplateParameterTypes(cppSignature: string): string[] {
    // @todo: use lazy cache
    const namespaceType = this.namespace + this.thisTypeName;
    const classTemplateParametersPattern = `(?<=${namespaceType}<)(((?!${namespaceType}<).)*)(?=>::)`;
    const classTemplateParametersMatches = cppSignature.match(classTemplateParametersPattern);
    const functionTemplateParametersMatches = cppSignature.match(`(?<=${this.methodName}<).*(?=>\\()`);

    let classTemplateParameters: string = "";
    let functionTemplateParameters: string = "";

    const extractTypes = (parameters: string): string => {
      return ExternalSymbolsProvider.unqualifyParameters(parameters.split(","));
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
    const parameters = ExternalSymbolsProvider.extractParameterTypes(cppSignature);

    // check with parameters pattern first
    let matching: boolean = parameters === this.parametersPattern;

    // check with arguments pattern if is not matched
    if (!matching) {
      matching = parameters === this.argumentsPattern;
    }

    if (matching) {
      const [classTemplateParameters, functionTemplateParameters] = this.extractTemplateParameterTypes(cppSignature);

      /*
      @todo
      This case is necessary to make distinguish between Clazz<T>::do<U> and Clazz<U>::do<T>

      if (this.classTemplateParametersPattern.length > 0 && this.functionTemplateParametersPattern.length > 0) {
        matching =
          classTemplateParameters === this.classTemplateParametersPattern &&
          functionTemplateParameters === this.functionTemplateParametersPattern;
      }
      */

      if (this.classTemplateParametersPattern.length > 0) {
        matching = classTemplateParameters === this.classTemplateParametersPattern;
      } else if (this.functionTemplateParametersPattern.length > 0) {
        matching = functionTemplateParameters === this.functionTemplateParametersPattern;
      }
    }
    return matching;
  }
}

function getInt64Type() {
  switch (process.platform) {
    case "win32":
      return "long long";
    default:
      return "long";
  }
}

function getUInt64Type() {
  switch (process.platform) {
    case "win32":
      return "unsigned long long";
    default:
      return "unsigned long";
  }
}

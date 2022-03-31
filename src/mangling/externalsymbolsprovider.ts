/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { NmSymbolExtractor } from "../mangling";
import * as ts from "typescript";
import { GenericTypeMapper, LLVMGenerator } from "../generator";
import { TSType } from "../ts/type";
import { Declaration } from "../ts/declaration";

export let externalMangledSymbolsTable: string[] = [];
export let externalDemangledSymbolsTable: string[] = [];
export function injectExternalSymbolsTables(mangled: string[], demangled: string[]): void {
  if (mangled.length !== demangled.length) {
    throw new Error("Symbols tables size mismatch");
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
      const extractor = new NmSymbolExtractor();
      return extractor.readSymbols(demangledTables, mangledTables);
    default:
      throw new Error(`Unsupported platform ${process.platform}`);
  }
}

class Itanium {
  static completeObjectConstructor = "C1";
  static baseObjectConstructor = "C2";
}

type Predicate = (cppSignature: string, mangledIndex: number) => boolean;
export class ExternalSymbolsProvider {
  private readonly declaration: Declaration;
  private readonly namespace: string;
  private readonly thisTypeName: string = "";
  private readonly classTemplateParametersPattern: string = "";
  private readonly methodName: string;
  private readonly argumentsPattern: string;
  private readonly parametersPattern: string;
  private readonly functionTemplateParametersPattern: string;
  private readonly generator: LLVMGenerator;

  static getVTableSymbolFor(className: string) {
    const vtableIdx = externalDemangledSymbolsTable.findIndex((symbolName) => symbolName === `vtable for ${className}`);
    if (vtableIdx === -1) {
      throw new Error(`Unable to find vtable for '${className}'`);
    }

    return externalMangledSymbolsTable[vtableIdx];
  }

  constructor(
    declaration: Declaration,
    expression: ts.NewExpression | ts.CallExpression | ts.PropertyAccessExpression | undefined,
    argumentTypes: TSType[],
    thisType: TSType | undefined,
    generator: LLVMGenerator,
    knownMethodName?: string,
    knownGenericTypes?: string[],
    knownArgumentTypes?: string[]
  ) {
    this.declaration = declaration;
    this.generator = generator;

    const namespace = declaration.getNamespace().join("::");
    this.namespace = namespace ? namespace + "::" : "";

    if (thisType) {
      this.thisTypeName = thisType.getTypename();

      if (thisType.isTuple()) {
        this.thisTypeName = this.generator.ts.tuple.getDeclaration().type.toString();
      }

      if (!knownGenericTypes) {
        const thisTypeSymbol = thisType.getSymbol();
        const thisTypeValueDeclaration = thisTypeSymbol.valueDeclaration || thisTypeSymbol.declarations[0];

        let thisTypeTypeMapper: GenericTypeMapper | undefined;

        if (thisTypeValueDeclaration.typeParameters) {
          thisTypeTypeMapper = this.generator.meta.getClassTypeMapper(thisTypeValueDeclaration);
        }

        const typeArguments = thisType.getTypeGenericArguments();

        this.classTemplateParametersPattern = ExternalSymbolsProvider.unqualifyParameters(
          typeArguments.map((type) => {
            if (type.isTypeParameter() && !type.isSupported()) {
              type = thisTypeTypeMapper!.get(type.toString())!;
            }

            return type.toCppType();
          })
        );
      } else {
        this.classTemplateParametersPattern = ExternalSymbolsProvider.unqualifyParameters(knownGenericTypes);
      }
    }

    const parameterTypes = declaration.parameters.map((parameter) => generator.ts.checker.getTypeAtLocation(parameter));

    this.methodName = knownMethodName || this.getDeclarationBaseName(declaration);

    // defined in declaration
    this.parametersPattern = ExternalSymbolsProvider.unqualifyParameters(
      parameterTypes.map((type) => {
        const cppTypename = type.toCppType();
        return cppTypename;
      })
    );

    // passed in fact
    if (knownArgumentTypes) {
      this.argumentsPattern = ExternalSymbolsProvider.unqualifyParameters(knownArgumentTypes);
    } else {
      this.argumentsPattern = ExternalSymbolsProvider.unqualifyParameters(
        argumentTypes.map((type) => {
          return type.toCppType();
        })
      );
    }

    this.functionTemplateParametersPattern = this.extractFunctionTemplateParameters(declaration, expression, generator);
  }

  tryGet(): string | undefined {
    let mangledName = this.tryGetImpl(this.declaration);

    if (mangledName) {
      return mangledName;
    }

    if (this.declaration.isMethod()) {
      const classDeclaration = Declaration.create(this.declaration.parent as ts.ClassDeclaration, this.generator);
      if (!classDeclaration.name) {
        return;
      }

      const tryGetFromDeclaration = (otherDeclaration: Declaration, name: string) => {
        const classNamespace = otherDeclaration.getNamespace().join("::");

        const classMethodPattern = new RegExp(
          `(?=(^| )${classNamespace.length > 0 ? classNamespace + "::" : ""}${name}(<.*>::|::)${
            this.methodName
          }(\\(|<.*>\\())`
        );

        const mixinPattern = new RegExp(
          `(^[a-zA-Z\ \:]*)<${classNamespace.length > 0 ? classNamespace + "::" : ""}${name}>(::)${this.methodName}`
        );

        return this.handleDeclarationWithPredicate((cppSignature: string) => {
          return classMethodPattern.test(cppSignature) || mixinPattern.test(cppSignature);
        });
      };

      // 1. It may be a method of base class in case of extension (A extends B)
      mangledName = tryGetFromDeclaration(classDeclaration, classDeclaration.name.getText());
      if (mangledName) {
        return mangledName;
      }

      // 2. It may be a method of some of base classes in case of implementation (A implements B, C)
      // (this is how C++ multiple inheritance represented in ts-declarations)
      const implementsClauses =
        classDeclaration.heritageClauses?.filter((clause) => clause.token === ts.SyntaxKind.ImplementsKeyword) || [];
      for (const clause of implementsClauses) {
        for (const type of clause.types) {
          const classSymbol = this.generator.ts.checker.getSymbolAtLocation(type.expression);
          mangledName = tryGetFromDeclaration(classSymbol.declarations[0], classSymbol.escapedName.toString());
          if (mangledName) {
            return mangledName;
          }
        }
      }
    }

    return;
  }
  private getDeclarationBaseName(declaration: Declaration) {
    switch (declaration.kind) {
      case ts.SyntaxKind.IndexSignature:
        return "operator\\[]";
      default:
        return declaration.name?.getText() || "";
    }
  }

  private extractFunctionTemplateParameters(
    declaration: Declaration,
    expression: ts.CallExpression | ts.NewExpression | ts.PropertyAccessExpression | undefined,
    generator: LLVMGenerator
  ): string {
    let functionTemplateParametersPattern: string = "";

    if (!expression) {
      return functionTemplateParametersPattern;
    }

    if (ts.isPropertyAccessExpression(expression)) {
      return functionTemplateParametersPattern;
    }

    const isConstructor = declaration.isConstructor();
    if (isConstructor) {
      return functionTemplateParametersPattern;
    }

    const signature = generator.ts.checker.getSignatureFromDeclaration(declaration);
    const formalTypeParameters = signature.getTypeParameters();

    if (!formalTypeParameters) {
      return functionTemplateParametersPattern;
    }

    const formalParameters = signature.getParameters();
    const resolvedSignature = generator.ts.checker.getResolvedSignature(expression)!;
    if (formalParameters.length === 0) {
      functionTemplateParametersPattern = resolvedSignature.getReturnType().toPlainCppType();
      return functionTemplateParametersPattern;
    }

    const typenameTypeMap = signature.getGenericsToActualMap(expression);
    const templateTypes: string[] = [];
    typenameTypeMap.forEach((value) => {
      templateTypes.push(value.toPlainCppType());
    });

    functionTemplateParametersPattern = templateTypes.join(",");
    return functionTemplateParametersPattern;
  }
  private tryGetImpl(declaration: Declaration): string | undefined {
    if (declaration.isConstructor()) {
      return this.handleDeclarationWithPredicate((cppSignature: string, mangledIndex: number) => {
        const symbol = externalMangledSymbolsTable[mangledIndex];
        return (
          this.isConstructor(cppSignature) &&
          (symbol.includes(Itanium.completeObjectConstructor) || symbol.includes(Itanium.baseObjectConstructor))
        );
      });
    } else if (declaration.isFunction()) {
      // `.*methodName<T>(` or `.*methodName(`
      // @todo is it possible to use mangled form to figure out if this is a class method or free function wrapped in namespace?
      const freeFunctionPattern = new RegExp(`(?=(^| )${this.namespace}${this.methodName}(\\(|<.*>\\())`);
      return this.handleDeclarationWithPredicate((cppSignature: string) => {
        return freeFunctionPattern.test(cppSignature);
      });
    } else if (
      declaration.isMethod() ||
      declaration.isIndexSignature() ||
      declaration.isProperty() ||
      declaration.isGetAccessor() ||
      declaration.isSetAccessor()
    ) {
      // `.*( | ns)Class::method(`
      // `.*( | ns)Class::method<U>(`
      // `.*( | ns)Class<T>::method(`
      // `.*( | ns)Class<T>::method<U>(`
      const classMethodPattern = new RegExp(
        `(?=(^| )${this.namespace}${this.thisTypeName}(<.*>::|::)${this.methodName}(\\(|<.*>\\())`
      );

      const mixinPattern = new RegExp(`(^[a-zA-Z\ \:]*)<${this.namespace}${this.thisTypeName}>(::)${this.methodName}`);

      return this.handleDeclarationWithPredicate((cppSignature: string) => {
        return classMethodPattern.test(cppSignature) || mixinPattern.test(cppSignature);
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
        throw new Error("Ambiguous function call");
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
          .replace(/(const|volatile|&|\s|(?<!\()\*)/g, "")
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

  private isConstructor(cppSignature: string) {
    // `Ctor::Ctor(` or `Ctor<T>::Ctor(`
    const ctorPattern = new RegExp(`(?=^${this.namespace}${this.thisTypeName}(<.*>::|::)${this.thisTypeName}\\()`);
    return ctorPattern.test(cppSignature);
  }

  private isMatching(cppSignature: string): boolean {
    const parameters = ExternalSymbolsProvider.extractParameterTypes(cppSignature);

    // check parameters pattern first
    let matching = parameters === this.parametersPattern;

    // check arguments pattern if not matched with parameters
    if (!matching) {
      if (this.argumentsPattern.length > 0 || this.isConstructor(cppSignature)) {
        matching = parameters === this.argumentsPattern;
      }
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

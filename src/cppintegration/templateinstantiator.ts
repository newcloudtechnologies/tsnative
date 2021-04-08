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

import * as fs from "fs";
import * as ts from "typescript";
import * as path from "path";
import { NmSymbolExtractor, ExternalSymbolsProvider } from "@mangling";
import {
  checkIfArray,
  checkIfObject,
  checkIfString,
  error,
  flatten,
  getAliasedSymbolIfNecessary,
  getGenericsToActualMapFromSignature,
  getTypeGenericArguments,
  getTypeNamespace,
  isTypeSupported,
} from "@utils";
import { getArgumentArrayType } from "@handlers/utils";

export class TemplateInstantiator {
  private readonly sources: ts.SourceFile[];
  private readonly checker: ts.TypeChecker;
  private readonly demangled: string[] = [];
  private readonly includeDirs: string[] = [];
  private readonly stdIncludes: string[] = [
    "std-typescript-llvm/include/array.h",
    "std-typescript-llvm/include/console.h",
    "std-typescript-llvm/include/stdstring.h",
    "std-typescript-llvm/include/tsclosure.h",
  ];
  private generatedContent: string[] = [];

  private readonly INSTANTIATED_FUNCTIONS_FILE: string;
  private readonly INSTANTIATED_CLASSES_FILE: string;

  constructor(
    program: ts.Program,
    includeDirs: string[],
    templateInstancesPath: string,
    demangledTables: string[],
    mangledTables: string[]
  ) {
    // filter declarations
    this.sources = program.getSourceFiles().filter((source) => !source.isDeclarationFile);
    this.checker = program.getTypeChecker();
    this.includeDirs = includeDirs;

    const extractor: NmSymbolExtractor = new NmSymbolExtractor();
    const symbols = extractor.readSymbols(demangledTables, mangledTables);

    this.demangled = symbols.demangledSymbols;

    this.INSTANTIATED_FUNCTIONS_FILE = path.join(templateInstancesPath, "instantiated_functions.cpp");
    this.INSTANTIATED_CLASSES_FILE = path.join(templateInstancesPath, "instantiated_classes.cpp");
  }

  private correctQualifiers(tsType: ts.Type, cppType: string) {
    if (checkIfArray(tsType)) {
      // @todo: unify behavior
      cppType += " const&";
    } else if (checkIfString(tsType, this.checker) || checkIfObject(tsType)) {
      cppType += "*";
    }

    return cppType;
  }

  private handleGenericConsoleLog(call: ts.CallExpression) {
    const visitor = this.withTypesMapFromTypesProviderForNode(call, (typeMap: Map<string, ts.Type>) => {
      const argumentTypes = call.arguments.map((arg) => {
        let tsType = this.checker.getTypeAtLocation(arg);

        if (tsType.isTypeParameter()) {
          const typename = this.checker.typeToString(tsType);
          tsType = typeMap.get(typename)!;

          if (checkIfObject(tsType)) {
            error("console.log with object is not supported for generic types");
          }
        }

        const typeNamespace = getTypeNamespace(tsType);
        const cppTypename = ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker);
        return this.correctQualifiers(
          tsType,
          typeNamespace.length > 0 ? typeNamespace + "::" + cppTypename : cppTypename
        );
      });

      const maybeExists = this.demangled.filter((s) => s.includes("console::log"));

      const exists = maybeExists.some((s) => {
        return (
          ExternalSymbolsProvider.extractParameterTypes(s) ===
          ExternalSymbolsProvider.unqualifyParameters(argumentTypes)
        );
      });

      if (!exists) {
        const templateSignature = `template void console::log(${argumentTypes.join(", ")});`;
        this.generatedContent.push(templateSignature);
      }
    });

    this.sources.forEach((source) => {
      source.forEachChild(visitor);
    });
  }

  private handleConsoleLog(node: ts.Node) {
    let call: ts.CallExpression;
    if (ts.isExpressionStatement(node)) {
      call = node.expression as ts.CallExpression;
    } else if (ts.isCallExpression(node)) {
      call = node;
    } else {
      error(
        `Expected 'console.log' call to be of 'ts.ExpressionStatement' or 'ts.CallExpression' kind, got ${
          ts.SyntaxKind[node.kind]
        }`
      );
    }

    const hasGenericArguments = call.arguments.some((arg) => this.checker.getTypeAtLocation(arg).isTypeParameter());
    if (hasGenericArguments) {
      this.handleGenericConsoleLog(call);
    } else {
      const argumentTypes = call.arguments.map((arg) => {
        const tsType = this.checker.getTypeAtLocation(arg);

        const typeNamespace = getTypeNamespace(tsType);
        const cppTypename = ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker);
        return this.correctQualifiers(
          tsType,
          typeNamespace.length > 0 ? typeNamespace + "::" + cppTypename : cppTypename
        );
      });

      const maybeExists = this.demangled.filter((s) => s.includes("console::log"));

      const exists = maybeExists.some((signature) => {
        return (
          ExternalSymbolsProvider.extractParameterTypes(signature) ===
          ExternalSymbolsProvider.unqualifyParameters(argumentTypes)
        );
      });

      if (!exists) {
        const templateSignature = `template void console::log(${argumentTypes.join(", ")});`;
        this.generatedContent.push(templateSignature);
      }
    }
  }

  private handleArrayFromVariableDeclaration(node: ts.VariableDeclaration) {
    if (!node.initializer) {
      error(`Expected initializer: error at ${node.getText()}`);
    }

    if (ts.isArrayLiteralExpression(node.initializer)) {
      let templateInstance;
      if (node.initializer.elements.length > 0) {
        // const arr = [1, 2, 3];
        // Use elements to figure out array type.
        const tsType = this.checker.getTypeAtLocation(node.initializer.elements[0]);
        const tsTypename = ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker);

        // Arrays with values of different types not supported. Make a check.
        // @todo: Move this check to special correctness-check pass.
        if (
          node.initializer.elements.some((element) => {
            const elementType = this.checker.getTypeAtLocation(element);
            const elementTypename = ExternalSymbolsProvider.jsTypeToCpp(elementType, this.checker);
            return elementTypename !== tsTypename;
          })
        ) {
          error(`All array's elements have to be of same type: error at '${node.getText()}'`);
        }

        const typeNamespace = getTypeNamespace(tsType);
        let cppType = ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker);
        cppType = this.correctQualifiers(tsType, typeNamespace.length > 0 ? typeNamespace + "::" + cppType : cppType);

        templateInstance = `template class ${ExternalSymbolsProvider.jsTypeToCpp(
          this.checker.getTypeAtLocation(node.initializer),
          this.checker
        )};`;
      } else {
        // const arr: number[] = [];
        // Use declared type as array type.
        const tsType = this.checker.getTypeAtLocation(node);
        templateInstance = `template class ${ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker)};`;
      }

      this.generatedContent.push(templateInstance);
    } else if (ts.isCallExpression(node.initializer)) {
      const tsType = this.checker.getTypeAtLocation(node);
      if (!checkIfArray(tsType)) {
        error(`Array type expected, got '${this.checker.typeToString(tsType)}'`); // unreachable
      }
      const templateInstance = `template class ${ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker)};`;
      this.generatedContent.push(templateInstance);
    }
  }

  private handleArray(node: ts.Node) {
    if (ts.isVariableDeclaration(node)) {
      this.handleArrayFromVariableDeclaration(node);
    } else {
      if (ts.isCallExpression(node.parent) && ts.isArrayLiteralExpression(node) && node.elements.length === 0) {
        const typeFromParameterDeclaration = getArgumentArrayType(node, this.checker);
        const templateInstance = `template class ${ExternalSymbolsProvider.jsTypeToCpp(
          typeFromParameterDeclaration,
          this.checker
        )};`;
        this.generatedContent.push(templateInstance);
      } else {
        let tsType = this.checker.getTypeAtLocation(node);
        let elementType: ts.Type = getTypeGenericArguments(tsType)[0];

        if (elementType.isTypeParameter() && !isTypeSupported(elementType, this.checker)) {
          const visitor = this.withTypesMapFromTypesProviderForNode(node, (typesMap: Map<string, ts.Type>) => {
            const typename = this.checker.typeToString(elementType);
            elementType = typesMap.get(typename)!;

            const typeNamespace = getTypeNamespace(elementType);
            const elementTypename = ExternalSymbolsProvider.jsTypeToCpp(elementType, this.checker);

            const templateInstance = `template class Array<${this.correctQualifiers(
              elementType,
              typeNamespace.length > 0 ? typeNamespace + "::" + elementTypename : elementTypename
            )}>;`;

            this.generatedContent.push(templateInstance);
          });

          this.sources.forEach((source) => {
            source.forEachChild(visitor);
          });

          return;
        }

        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
          tsType = this.checker.getTypeAtLocation(node.left);
        }

        const templateInstance = `template class ${ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker)};`;
        this.generatedContent.push(templateInstance);
      }
    }
  }

  private handleGenericArrayMethods(call: ts.CallExpression) {
    if (!ts.isPropertyAccessExpression(call.expression)) {
      error(`Expected PropertyAccessExpression, got '${ts.SyntaxKind[call.expression.kind]}'`);
    }

    const tsArrayType = this.checker.getTypeAtLocation(call.expression.expression);
    let cppArrayType = ExternalSymbolsProvider.jsTypeToCpp(tsArrayType, this.checker);
    const methodName = call.expression.name.getText();

    const resolvedSignature = this.checker.getResolvedSignature(call);
    const tsReturnType = this.checker.getReturnTypeOfSignature(resolvedSignature!);
    let cppReturnType = ExternalSymbolsProvider.jsTypeToCpp(tsReturnType, this.checker);

    const visitor = this.withTypesMapFromTypesProviderForNode(call, (typesMap: Map<string, ts.Type>) => {
      const argumentTypes = call.arguments.map((arg) => {
        let tsType = this.checker.getTypeAtLocation(arg);

        if (tsType.isTypeParameter()) {
          const typename = this.checker.typeToString(tsType);
          tsType = typesMap.get(typename)!;
        }

        const typeNamespace = getTypeNamespace(tsType);
        const cppTypename = ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker);
        return this.correctQualifiers(
          tsType,
          typeNamespace.length > 0 ? typeNamespace + "::" + cppTypename : cppTypename
        );
      });

      const maybeExists = this.demangled.filter((s) => s.includes(cppArrayType + "::" + methodName));

      const exists = maybeExists.some((signature) => {
        return (
          ExternalSymbolsProvider.extractParameterTypes(signature) ===
          ExternalSymbolsProvider.unqualifyParameters(argumentTypes)
        );
      });

      if (exists) {
        return;
      }

      const resolveArrayElementType = (arrayType: ts.Type) => {
        const arrayTypename = this.checker.typeToString(arrayType);
        arrayType = typesMap.get(arrayTypename)!;

        const typeNamespace = getTypeNamespace(arrayType);

        let cppType = ExternalSymbolsProvider.jsTypeToCpp(arrayType, this.checker);
        cppType = this.correctQualifiers(
          arrayType,
          typeNamespace.length > 0 ? typeNamespace + "::" + cppType : cppType
        );

        return cppType;
      };

      const thisArrayElementType = getTypeGenericArguments(tsArrayType)[0];
      if (!isTypeSupported(thisArrayElementType, this.checker)) {
        cppArrayType = `Array<${resolveArrayElementType(thisArrayElementType)}>`;
      }

      if (checkIfArray(tsReturnType)) {
        const returnArrayElementType = getTypeGenericArguments(tsReturnType)[0];

        if (!isTypeSupported(returnArrayElementType, this.checker)) {
          cppReturnType = `Array<${resolveArrayElementType(returnArrayElementType)}>`;
        }
      }

      const templateSignature =
        "template " + cppReturnType + " " + cppArrayType + "::" + methodName + "(" + argumentTypes.join(", ") + ");"; // @todo: constness handling
      this.generatedContent.push(templateSignature);
    });

    this.sources.forEach((source) => {
      source.forEachChild(visitor);
    });
  }

  private handleArrayMethods(node: ts.CallExpression) {
    if (!ts.isPropertyAccessExpression(node.expression)) {
      error(`Expected PropertyAccessExpression, got '${ts.SyntaxKind[node.expression.kind]}'`);
    }

    const tsArrayType = this.checker.getTypeAtLocation(node.expression.expression);
    const cppArrayType = ExternalSymbolsProvider.jsTypeToCpp(tsArrayType, this.checker);
    const methodName = node.expression.name.getText();

    const resolvedSignature = this.checker.getResolvedSignature(node)!;
    const tsReturnType = this.checker.getReturnTypeOfSignature(resolvedSignature);
    const cppReturnType = ExternalSymbolsProvider.jsTypeToCpp(tsReturnType, this.checker);

    const elementType = getTypeGenericArguments(tsArrayType)[0];

    if (!isTypeSupported(elementType, this.checker) || !isTypeSupported(tsReturnType, this.checker)) {
      this.handleGenericArrayMethods(node);
      return;
    }

    const argumentTypes =
      node.arguments.map((a) => {
        const tsType = this.checker.getTypeAtLocation(a);
        const typeNamespace = getTypeNamespace(tsType);
        const cppType = ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker);
        return this.correctQualifiers(tsType, typeNamespace.length > 0 ? typeNamespace + "::" + cppType : cppType);
      }) || [];

    const maybeExists = this.demangled.filter((s) => s.includes(cppArrayType + "::" + methodName));

    const exists = maybeExists.some((signature) => {
      return (
        ExternalSymbolsProvider.extractParameterTypes(signature) ===
        ExternalSymbolsProvider.unqualifyParameters(argumentTypes)
      );
    });

    if (!exists) {
      const templateSignature =
        "template " + cppReturnType + " " + cppArrayType + "::" + methodName + "(" + argumentTypes.join(", ") + ");"; // @todo: constness handling
      this.generatedContent.push(templateSignature);
    }
  }

  private methodsVisitor(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      return;
    }

    if (ts.isCallExpression(node)) {
      node.arguments.forEach((arg) => ts.forEachChild(arg, this.methodsVisitor.bind(this)));
    }
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      node.expression.arguments.forEach((arg) => ts.forEachChild(arg, this.methodsVisitor.bind(this)));
    }

    if (node.getText().startsWith("console.log")) {
      this.handleConsoleLog(node);
    } else if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      checkIfArray(this.checker.getTypeAtLocation(node.expression.expression))
    ) {
      this.handleArrayMethods(node);
    } else if (
      ts.isExpressionStatement(node) &&
      ts.isCallExpression(node.expression) &&
      ts.isPropertyAccessExpression(node.expression.expression) &&
      checkIfArray(this.checker.getTypeAtLocation(node.expression.expression.expression))
    ) {
      this.handleArrayMethods(node.expression);
    } else {
      ts.forEachChild(node, this.methodsVisitor.bind(this));
    }
  }

  private arrayNodeVisitor(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      return;
    }

    if (ts.isCallExpression(node)) {
      node.arguments.forEach((arg) => ts.forEachChild(arg, this.arrayNodeVisitor.bind(this)));
    }
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      node.expression.arguments.forEach((arg) => ts.forEachChild(arg, this.arrayNodeVisitor.bind(this)));
    }

    if (checkIfArray(this.checker.getTypeAtLocation(node))) {
      this.handleArray(node);
    } else {
      ts.forEachChild(node, this.arrayNodeVisitor.bind(this));
    }
  }

  private withTypesMapFromTypesProviderForNode(node: ts.Node, action: (map: Map<string, ts.Type>) => void) {
    let genericTypesProvider = node.parent;
    while (!ts.isFunctionLike(genericTypesProvider)) {
      genericTypesProvider = genericTypesProvider.parent;
    }

    const typesProviderType = this.checker.getTypeAtLocation(genericTypesProvider);
    let typesProviderSymbol = typesProviderType.getSymbol();
    if (!typesProviderSymbol) {
      error("No symbol found");
    }

    typesProviderSymbol = getAliasedSymbolIfNecessary(typesProviderSymbol, this.checker);

    const typesProviderDeclaration = typesProviderSymbol.declarations[0] as ts.FunctionLikeDeclaration;
    const typesProviderSignature = this.checker.getSignatureFromDeclaration(
      typesProviderDeclaration as ts.SignatureDeclaration
    );
    if (!typesProviderSignature) {
      error("No signature found");
    }

    const visitor = (n: ts.Node) => {
      n.forEachChild(visitor);

      if (ts.isExpressionStatement(n) || ts.isCallExpression(n)) {
        let referenceCall: ts.CallExpression;

        if (ts.isCallExpression(n)) {
          referenceCall = n;
        } else if (ts.isCallExpression(n.expression)) {
          referenceCall = n.expression;
        } else {
          return;
        }

        const type = this.checker.getTypeAtLocation(referenceCall.expression);
        let symbol = type.getSymbol();
        if (!symbol) {
          error("No symbol found");
        }
        symbol = getAliasedSymbolIfNecessary(symbol, this.checker);
        if (symbol !== typesProviderSymbol) {
          return;
        }

        const genericTypesMap = getGenericsToActualMapFromSignature(
          typesProviderSignature,
          referenceCall,
          this.checker
        );

        action(genericTypesMap);
      }
    };

    return visitor;
  }

  private getIncludes(directory: string | undefined): string[] {
    if (!directory) {
      return [];
    }

    const nestedDirents = fs.readdirSync(directory, { withFileTypes: true });
    const includes = nestedDirents.map((value) => {
      return value.isDirectory()
        ? this.getIncludes(path.join(directory, value.name))
        : [path.join(directory, value.name)];
    });
    return flatten(includes).filter((filename) => filename.endsWith(".h"));
  }

  private handleInstantiated(source: string) {
    this.generatedContent = this.generatedContent.filter((s, idx) => this.generatedContent.indexOf(s) === idx);

    for (const stdInclude of this.stdIncludes) {
      this.generatedContent.unshift(`#include <${stdInclude}>`);
    }

    const includes = flatten(this.includeDirs.map((dir: string) => this.getIncludes(dir)));
    for (const include of includes) {
      this.generatedContent.unshift(`#include "${include}"`);
    }

    fs.writeFileSync(source, this.generatedContent.join("\n"));

    this.generatedContent = [];
  }

  instantiateClasses() {
    for (const sourceFile of this.sources) {
      sourceFile.forEachChild(this.arrayNodeVisitor.bind(this));
    }

    return this.handleInstantiated(this.INSTANTIATED_CLASSES_FILE);
  }

  instantiateFunctions() {
    for (const sourceFile of this.sources) {
      sourceFile.forEachChild(this.methodsVisitor.bind(this));
    }

    return this.handleInstantiated(this.INSTANTIATED_FUNCTIONS_FILE);
  }
}

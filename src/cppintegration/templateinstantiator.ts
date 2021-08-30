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
import { flatten } from "lodash";
import { NmSymbolExtractor, ExternalSymbolsProvider } from "../mangling";
import { LLVMGenerator } from "../generator";
import { TSType } from "../ts/type";

export class TemplateInstantiator {
  private readonly sources: ts.SourceFile[];
  private readonly generator: LLVMGenerator;
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
    this.generator = new LLVMGenerator(program);
    this.includeDirs = includeDirs;

    const extractor: NmSymbolExtractor = new NmSymbolExtractor();
    const symbols = extractor.readSymbols(demangledTables, mangledTables);

    this.demangled = symbols.demangledSymbols;

    this.INSTANTIATED_FUNCTIONS_FILE = path.join(templateInstancesPath, "instantiated_functions.cpp");
    this.INSTANTIATED_CLASSES_FILE = path.join(templateInstancesPath, "instantiated_classes.cpp");
  }

  private correctQualifiers(tsType: TSType, cppType: string) {
    if (tsType.isArray() || tsType.isString() || tsType.isObject()) {
      cppType += "*";
    }

    return cppType;
  }

  private handleGenericConsoleLog(call: ts.CallExpression) {
    const visitor = this.withTypesMapFromTypesProviderForNode(call, (typeMap: Map<string, TSType>) => {
      const argumentTypes = call.arguments.map((arg) => {
        let tsType = this.generator.ts.checker.getTypeAtLocation(arg);

        if (tsType.isTypeParameter()) {
          const typename = tsType.toString();
          tsType = typeMap.get(typename)!;

          if (tsType.isObject()) {
            throw new Error("console.log with object is not supported for generic types");
          }
        }

        const typeNamespace = tsType.getNamespace();
        const cppTypename = tsType.toCppType();
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
      throw new Error(
        `Expected 'console.log' call to be of 'ts.ExpressionStatement' or 'ts.CallExpression' kind, got ${
          ts.SyntaxKind[node.kind]
        }`
      );
    }

    const hasGenericArguments = call.arguments.some((arg) =>
      this.generator.ts.checker.getTypeAtLocation(arg).isTypeParameter()
    );
    if (hasGenericArguments) {
      this.handleGenericConsoleLog(call);
    } else {
      const argumentTypes = call.arguments.map((arg) => {
        const tsType = this.generator.ts.checker.getTypeAtLocation(arg);

        const typeNamespace = tsType.getNamespace();
        const cppTypename = tsType.toCppType();
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
      throw new Error(`Expected initializer: error at ${node.getText()}`);
    }

    if (ts.isArrayLiteralExpression(node.initializer)) {
      let templateInstance;
      if (node.initializer.elements.length > 0) {
        // const arr = [1, 2, 3];
        // Use elements to figure out array type.
        const tsType = this.generator.ts.checker.getTypeAtLocation(node.initializer.elements[0]);
        const tsTypename = tsType.toCppType();

        // Arrays with values of different types not supported. Make a check.
        // @todo: Move this check to special correctness-check pass.
        if (
          node.initializer.elements.some((element) => {
            const elementType = this.generator.ts.checker.getTypeAtLocation(element);
            const elementTypename = elementType.toCppType();
            return elementTypename !== tsTypename;
          })
        ) {
          throw new Error(`All array's elements have to be of same type: error at '${node.getText()}'`);
        }

        const typeNamespace = tsType.getNamespace();
        let cppType = tsType.toCppType();
        cppType = this.correctQualifiers(tsType, typeNamespace.length > 0 ? typeNamespace + "::" + cppType : cppType);

        templateInstance = `template class ${this.generator.ts.checker
          .getTypeAtLocation(node.initializer)
          .toCppType()};`;
      } else {
        // const arr: number[] = [];
        // Use declared type as array type.
        const tsType = this.generator.ts.checker.getTypeAtLocation(node);
        templateInstance = `template class ${tsType.toCppType()};`;
      }

      this.generatedContent.push(templateInstance);
    } else if (ts.isCallExpression(node.initializer)) {
      const tsType = this.generator.ts.checker.getTypeAtLocation(node);
      if (!tsType.isArray()) {
        throw new Error(`Array type expected, got '${tsType.toString()}'`); // unreachable
      }
      const templateInstance = `template class ${tsType.toCppType()};`;
      this.generatedContent.push(templateInstance);
    }
  }

  private handleArray(node: ts.Node) {
    if (ts.isVariableDeclaration(node)) {
      this.handleArrayFromVariableDeclaration(node);
    } else {
      if (ts.isCallExpression(node.parent) && ts.isArrayLiteralExpression(node) && node.elements.length === 0) {
        const typeFromParameterDeclaration = this.generator.ts.array.getArgumentArrayType(node);
        const templateInstance = `template class ${typeFromParameterDeclaration.toCppType()};`;
        this.generatedContent.push(templateInstance);
      } else {
        let tsType;

        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
          tsType = this.generator.ts.checker.getTypeAtLocation(node.left);
        } else {
          tsType = this.generator.ts.checker.getTypeAtLocation(node);
          let elementType = tsType.getTypeGenericArguments()[0];

          if (elementType.isTypeParameter() && !elementType.isSupported()) {
            const visitor = this.withTypesMapFromTypesProviderForNode(node, (typesMap: Map<string, TSType>) => {
              elementType = typesMap.get(elementType.toString())!;

              const typeNamespace = elementType.getNamespace();
              const elementTypename = elementType.toCppType();

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
        }

        const templateInstance = `template class ${tsType.toCppType()};`;
        this.generatedContent.push(templateInstance);
      }
    }
  }

  private handleGenericArrayMethods(call: ts.CallExpression) {
    if (!ts.isPropertyAccessExpression(call.expression)) {
      throw new Error(`Expected PropertyAccessExpression, got '${ts.SyntaxKind[call.expression.kind]}'`);
    }

    const tsArrayType = this.generator.ts.checker.getTypeAtLocation(call.expression.expression);
    let cppArrayType = tsArrayType.toCppType();
    const methodName = call.expression.name.getText();

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(call);
    const tsReturnType = resolvedSignature.getReturnType();
    let cppReturnType = this.correctQualifiers(tsReturnType, tsReturnType.toCppType());

    const visitor = this.withTypesMapFromTypesProviderForNode(call, (typesMap: Map<string, TSType>) => {
      const argumentTypes = call.arguments.map((arg) => {
        let tsType = this.generator.ts.checker.getTypeAtLocation(arg);

        if (tsType.isTypeParameter()) {
          tsType = typesMap.get(tsType.toString())!;
        }

        const typeNamespace = tsType.getNamespace();
        const cppTypename = tsType.toCppType();
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

      const resolveArrayElementType = (arrayType: TSType) => {
        const arrayTypename = arrayType.toString();
        arrayType = typesMap.get(arrayTypename)!;

        const typeNamespace = arrayType.getNamespace();

        let cppType = arrayType.toCppType();
        cppType = this.correctQualifiers(
          arrayType,
          typeNamespace.length > 0 ? typeNamespace + "::" + cppType : cppType
        );

        return cppType;
      };

      const thisArrayElementType = tsArrayType.getTypeGenericArguments()[0];
      if (!thisArrayElementType.isSupported()) {
        cppArrayType = `Array<${resolveArrayElementType(thisArrayElementType)}>`;
      }

      if (tsReturnType.isArray()) {
        const returnArrayElementType = tsReturnType.getTypeGenericArguments()[0];

        if (!returnArrayElementType.isSupported()) {
          cppReturnType = `Array<${resolveArrayElementType(returnArrayElementType)}>*`;
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
      throw new Error(`Expected PropertyAccessExpression, got '${ts.SyntaxKind[node.expression.kind]}'`);
    }

    const tsArrayType = this.generator.ts.checker.getTypeAtLocation(node.expression.expression);
    const cppArrayType = tsArrayType.toCppType();
    const methodName = node.expression.name.getText();

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(node);
    const tsReturnType = resolvedSignature.getReturnType();
    const cppReturnType = this.correctQualifiers(tsReturnType, tsReturnType.toCppType());

    const elementType = tsArrayType.getTypeGenericArguments()[0];

    if (!elementType.isSupported() || !tsReturnType.isSupported()) {
      this.handleGenericArrayMethods(node);
      return;
    }

    const argumentTypes =
      node.arguments.map((a) => {
        const tsType = this.generator.ts.checker.getTypeAtLocation(a);
        const typeNamespace = tsType.getNamespace();
        const cppType = tsType.toCppType();

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
      this.generator.ts.checker.getTypeAtLocation(node.expression.expression).isArray()
    ) {
      this.handleArrayMethods(node);
    } else if (
      ts.isExpressionStatement(node) &&
      ts.isCallExpression(node.expression) &&
      ts.isPropertyAccessExpression(node.expression.expression) &&
      this.generator.ts.checker.getTypeAtLocation(node.expression.expression.expression).isArray()
    ) {
      this.handleArrayMethods(node.expression);
    } else {
      ts.forEachChild(node, this.methodsVisitor.bind(this));
    }
  }

  private arrayNodeVisitor(node: ts.Node) {
    if (ts.isImportDeclaration(node) || node.kind === ts.SyntaxKind.EndOfFileToken) {
      return;
    }

    if (ts.isCallExpression(node)) {
      node.arguments.forEach((arg) => ts.forEachChild(arg, this.arrayNodeVisitor.bind(this)));
    } else if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      node.expression.arguments.forEach((arg) => ts.forEachChild(arg, this.arrayNodeVisitor.bind(this)));
    } else {
      if (this.generator.ts.checker.getTypeAtLocation(node).isArray()) {
        this.handleArray(node);
      } else {
        ts.forEachChild(node, this.arrayNodeVisitor.bind(this));
      }
    }
  }

  private withTypesMapFromTypesProviderForNode(node: ts.Node, action: (map: Map<string, TSType>) => void) {
    let genericTypesProvider = node.parent;
    while (!ts.isFunctionLike(genericTypesProvider)) {
      genericTypesProvider = genericTypesProvider.parent;
    }

    const typesProviderType = this.generator.ts.checker.getTypeAtLocation(genericTypesProvider);
    const typesProviderSymbol = typesProviderType.getSymbol();
    const typesProviderDeclaration = typesProviderSymbol.declarations[0];
    const typesProviderSignature = this.generator.ts.checker.getSignatureFromDeclaration(typesProviderDeclaration);

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

        const type = this.generator.ts.checker.getTypeAtLocation(referenceCall.expression);

        if (type.isSymbolless()) {
          return;
        }

        const symbol = type.getSymbol();
        if (!symbol.equals(typesProviderSymbol)) {
          return;
        }

        const genericTypesMap = typesProviderSignature.getGenericsToActualMap(referenceCall);
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

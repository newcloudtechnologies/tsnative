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
import { ExternalSymbolsProvider, prepareExternalSymbols } from "@mangling";
import { checkIfArray, checkIfString, error } from "@utils";
import { getArgumentArrayType } from "@handlers/utils";

export class TemplateInstantiator {
  private readonly sources: ts.SourceFile[];
  private readonly checker: ts.TypeChecker;
  private readonly tsconfig: any;
  private readonly stdIncludes: string[] = [
    "std-typescript-llvm/include/array.h",
    "std-typescript-llvm/include/console.h",
    "std-typescript-llvm/include/stdstring.h",
    "std-typescript-llvm/include/tsclosure.h",
  ];
  private generatedContent: string[] = [];

  private readonly mangled: string[] = [];
  private readonly demangled: string[] = [];
  private readonly dependencies: string[] = [];

  static CPP_SOURCE_DIR: string = path.join(process.cwd(), process.pid.toString());
  static CPP_SOURCE: string = path.join(TemplateInstantiator.CPP_SOURCE_DIR, "instantiated_templates.cpp");
  static CPP_CLASSES_SOURCE: string = path.join(TemplateInstantiator.CPP_SOURCE_DIR, "instantiated_classes.cpp");

  constructor(program: ts.Program, tsconfig: any) {
    // filter declarations
    this.sources = program.getSourceFiles().filter((source) => !source.fileName.endsWith("d.ts"));
    this.checker = program.getTypeChecker();
    this.tsconfig = tsconfig;
  }

  static cleanup() {
    if (fs.existsSync(TemplateInstantiator.CPP_SOURCE)) {
      fs.unlinkSync(TemplateInstantiator.CPP_SOURCE);
    }
    if (fs.existsSync(TemplateInstantiator.CPP_CLASSES_SOURCE)) {
      fs.unlinkSync(TemplateInstantiator.CPP_CLASSES_SOURCE);
    }
    if (fs.existsSync(TemplateInstantiator.CPP_SOURCE_DIR)) {
      fs.rmdirSync(TemplateInstantiator.CPP_SOURCE_DIR);
    }
  }

  private correctQualifiers(tsType: ts.Type, cppType: string) {
    if (checkIfArray(tsType)) {
      cppType += " const&";
    } else if (checkIfString(tsType, this.checker)) {
      cppType += "*";
    }

    return cppType;
  }

  private handleConsoleLog(node: ts.Node) {
    let call;
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

    const argumentTypes = call.arguments.map((arg) => {
      const tsType = this.checker.getTypeAtLocation(arg);
      return this.correctQualifiers(tsType, ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker));
    });

    const templateSignature = `template void console::log(${argumentTypes.join(", ")});`;
    this.generatedContent.push(templateSignature);
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

        const cppType = this.correctQualifiers(tsType, ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker));
        templateInstance = `template class Array<${cppType}>;`;
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
        const tsType = this.checker.getTypeAtLocation(node);
        const templateInstance = `template class ${ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker)};`;
        this.generatedContent.push(templateInstance);
      }
    }
  }

  private handleArrayMethods(node: ts.CallExpression) {
    if (!ts.isPropertyAccessExpression(node.expression)) {
      error(`Expected PropertyAccessExpression, got '${ts.SyntaxKind[node.expression.kind]}'`);
    }

    const tsArrayType = this.checker.getTypeAtLocation(node.expression.expression);
    const cppArrayType = ExternalSymbolsProvider.jsTypeToCpp(tsArrayType, this.checker);
    const methodName = node.expression.name.getText();

    const resolvedSignature = this.checker.getResolvedSignature(node);
    const tsReturnType = this.checker.getReturnTypeOfSignature(resolvedSignature!);
    const cppReturnType = ExternalSymbolsProvider.jsTypeToCpp(tsReturnType, this.checker);

    const argumentTypes =
      node.arguments?.map((a) => {
        const tsType = this.checker.getTypeAtLocation(a);
        return this.correctQualifiers(tsType, ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker));
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

  private async handleInstantiated(source: string) {
    if (this.generatedContent.length > 0) {
      this.generatedContent = this.generatedContent.filter((s, idx) => this.generatedContent.indexOf(s) === idx);

      for (const stdInclude of this.stdIncludes) {
        this.generatedContent.unshift(`#include <${stdInclude}>`);
      }

      if (this.tsconfig.cppIncludes) {
        for (const include of this.tsconfig.cppIncludes) {
          this.generatedContent.unshift(`#include "../${include}"`);
        }
      }

      fs.writeFileSync(source, this.generatedContent.join("\n"));

      this.generatedContent = [];

      return prepareExternalSymbols([path.join(process.cwd(), process.pid.toString())]);
    }

    return;
  }

  private async instantiateArrays() {
    for (const sourceFile of this.sources) {
      sourceFile.forEachChild(this.arrayNodeVisitor.bind(this));
    }

    if (this.generatedContent.length > 0) {
      return this.handleInstantiated(TemplateInstantiator.CPP_CLASSES_SOURCE);
    }

    return;
  }

  private async instantiateFunctions() {
    for (const sourceFile of this.sources) {
      sourceFile.forEachChild(this.methodsVisitor.bind(this));
    }

    if (this.generatedContent.length > 0) {
      return this.handleInstantiated(TemplateInstantiator.CPP_SOURCE);
    }

    return;
  }

  async instantiate() {
    fs.mkdirSync(TemplateInstantiator.CPP_SOURCE_DIR);

    const arrays = await this.instantiateArrays();
    if (arrays) {
      this.mangled.push(...arrays.mangledSymbols);
      this.demangled.push(...arrays.demangledSymbols);
      this.dependencies.push(...arrays.dependencies);
    }

    const functions = await this.instantiateFunctions();
    if (functions) {
      this.mangled.push(...functions.mangledSymbols);
      this.demangled.push(...functions.demangledSymbols);
      this.dependencies.push(...functions.dependencies);
    }

    return {
      mangledSymbols: this.mangled,
      demangledSymbols: this.demangled,
      dependencies: this.dependencies,
    };
  }
}

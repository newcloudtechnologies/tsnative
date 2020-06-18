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
import { checkIfArray, checkIfObject, checkIfString, checkIfFunction } from "@utils";

export class TemplateInstantiator {
  private readonly templatesTable = ["console::log", "Array"];
  private readonly program: ts.Program;
  private readonly checker: ts.TypeChecker;
  private readonly tsconfig: any;
  private readonly stdIncludes: string[] = [
    "std-typescript-llvm/include/array.h",
    "std-typescript-llvm/include/console.h",
    "std-typescript-llvm/include/stdstring.h",
  ];
  private generatedContent: string[] = [];
  private readonly demangledSymbols: string[];
  static CPP_SOURCE_DIR: string = path.join(process.cwd(), process.pid.toString());
  static CPP_SOURCE: string = path.join(TemplateInstantiator.CPP_SOURCE_DIR, "instantiated_templates.cpp");

  constructor(program: ts.Program, demangledSymbols: string[], tsconfig: any) {
    this.program = program;
    this.checker = program.getTypeChecker();
    this.demangledSymbols = demangledSymbols;
    this.tsconfig = tsconfig;
  }

  private nodeVisitor(node: ts.Node): void {
    if (ts.isCallExpression(node) || (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression))) {
      if (!ts.isCallExpression(node)) {
        (node.expression as ts.CallExpression).arguments.forEach(this.nodeVisitor.bind(this));
      }

      const callExpression = ts.isCallExpression(node)
        ? node
        : ((node as ts.ExpressionStatement).expression as ts.CallExpression);
      let tsFunctionName = "";

      if (ts.isPropertyAccessExpression(callExpression.expression)) {
        let prefix = "";
        const symbol = this.checker.getSymbolAtLocation(callExpression.expression.expression);

        if (symbol && symbol.valueDeclaration && ts.isModuleDeclaration(symbol.valueDeclaration)) {
          // access namespace's function
          prefix = symbol.escapedName.toString();
        } else if (
          ts.isArrayLiteralExpression(callExpression.expression.expression) ||
          ts.isIdentifier(callExpression.expression.expression)
        ) {
          prefix = ExternalSymbolsProvider.jsTypeToCpp(
            this.checker.getTypeAtLocation(callExpression.expression.expression),
            this.checker
          );
        }

        tsFunctionName = prefix + "::" + callExpression.expression.name.getText();
      }

      if (this.templatesTable.some((template) => tsFunctionName.includes(template))) {
        const resolvedSignature = this.checker.getResolvedSignature(callExpression)!;
        const returnType = ExternalSymbolsProvider.jsTypeToCpp(
          this.checker.getReturnTypeOfSignature(resolvedSignature),
          this.checker
        );
        const argumentTypes =
          callExpression.arguments?.map((a) => {
            const tsType = this.checker.getTypeAtLocation(a);
            let cppType = ExternalSymbolsProvider.jsTypeToCpp(tsType, this.checker);
            if (
              checkIfArray(tsType) ||
              (checkIfObject(tsType) && !checkIfFunction(tsType)) ||
              checkIfString(tsType, this.checker)
            ) {
              cppType = cppType + " const&";
            }
            return cppType;
          }) || [];
        const cppFunctionName = tsFunctionName.replace(".", "::");

        const maybeExists = this.demangledSymbols.filter((s) => s.includes(cppFunctionName));
        const exists = maybeExists.some(
          (signature) =>
            ExternalSymbolsProvider.extractParameterTypes(signature) ===
            ExternalSymbolsProvider.unqualifyParameters(argumentTypes)
        );
        if (!exists) {
          const templateSignature =
            "template " + returnType + " " + cppFunctionName + "(" + argumentTypes.join(", ") + ");"; // @todo: constness handling
          this.generatedContent.push(templateSignature);
        }
      }
    } else if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((declaration) => {
        if (declaration.initializer) {
          this.nodeVisitor(declaration.initializer);
        }
      });
    } else if (ts.isArrowFunction(node)) {
      if (ts.isBlock(node.body)) {
        node.body.forEachChild(this.nodeVisitor.bind(this));
      } else {
        this.nodeVisitor(node.body);
      }
    } else if (ts.isClassDeclaration(node)) {
      node.forEachChild(this.nodeVisitor.bind(this));
    } else if (
      (ts.isMethodDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isConstructorDeclaration(node)) &&
      node.body &&
      !node.typeParameters
    ) {
      node.body.forEachChild(this.nodeVisitor.bind(this));
    } else {
      node.forEachChild(this.nodeVisitor.bind(this));
    }
  }

  async instantiate() {
    for (const sourceFile of this.program.getSourceFiles()) {
      sourceFile.forEachChild(this.nodeVisitor.bind(this));
    }

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

      fs.mkdirSync(TemplateInstantiator.CPP_SOURCE_DIR);
      fs.writeFileSync(TemplateInstantiator.CPP_SOURCE, this.generatedContent.join("\n"));
      return prepareExternalSymbols([path.join(process.cwd(), process.pid.toString())]);
    }

    return;
  }
}

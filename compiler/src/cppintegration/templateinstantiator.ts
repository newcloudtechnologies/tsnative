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

import * as fs from "fs";
import * as ts from "typescript";
import * as path from "path";
import * as llvm from "llvm-node";
import { flatten } from "lodash";
import { CXXSymbols, ExternalSymbolsProvider } from "../mangling";
import { LLVMGenerator } from "../generator";
import { TSType } from "../ts/type";
import { Declaration } from "../ts/declaration";
import { LLVMType } from "../llvm/type";
import { CXXForwardsDeclarator } from "./cxxforwardsdeclarator";
import { Scope } from "../scope";

export class TemplateInstantiator {
  private readonly sources: ts.SourceFile[];
  private readonly generator: LLVMGenerator;
  private readonly includeDirs: string[] = [];

  private generatedContent: string[] = [];

  private readonly INSTANTIATED_FUNCTIONS_FILE: string;
  private readonly INSTANTIATED_CLASSES_FILE: string;

  constructor(
    program: ts.Program,
    includeDirs: string[],
    templateInstancesPath: string
  ) {
    const sources = program.getSourceFiles();

    this.sources = sources.filter((source) => !source.isDeclarationFile);

    this.generator = new LLVMGenerator(program).init();

    // handle declarations to put all declared symbols into symbol table
    {
      const declarations = sources.filter((source) => source.isDeclarationFile);

      // some nodes, e.g EnumDeclaration requires some IR to be generated before symbol can be put into symbol table
      // this in turn require existing IR function
      // create fake main and point builder to it
      const mainReturnType = LLVMType.getInt32Type(this.generator);
      const { fn: main } = this.generator.llvm.function.create(mainReturnType, [], "__ts_main");

      const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", main.unwrapped as llvm.Function);

      this.generator.builder.setInsertionPoint(entryBlock);

      this.generator.runtime.initGlobalState();

      declarations.forEach((declaration) => {
        const sourceFileScope = new Scope(
          declaration.fileName,
          undefined,
          this.generator,
          false,
          this.generator.symbolTable.globalScope
        );

        this.generator.symbolTable.addScope(sourceFileScope);
        declaration.forEachChild((node) => this.generator.handleNode(node, this.generator.symbolTable.currentScope));
      });
    }

    this.includeDirs = includeDirs;

    this.INSTANTIATED_FUNCTIONS_FILE = path.join(templateInstancesPath, "instantiated_functions.cpp");
    this.INSTANTIATED_CLASSES_FILE = path.join(templateInstancesPath, "instantiated_classes.cpp");
  }

  private instantiateIteratorResult(type: TSType) {
    const instance = `template class IteratorResult<${type.toCppType()}>;`;
    const doubleSpecialization = "template class IteratorResult<Number*>;";

    return [instance, doubleSpecialization];
  }

  private handleArrayFromVariableDeclaration(node: ts.VariableDeclaration) {
    if (!node.initializer) {
      throw new Error(`Expected initializer: error at ${node.getText()}`);
    }

    if (ts.isArrayLiteralExpression(node.initializer)) {
      let templateInstance;
      let iteratorResultInstance;
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

        const arrayType = this.generator.ts.checker.getTypeAtLocation(node.initializer);
        templateInstance = `template class ${arrayType.toPlainCppType()};`;
        iteratorResultInstance = this.instantiateIteratorResult(tsType);
      } else {
        // const arr: number[] = [];
        // Use declared type as array type.
        const tsType = this.generator.ts.checker.getTypeAtLocation(node);
        templateInstance = `template class ${tsType.toPlainCppType()};`;
        iteratorResultInstance = this.instantiateIteratorResult(tsType);
      }

      this.generatedContent.push(templateInstance, ...iteratorResultInstance);
    } else if (ts.isCallExpression(node.initializer)) {
      const tsType = this.generator.ts.checker.getTypeAtLocation(node);
      if (!tsType.isArray()) {
        throw new Error(`Array type expected, got '${tsType.toString()}'`); // unreachable
      }

      const templateInstance = `template class ${tsType.toPlainCppType()};`;
      this.generatedContent.push(templateInstance, ...this.instantiateIteratorResult(tsType));
    } else if (ts.isTypeAssertion(node.initializer) || ts.isAsExpression(node.initializer)) {
      const tsType = this.generator.ts.checker.getTypeFromTypeNode(node.initializer.type);

      const templateInstance = `template class ${tsType.toPlainCppType()};`;
      this.generatedContent.push(templateInstance, ...this.instantiateIteratorResult(tsType));
    }
  }

  private handleArray(node: ts.Node) {
    if (ts.isVariableDeclaration(node)) {
      this.handleArrayFromVariableDeclaration(node);
    } else {
      if (
        (ts.isCallExpression(node.parent) || ts.isNewExpression(node.parent)) &&
        ts.isArrayLiteralExpression(node) &&
        node.elements.length === 0
      ) {
        const typeFromParameterDeclaration = this.generator.ts.array.getArgumentArrayType(node);
        const elementType = typeFromParameterDeclaration.getTypeGenericArguments()[0];
        if (!elementType.isSupported()) {
          return;
        }

        const arrayTemplateInstance = `template class ${typeFromParameterDeclaration.toPlainCppType()};`;
        this.generatedContent.push(
          arrayTemplateInstance,
          ...this.instantiateIteratorResult(typeFromParameterDeclaration)
        );
      } else {
        let tsType;

        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
          tsType = this.generator.ts.checker.getTypeAtLocation(node.left);
          const elementType = tsType.getTypeGenericArguments()[0];
          if (!elementType.isSupported()) {
            return;
          }
        } else {
          tsType = this.generator.ts.checker.getTypeAtLocation(node);
          const elementType = tsType.getTypeGenericArguments()[0];

          if (elementType.isNever()) {
            return;
          }

          if (elementType.isTypeParameter() && !elementType.isSupported()) {
            if (ts.isPropertyDeclaration(node)) {
              return;
            }

            const visitor = this.withTypesMapFromTypesProviderForNode(node, (typesMap: Map<string, TSType>) => {
              const concreteElementType = typesMap.get(elementType.toString())!;

              if (!concreteElementType) {
                throw new Error(
                  `Unable to find generic mapping for '${elementType.toString()}'. Error at: '${node.parent.getText()}'. Types map keys: '${Array.from(
                    typesMap.keys()
                  )}'`
                );
              }

              const elementTypename = concreteElementType.toCppType();

              const templateInstance = `template class Array<${elementTypename}>;`;

              this.generatedContent.push(templateInstance, ...this.instantiateIteratorResult(concreteElementType));
            });

            this.sources.forEach((source) => {
              source.forEachChild(visitor);
            });

            return;
          }
        }

        const elementType = tsType.getTypeGenericArguments()[0]!;
        const templateInstance = `template class ${tsType.toPlainCppType()};`;
        this.generatedContent.push(templateInstance, ...this.instantiateIteratorResult(elementType));
      }
    }
  }

  private handleGenericArrayMethods(call: ts.CallExpression) {
    if (!ts.isPropertyAccessExpression(call.expression)) {
      throw new Error(`Expected PropertyAccessExpression, got '${ts.SyntaxKind[call.expression.kind]}'`);
    }

    const tsArrayType = this.generator.ts.checker.getTypeAtLocation(call.expression.expression);
    let cppArrayType = tsArrayType.toPlainCppType();

    const methodName = call.expression.name.getText();

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(call);
    const tsReturnType = resolvedSignature.getReturnType();
    let cppReturnType = tsReturnType.toCppType();

    const visitor = this.withTypesMapFromTypesProviderForNode(call, (typesMap: Map<string, TSType>) => {
      const argumentTypes = call.arguments.map((arg) => {
        let tsType = this.generator.ts.checker.getTypeAtLocation(arg);

        if (tsType.isTypeParameter()) {
          tsType = typesMap.get(tsType.toString())!;
        }

        return tsType.toCppType();
      });

      const maybeExists = CXXSymbols().getOrCreate(cppArrayType).filter((s) => s.demangled.includes(cppArrayType + "::" + methodName));

      const exists = maybeExists.some((symbol) => {
        return (
          ExternalSymbolsProvider.extractParameterTypes(symbol.demangled) ===
          ExternalSymbolsProvider.unqualifyParameters(argumentTypes)
        );
      });

      if (exists) {
        return;
      }

      const resolveArrayElementType = (arrayType: TSType) => {
        const arrayTypename = arrayType.toString();
        const maybeArrayType = typesMap.get(arrayTypename);

        if (!maybeArrayType) {
          throw new Error(`Unknown array type '${arrayTypename}}'`);
        }

        return maybeArrayType.toCppType();
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
    const cppArrayType = tsArrayType.toPlainCppType();

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(node);
    const tsReturnType = resolvedSignature.getReturnType();
    const cppReturnType = tsReturnType.toCppType();

    const elementType = tsArrayType.getTypeGenericArguments()[0];

    if (!elementType.isSupported() || !tsReturnType.isSupported()) {
      this.handleGenericArrayMethods(node);
      return;
    }

    const methodName = node.expression.name.getText();
    if (methodName === "push") {
      return;
    }
    const methodSymbol = tsArrayType.getProperty(methodName);
    const methodDeclaration = methodSymbol.valueDeclaration;

    if (!methodDeclaration) {
      throw new Error(`Unable to find method '${methodName} for Array'`);
    }

    const declaredParameters = methodDeclaration.parameters;
    const args = node.arguments;

    const argumentTypes: string[] = [];

    args.forEach((arg, index) => {
      const declaration = declaredParameters[index];

      if (declaration?.questionToken) {
        argumentTypes.push(this.generator.ts.union.getDeclaration().type.toCppType());
        return;
      }

      if (ts.isSpreadElement(arg)) {
        argumentTypes.push(tsArrayType.toCppType());
        return;
      }

      const tsType = this.generator.ts.checker.getTypeAtLocation(arg);
      const cppType = tsType.toCppType();

      argumentTypes.push(cppType);
    });

    if (args.length < declaredParameters.length) {
      for (let i = args.length; i < declaredParameters.length; ++i) {
        argumentTypes.push(this.generator.ts.union.getDeclaration().type.toCppType());
      }
    }

    const maybeExists = CXXSymbols().getOrCreate(cppArrayType).filter((s) => s.demangled.includes(cppArrayType + "::" + methodName));
    const exists = maybeExists.some((symbol) => {
      return (
        ExternalSymbolsProvider.extractParameterTypes(symbol.demangled) ===
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

    if (
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
    if (this.shouldSkipNode(node)) {
      return;
    }

    if (ts.isCallExpression(node)) {
      node.arguments.forEach((arg) => ts.forEachChild(arg, this.arrayNodeVisitor.bind(this)));
    } else if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      node.expression.arguments.forEach((arg) => ts.forEachChild(arg, this.arrayNodeVisitor.bind(this)));
    }

    if (this.generator.ts.checker.getTypeAtLocation(node).isArray()) {
      this.handleArray(node);
    } else {
      ts.forEachChild(node, this.arrayNodeVisitor.bind(this));
    }
  }

  private withTypesMapFromTypesProviderForNode(node: ts.Node, action: (map: Map<string, TSType>) => void) {
    let genericTypesProvider = node.parent;

    while (genericTypesProvider && !ts.isFunctionLike(genericTypesProvider)) {
      genericTypesProvider = genericTypesProvider.parent;
    }

    if (!genericTypesProvider || ts.isConstructorDeclaration(genericTypesProvider)) {
      // dummy visitor
      // ignore empty block
      // tslint:disable-next-line
      return (_: ts.Node) => { };
    }

    const typesProviderDeclaration = Declaration.create(genericTypesProvider, this.generator);
    const typesProviderSymbol = typesProviderDeclaration.type.getSymbol();
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

    const forwardDeclarations = new CXXForwardsDeclarator(this.generatedContent).createForwardDeclarations();
    this.generatedContent.unshift(...forwardDeclarations);

    const includes = flatten(this.includeDirs.map((dir: string) => this.getIncludes(dir)));
    for (const include of includes) {
      this.generatedContent.unshift(`#include "${include}"`);
    }

    fs.writeFileSync(source, this.generatedContent.join("\n"));

    this.generatedContent = [];
  }

  mapNodeVisitor(node: ts.Node) {
    if (this.shouldSkipNode(node)) {
      return;
    }

    if (this.generator.ts.checker.getTypeAtLocation(node).isMap()) {
      const tsType = this.generator.ts.checker.getTypeAtLocation(node);
      const templateInstance = `template class ${tsType.toPlainCppType()};`;

      const keyElementType = tsType.getTypeGenericArguments()[0]!;
      const keyIteratorResultInstance = `template class IteratorResult<${keyElementType.toCppType()}>;`;

      const valueElementType = tsType.getTypeGenericArguments()[1]!;
      const valueIteratorResultInstance = `template class IteratorResult<${valueElementType.toCppType()}>;`;

      const entriesIteratorResultInstance = `template class IteratorResult<Tuple*>;`;

      this.generatedContent.push(
        templateInstance,
        keyIteratorResultInstance,
        valueIteratorResultInstance,
        entriesIteratorResultInstance
      );
    } else {
      ts.forEachChild(node, this.mapNodeVisitor.bind(this));
    }
  }

  setNodeVisitor(node: ts.Node) {
    if (this.shouldSkipNode(node)) {
      return;
    }

    if (this.generator.ts.checker.getTypeAtLocation(node).isSet()) {
      const tsType = this.generator.ts.checker.getTypeAtLocation(node);
      const templateInstance = `template class ${tsType.toPlainCppType()};`;

      const elementType = tsType.getTypeGenericArguments()[0]!;
      const iteratorResultInstance = `template class IteratorResult<${elementType.toCppType()}>;`;

      this.generatedContent.push(templateInstance, iteratorResultInstance);
    } else {
      ts.forEachChild(node, this.setNodeVisitor.bind(this));
    }
  }

  private shouldSkipNode(node: ts.Node) {
    return (
      ts.isImportDeclaration(node) ||
      node.kind === ts.SyntaxKind.EndOfFileToken ||
      (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name))
    );
  }

  instantiateClasses() {
    for (const sourceFile of this.sources) {
      sourceFile.forEachChild(this.arrayNodeVisitor.bind(this));
      sourceFile.forEachChild(this.mapNodeVisitor.bind(this));
      sourceFile.forEachChild(this.setNodeVisitor.bind(this));
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

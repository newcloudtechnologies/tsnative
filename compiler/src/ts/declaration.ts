/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { LLVMGenerator } from "../generator";
import { Environment, Scope } from "../scope/scope";
import { TSType } from "../ts/type";
import * as ts from "typescript";
import * as crypto from "crypto";
import { flatten } from "lodash";
import { FunctionMangler } from "../mangling";
import { ConciseBody } from "./concisebody";
import { LLVMStructType, LLVMType } from "../llvm/type";

export class Declaration {
  private readonly declaration: ts.Declaration;
  private readonly generator: LLVMGenerator;

  private constructor(declaration: ts.Declaration, generator: LLVMGenerator) {
    this.declaration = declaration;
    this.generator = generator;
  }

  static create(declaration: ts.Declaration, generator: LLVMGenerator) {
    return new Declaration(declaration, generator);
  }

  get decorators() {
    return this.declaration.decorators;
  }

  get members() {
    if (
      !ts.isClassDeclaration(this.declaration) &&
      !ts.isInterfaceDeclaration(this.declaration) &&
      !ts.isTypeLiteralNode(this.declaration) &&
      !ts.isObjectLiteralExpression(this.declaration)
    ) {
      return [];
    }

    if (ts.isObjectLiteralExpression(this.declaration)) {
      return this.declaration.properties.map((p) => Declaration.create(p, this.generator));
    }

    // mkrv: @todo have no idea why, but without this check there are error like:
    // src/tsbuiltins/builtins.ts:252:61 - error TS7006: Parameter 'p' implicitly has an 'any' type.
    // 252     const argTypes = constructorDeclaration.parameters.map((p) => this.generator.ts.checker.getTypeAtLocation(p));
    if (ts.isClassDeclaration(this.declaration)) {
      return this.declaration.members.map((member) => Declaration.create(member, this.generator));
    }

    return this.declaration.members.map((member) => Declaration.create(member, this.generator));
  }

  get properties() {
    return this.ownProperties.concat(this.inheritedProperties);
  }

  get ownProperties() {
    return this.members.filter((m) => m.isProperty() && !m.isStatic());
  }

  get inheritedProperties() {
    if (!this.isDerived) {
      return [];
    }

    const bases = [this.getBases()[0]];

    const props = flatten(
      bases.map((base) => {
        return base.ownProperties;
      })
    );

    return props.filter(
      (prop, index, array) => array.findIndex((p) => prop.name?.getText() === p.name?.getText()) === index
    );
  }

  get isDerived() {
    return this.getBases().length > 0;
  }

  get cxxBase() {
    return this.getBases().find((baseClass) => baseClass.isAmbient());
  }

  getConstructors() {
    return this.members.filter((m) => m.isConstructor());
  }

  findConstructor(argumentTypes: TSType[]) {
    if (!this.isClass()) {
      throw new Error(`Expected Declaration.findConstructor to be called on class declaration, called on '${ts.SyntaxKind[this.declaration.kind]}: ${this.declaration.getText()}'`);
    }

    const candidates = this.getConstructors();

    return candidates.find((decl) => {
      const lastParameter = decl.parameters[decl.parameters.length - 1];

      if (decl.parameters.length < argumentTypes.length && !lastParameter?.dotDotDotToken) {
        return false;
      }

      return decl.parameters.every((p, index) => {
        if (p.questionToken || p.dotDotDotToken) {
          return true;
        }

        let argumentType = argumentTypes[index];

        if (!argumentType && p.initializer) {
          return true;
        }

        const parameterType = this.generator.ts.checker.getTypeAtLocation(p);

        if (parameterType.isTypeParameter()) {
          return true;
        }

        if (parameterType.isEnum()) {
          const parameterEnumType = parameterType.getEnumElementTSType();

          if (argumentType.isEnum()) {
            argumentType = argumentType.getEnumElementTSType();
          }

          return parameterEnumType.isSame(argumentType);
        }

        return argumentType.isSame(parameterType) || argumentType.isUpcastableTo(parameterType);
      });
    });
  }

  isPrivate() {
    return Boolean(this.declaration.modifiers?.find((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword));
  }

  isOptional() {
    // @ts-ignore
    return Boolean(this.declaration.questionToken) || this.type.isOptionalUnion();
  }

  get kind() {
    return this.declaration.kind;
  }

  get name() {
    return (this.declaration as ts.NamedDeclaration).name;
  }

  get parent() {
    return this.declaration.parent;
  }

  private get parentBlock() {
    let parentNode = this.declaration.parent;

    while (parentNode.parent && !ts.isBlock(parentNode)) {
      parentNode = parentNode.parent;
    }

    return parentNode;
  }

  get unique() {
    const hashSource =
      this.parentBlock.getText() + this.parentBlock.getSourceFile().fileName + this.parentBlock.getStart();
    return crypto.createHash("sha256").update(hashSource).digest("hex");
  }

  get heritageClauses() {
    if (!ts.isClassDeclaration(this.declaration) && !ts.isInterfaceDeclaration(this.declaration)) {
      return;
    }
    return this.declaration.heritageClauses;
  }

  get body() {
    if (
      !ts.isFunctionDeclaration(this.declaration) &&
      !ts.isMethodDeclaration(this.declaration) &&
      !ts.isGetAccessorDeclaration(this.declaration) &&
      !ts.isSetAccessorDeclaration(this.declaration) &&
      !ts.isConstructorDeclaration(this.declaration) &&
      !ts.isFunctionExpression(this.declaration) &&
      !ts.isArrowFunction(this.declaration)
    ) {
      throw new Error(
        `Expected 'body' to be called on function declaration, called on '${ts.SyntaxKind[this.declaration.kind]}'`
      );
    }

    return this.declaration.body;
  }

  get parameters() {
    if (!ts.isFunctionLike(this.declaration)) {
      console.log(this.declaration.getText());
      throw new Error(
        `Expected 'parameters' to be called on function-alike declaration, called on '${ts.SyntaxKind[this.declaration.kind]
        }'`
      );
    }
    return this.declaration.parameters;
  }

  get typeParameters() {
    if (!ts.isFunctionLike(this.declaration) && !ts.isClassLike(this.declaration)) {
      return;
    }

    return this.declaration.typeParameters;
  }

  get initializer() {
    if (
      ts.isPropertyAssignment(this.declaration) ||
      ts.isPropertyDeclaration(this.declaration) ||
      ts.isEnumMember(this.declaration) ||
      ts.isParameter(this.declaration)
    ) {
      return this.declaration.initializer;
    }

    throw new Error(`Declaration.initializer called on unexpected kind '${ts.SyntaxKind[this.declaration.kind]}'`);
  }

  get type() {
    return this.generator.ts.checker.getTypeAtLocation(this.declaration);
  }

  get modifiers() {
    return this.declaration.modifiers;
  }

  get dotDotDotToken() {
    if (!ts.isParameter(this.declaration)) {
      return false;
    }
    return Boolean(this.declaration.dotDotDotToken);
  }

  getLLVMStructType(name?: string) {
    const propTypes: LLVMType[] = new Array(this.size).fill(
      LLVMType.getInt8Type(this.generator).getPointer()
    );

    const structType = LLVMStructType.create(this.generator, name);
    structType.setBody(propTypes);

    return structType.getPointer();
  }

  environmentVariables(expression: ts.Expression, scope: Scope, env?: Environment) {
    const variables: string[] = [];

    const methods = this.getMethods();
    methods.forEach((m) => {
      if (!m.body) {
        return;
      }

      const methodSignature = this.generator.ts.checker.getSignatureFromDeclaration(m);
      variables.push(
        ...ConciseBody.create(m.body, this.generator).getEnvironmentVariables(methodSignature, scope, env)
      );
    });

    this.properties.forEach((prop) => {
      const initializer = prop.initializer;

      if (!initializer) {
        return;
      }

      const initializerText = initializer.getText();

      if (ts.isIdentifier(initializer)) {
        variables.push(initializerText);
        return;
      }

      if (!this.generator.ts.checker.nodeHasSymbolAndDeclaration(initializer)) {
        return;
      }

      const symbol = this.generator.ts.checker.getSymbolAtLocation(initializer);
      const declaration = symbol.valueDeclaration || symbol.declarations[0];

      if (declaration.isEnumMember()) {
        const enumName = initializerText.substring(0, initializerText.lastIndexOf("."));
        variables.push(enumName);

        return;
      }

      if (ts.isFunctionLike(initializer)) {
        if (!declaration.body) {
          throw new Error(
            `No body at property '${prop.name?.getText()}}' initializer: '${initializer.getText()}'. Error at '${expression.getText()}'`
          );
        }

        const signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);
        variables.push(
          ...ConciseBody.create(declaration.body, this.generator).getEnvironmentVariables(
            signature,
            scope,
            env
          )
        );
      }
    });

    return variables;
  }

  isBaseOf(other: Declaration) {
    return other.getBases().some((base) => base.type.isSame(this.type));
  }

  getText() {
    return this.declaration.getText();
  }

  getSourceFile() {
    return this.declaration.getSourceFile();
  }

  isNamespace() {
    return ts.isModuleDeclaration(this.declaration);
  }

  isClass() {
    return ts.isClassDeclaration(this.declaration);
  }

  isInterface() {
    return ts.isInterfaceDeclaration(this.declaration);
  }

  isClassOrInterface() {
    return this.isClass() || this.isInterface();
  }

  isTypeLiteral() {
    return ts.isTypeLiteralNode(this.declaration);
  }

  isEnum() {
    return ts.isEnumDeclaration(this.declaration);
  }

  isEnumMember() {
    return ts.isEnumMember(this.declaration);
  }

  isMethod() {
    return ts.isMethodDeclaration(this.declaration);
  }

  isMethodDeclaredOptional(): boolean {
    if (!this.isMethod()) {
      return false;
    }

    if (this.isOptional()) {
      return true;
    }

    const name = this.name?.getText();
    const bases = Declaration.create(this.parent as ts.ClassDeclaration, this.generator).getBases();
    for (const base of bases) {
      const baseMethod = base.getOwnMethods().find((method) => method.name?.getText() === name);
      if (baseMethod?.isOptional()) {
        return true;
      }
    }

    return false;
  }

  isMethodSignature() {
    return ts.isMethodSignature(this.declaration);
  }

  isConstructor() {
    return ts.isConstructorDeclaration(this.declaration);
  }

  isGetAccessor() {
    return ts.isGetAccessorDeclaration(this.declaration);
  }

  isSetAccessor() {
    return ts.isSetAccessorDeclaration(this.declaration);
  }

  isProperty() {
    return (
      ts.isPropertyDeclaration(this.declaration) ||
      ts.isPropertySignature(this.declaration) ||
      ts.isPropertyAssignment(this.declaration)
    );
  }

  isFunction() {
    return ts.isFunctionDeclaration(this.declaration);
  }

  isFunctionLike() {
    return (
      ts.isFunctionDeclaration(this.declaration) ||
      ts.isMethodDeclaration(this.declaration) ||
      ts.isGetAccessorDeclaration(this.declaration) ||
      ts.isSetAccessorDeclaration(this.declaration) ||
      ts.isConstructorDeclaration(this.declaration) ||
      ts.isFunctionExpression(this.declaration) ||
      ts.isArrowFunction(this.declaration)
    );
  }

  isIndexSignature() {
    return ts.isIndexSignatureDeclaration(this.declaration);
  }

  isVariable() {
    return ts.isVariableDeclaration(this.declaration);
  }

  isParameter() {
    return ts.isParameter(this.declaration);
  }

  isInModule() {
    return Boolean(this.declaration.parent?.parent && ts.isModuleDeclaration(this.declaration.parent.parent));
  }

  isAmbient() {
    return Boolean(this.declaration.getSourceFile()?.fileName.endsWith(".d.ts"));
  }

  getScope(thisType: TSType): Scope {
    const namespace = this.getNamespace(true);
    const typename = thisType.mangle();
    const qualifiedName = namespace.concat(typename).join(".");
    return this.generator.symbolTable.get(qualifiedName) as Scope;
  }

  getNamespace(ignoreModules: boolean = false): string[] {
    let parentNode = this.declaration.parent;
    let moduleBlockSeen = false;
    let stopTraversing = false;
    const namespace: string[] = [];

    while (parentNode && !stopTraversing) {
      // skip declarations. block itself is in the next node
      if (!ts.isModuleDeclaration(parentNode)) {
        if (ts.isModuleBlock(parentNode)) {
          const isModule = (parentNode.parent.flags & ts.NodeFlags.Namespace) === 0;
          if (!isModule || !ignoreModules) {
            namespace.unshift(parentNode.parent.name.text);
            moduleBlockSeen = true;
          }
        } else if (moduleBlockSeen) {
          stopTraversing = true;
        }
      }

      parentNode = parentNode.parent;
    }

    return namespace;
  }

  getBases(): Declaration[] {
    return flatten(
      flatten(
        (this.heritageClauses || [])
          .filter((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
          .map((clause) => {
            return clause.types.map((expressionWithTypeArgs) => {
              const baseType = this.generator.ts.checker.getTypeAtLocation(expressionWithTypeArgs);
              const baseSymbol = baseType.getSymbol();
              const baseDeclaration = baseSymbol.declarations[0];
              if (!baseDeclaration) {
                throw new Error(`Unable to find declaration for type '${baseType.toString()}'`);
              }

              const bases = baseDeclaration.getBases();
              bases.unshift(baseDeclaration);
              return bases;
            });
          })
      )
    );
  }

  getOwnMethods(): Declaration[] {
    return this.members.filter((m) => {
      return (m.isMethod() || m.isGetAccessor() || m.isSetAccessor()) && !m.isStatic() && m.name;
    });
  }

  getDerivedMethods() {
    if (!this.isDerived) {
      return [];
    }

    const bases = [this.getBases()[0]];

    return flatten(
      flatten(
        bases.map((base, _, array) => {
          return base.members.filter((member) => {
            if (!member.isMethod()) {
              return false;
            }

            if (!member.name) {
              // @todo: Error?
              return false;
            }

            const isUniq = array.findIndex((m) => m.name!.getText() === member.name!.getText()) === -1;
            return isUniq;
          });
        })
      )
    );
  }

  getMethods() {
    const bases = this.getBases();
    bases.unshift(this);

    return flatten(
      flatten(
        bases.map((base, _, array) => {
          return base.members.filter((member) => {
            if (!member.isMethod()) {
              return false;
            }

            if (!member.name) {
              // @todo: Error?
              return false;
            }

            const isUniq = array.findIndex((m) => m.name!.getText() === member.name!.getText()) === -1;
            return isUniq;
          });
        })
      )
    );
  }

  getOverriddenMethods() {
    return this.getMethods().filter((method) => method.isOverride());
  }

  getVirtualMethods() {
    const bases = this.getBases();
    bases.unshift(this);

    if (!bases.some((base) => base.withVTable())) {
      return [];
    }

    return flatten(
      flatten(
        bases.map((base, _, array) => {
          if (!base.withVTable()) {
            return [];
          }

          return base.members
            .filter((member) => {
              if (!member.isMethod()) {
                return false;
              }

              if (!member.isVirtual()) {
                return false;
              }

              if (!member.name) {
                // @todo: Error?
                return false;
              }

              const isUniq = array.findIndex((m) => m.name!.getText() === member.name!.getText()) === -1;
              return isUniq;
            })
            .map((method) => {
              return { classDeclaration: base, method };
            });
        })
      )
    );
  }

  withVTable() {
    return Boolean(this.vtableSize);
  }

  get mapping() {
    const mapsToDecorator = "MapsTo";
    const mappingDecorator = this.declaration.decorators?.find((decorator) =>
      decorator.expression.getText().startsWith(mapsToDecorator)
    );

    if (mappingDecorator) {
      const pattern = new RegExp(`(?<=${mapsToDecorator}\\(\\").*(?=\\")`);
      const decoratorText = mappingDecorator.expression.getText();
      const cppMethodName = decoratorText.match(pattern);

      if (!cppMethodName) {
        throw new Error(`@MapsTo in wrong format: ${mappingDecorator.getText()}, expected @MapsTo(\"<method_name>\")`);
      }

      return cppMethodName[0];
    }

    return;
  }

  get size() {
    const decoratorName = "Size";
    const decoratorValue = this.declaration.decorators?.find((decorator) =>
      decorator.expression.getText().startsWith(decoratorName + "(")
    );

    if (decoratorValue) {
      const pattern = new RegExp(`(?<=${decoratorName}\\().*(?=\\))`);
      const decoratorText = decoratorValue.expression.getText();
      const sizeMatch = decoratorText.match(pattern);

      if (!sizeMatch) {
        throw new Error(`@Size in wrong format: ${decoratorValue.getText()}, expected @Size(<number>)`);
      }

      const value = parseInt(sizeMatch[0], 10);
      if (isNaN(value)) {
        throw new Error(`@Size in wrong format: ${decoratorValue.getText()}, cannot parse numeric value`);
      }

      return value;
    }

    return 0;
  }

  get vtableSize() {
    const vtableSizeDecorator = "VTableSize";
    const vtableSize = this.declaration.decorators?.find((decorator) =>
      decorator.expression.getText().startsWith(vtableSizeDecorator)
    );

    if (vtableSize) {
      const pattern = new RegExp(`(?<=${vtableSizeDecorator}\\().*(?=\\))`);
      const decoratorText = vtableSize.expression.getText();
      const sizeMatch = decoratorText.match(pattern);

      if (!sizeMatch) {
        throw new Error(`@VTableSize in wrong format: ${vtableSize.getText()}, expected @VTableSize(<number>)`);
      }

      const size = parseInt(sizeMatch[0], 10);
      if (isNaN(size)) {
        throw new Error(`@VTableSize in wrong format: ${vtableSize.getText()}, cannot parse numeric value`);
      }

      return size;
    }

    return 0;
  }

  get vtableIndex() {
    const vtableIndexDecorator = "VTableIndex";
    const vtableIndex = this.declaration.decorators?.find((decorator) =>
      decorator.expression.getText().startsWith(vtableIndexDecorator)
    );

    if (!vtableIndex) {
      throw new Error(`No known vtable index for ${this.getText()}`);
    }

    const pattern = new RegExp(`(?<=${vtableIndexDecorator}\\().*(?=\\))`);
    const decoratorText = vtableIndex.expression.getText();
    const indexMatch = decoratorText.match(pattern);

    if (!indexMatch) {
      throw new Error(`@VTableIndex in wrong format: ${vtableIndex.getText()}, expected @VTableIndex(<number>)`);
    }

    const size = parseInt(indexMatch[0], 10);
    if (isNaN(size)) {
      throw new Error(`@VTableIndex in wrong format: ${vtableIndex.getText()}, cannot parse numeric value`);
    }

    return size;
  }

  get withVirtualDestructor() {
    const virtualDestructorDecorator = "VirtualDestructor";
    const declaredWithVirtualDestructor = this.declaration.decorators?.find(
      (decorator) => decorator.expression.getText() === virtualDestructorDecorator
    );

    return Boolean(declaredWithVirtualDestructor);
  }

  isVirtual() {
    const virtualDecorator = "Virtual";
    const declaredAsVirtual = this.declaration.decorators?.find(
      (decorator) => decorator.expression.getText() === virtualDecorator
    );

    return Boolean(declaredAsVirtual);
  }

  isOverride() {
    const overrideDecorator = "Override";
    const declaredAsOverride = this.declaration.decorators?.find((decorator) =>
      decorator.expression.getText().startsWith(overrideDecorator)
    );

    return Boolean(declaredAsOverride);
  }

  isStatic(): boolean {
    return Boolean(this.declaration.modifiers?.find((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword));
  }

  get unwrapped() {
    return this.declaration;
  }
}

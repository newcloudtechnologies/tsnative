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

import { LLVMGenerator } from "../generator";
import { Prototype, Scope } from "../scope/scope";
import { TSType } from "../ts/type";
import * as ts from "typescript";
import * as crypto from "crypto";
import { flatten } from "lodash";
import { FunctionMangler } from "../mangling";

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
    return this.members.filter((m) => m.isProperty());
  }

  isPrivate() {
    return Boolean(
      this.declaration.modifiers?.findIndex((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword) !== -1
    );
  }

  isOptional() {
    // @ts-ignore
    return Boolean(this.declaration.questionToken);
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
        `Expected 'parameters' to be called on function-alike declaration, called on '${
          ts.SyntaxKind[this.declaration.kind]
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

  getText() {
    return this.declaration.getText();
  }

  getSourceFile() {
    return this.declaration.getSourceFile();
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
    return this.declaration.getSourceFile().fileName.endsWith(".d.ts");
  }

  isExternalCallArgument() {
    return (
      ts.isCallExpression(this.declaration.parent) &&
      FunctionMangler.checkIfExternalSymbol(this.declaration.parent, this.generator)
    );
  }

  getScope(thisType: TSType | undefined): Scope {
    if (thisType) {
      const namespace = this.getNamespace();
      const typename = thisType.mangle();
      const qualifiedName = namespace.concat(typename).join(".");
      return this.generator.symbolTable.get(qualifiedName) as Scope;
    }

    return this.generator.symbolTable.currentScope;
  }

  getNamespace(): string[] {
    let parentNode = this.declaration.parent;
    let moduleBlockSeen = false;
    let stopTraversing = false;
    const namespace: string[] = [];

    while (parentNode && !stopTraversing) {
      // skip declarations. block itself is in the next node
      if (!ts.isModuleDeclaration(parentNode)) {
        if (ts.isModuleBlock(parentNode)) {
          namespace.unshift(parentNode.parent.name.text);
          moduleBlockSeen = true;
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
              const baseDeclaration = baseSymbol.valueDeclaration;
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

  getPrototype() {
    const parentType = this.generator.ts.checker.getTypeAtLocation(this.declaration);
    const prototype = new Prototype(parentType);

    const prototypeSources = this.getBases();
    prototypeSources.unshift(this);

    for (const prototypeSource of prototypeSources) {
      for (const memberDecl of prototypeSource.members) {
        if (memberDecl.isMethod()) {
          prototype.methods.push(memberDecl);
        }
      }
    }

    return prototype;
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
    const withVTableDecorator = "VTable";
    const declaredWithVTable = Boolean(
      this.declaration.decorators?.some((decorator) => decorator.expression.getText() === withVTableDecorator)
    );

    const haveVirtualBase = this.getBases().some((classDeclaration) => classDeclaration.withVTable());

    return declaredWithVTable || haveVirtualBase;
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

  isStaticMethod(): boolean {
    return this.declaration.getText().startsWith(ts.ScriptElementKindModifier.staticModifier);
  }

  isStaticProperty(): boolean {
    let result = false;
    if (this.declaration.modifiers) {
      const found = this.declaration.modifiers.find((it: ts.Modifier): boolean => {
        return it.kind === ts.SyntaxKind.StaticKeyword;
      });

      result = Boolean(found);
    }

    return result;
  }

  get unwrapped() {
    return this.declaration;
  }
}

/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { LLVMGenerator } from "../generator";
import { Scope } from "../scope/scope";
import { TSType } from "../ts/type";
import * as ts from "typescript";
import * as crypto from "crypto";

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
    if (!ts.isClassDeclaration(this.declaration) && !ts.isInterfaceDeclaration(this.declaration)) {
      throw new Error(
        `Expected 'members' to be called on class declaration, called on '${ts.SyntaxKind[this.declaration.kind]}'`
      );
    }

    if (ts.isClassDeclaration(this.declaration)) {
      return this.declaration.members.map((member) => Declaration.create(member, this.generator));
    }

    return this.declaration.members.map((member) => Declaration.create(member, this.generator));
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
    if (!ts.isClassDeclaration(this.declaration)) {
      throw new Error(
        `Expected 'heritageClauses' to be called on class declaration, called on '${
          ts.SyntaxKind[this.declaration.kind]
        }'`
      );
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
      throw new Error(
        `Expected 'body' to be called on function-alike declaration, called on '${
          ts.SyntaxKind[this.declaration.kind]
        }'`
      );
    }
    return this.declaration.parameters;
  }

  get typeParameters() {
    if (!ts.isFunctionLike(this.declaration) && !ts.isClassLike(this.declaration)) {
      throw new Error(
        `Expected 'typeParameters' to be called on function or class-alike declaration, called on '${
          ts.SyntaxKind[this.declaration.kind]
        }'`
      );
    }
    return this.declaration.typeParameters;
  }

  get initializer() {
    if (
      ts.isPropertyAssignment(this.declaration) ||
      ts.isPropertyDeclaration(this.declaration) ||
      ts.isEnumMember(this.declaration)
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
    return ts.isPropertyDeclaration(this.declaration);
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

  withVTable() {
    const withVTableDecorator = "VTable";
    return Boolean(
      this.declaration.decorators?.some((decorator) => decorator.expression.getText() === withVTableDecorator)
    );
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

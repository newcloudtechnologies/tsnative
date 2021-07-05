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
import { FunctionMangler } from "../mangling/functionmangler";
import { Scope } from "../scope/scope";
import { TSType } from "../ts/type";
import * as ts from "typescript";
import { Expression } from "../ts/expression";

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
    if (!ts.isPropertyDeclaration(this.declaration)) {
      throw new Error(
        `Expected 'initializer' to be called on property declaration, called on '${
          ts.SyntaxKind[this.declaration.kind]
        }'`
      );
    }
    return this.declaration.initializer;
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

  isValueTypeProperty(): boolean {
    const valueTypeDecorator = "ValueType";
    return Boolean(
      this.declaration.decorators?.some((decorator) => decorator.expression.getText() === valueTypeDecorator)
    );
  }

  withVTable() {
    const withVTableDecorator = "VTable";
    return Boolean(
      this.declaration.decorators?.some((decorator) => decorator.expression.getText() === withVTableDecorator)
    );
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

  // @todo: temporary hack in fact!
  //        there is potential problem with function expression declared in body of another function in case if this function expression is a returned value
  //        its environment cannot be used on call (illformed IR will be generated)
  //        workaround this issue by this hack
  canCreateLazyClosure() {
    if (ts.isPropertyAssignment(this.declaration.parent)) {
      return false;
    }

    if (ts.isReturnStatement(this.declaration.parent)) {
      return false;
    }

    if (ts.isCallExpression(this.declaration.parent)) {
      const callExpression = this.declaration.parent;

      const argumentTypes = Expression.create(callExpression, this.generator).getArgumentTypes();
      const isMethod = Expression.create(callExpression.expression, this.generator).isMethod();
      let thisType;
      if (isMethod) {
        const methodReference = callExpression.expression as ts.PropertyAccessExpression;
        thisType = this.generator.ts.checker.getTypeAtLocation(methodReference.expression);
      }

      const symbol = this.generator.ts.checker.getTypeAtLocation(callExpression.expression).getSymbol();
      const valueDeclaration = symbol.declarations[0];

      const thisTypeForMangling = valueDeclaration.isStaticMethod()
        ? this.generator.ts.checker.getTypeAtLocation(
            (callExpression.expression as ts.PropertyAccessExpression).expression
          )
        : thisType;

      const { isExternalSymbol } = FunctionMangler.mangle(
        valueDeclaration,
        callExpression,
        thisTypeForMangling,
        argumentTypes,
        this.generator
      );

      if (isExternalSymbol) {
        // C++ backend knows nothing about `lazy` closures
        return false;
      }
    }

    return true;
  }

  get unwrapped() {
    return this.declaration;
  }
}

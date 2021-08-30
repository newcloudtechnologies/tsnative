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

import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";
import { LLVMGenerator } from "../../generator";
import { LLVMValue } from "../../llvm/value";
import { Declaration } from "../../ts/declaration";

export class ClassHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isClassDeclaration(node)) {
      this.handleClassDeclaration(Declaration.create(node, this.generator), parentScope, this.generator);
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private getStaticPropertiesFromDeclaration(declaration: Declaration, parentScope: Scope) {
    const staticProperties = new Map<string, LLVMValue>();

    if (declaration.heritageClauses) {
      for (const clause of declaration.heritageClauses) {
        for (const type of clause.types) {
          const symbol = this.generator.ts.checker.getSymbolAtLocation(type.expression);
          const baseClassDeclaration = symbol.declarations[0];

          const baseClassThisType = baseClassDeclaration.type;
          const mangledBaseClassTypename = baseClassThisType.mangle();

          const namespace = baseClassDeclaration.getNamespace();
          const qualifiedName = namespace.concat(mangledBaseClassTypename).join(".");
          const baseClassScope = parentScope.get(qualifiedName) as Scope;

          baseClassScope?.thisData?.staticProperties?.forEach((value, key) => {
            staticProperties.set(key, value);
          });
        }
      }
    }

    for (const memberDecl of declaration.members) {
      if (memberDecl.isProperty() && memberDecl.initializer && memberDecl.isStaticProperty()) {
        const initializerValue = this.generator.handleExpression(memberDecl.initializer);
        staticProperties.set(memberDecl.name!.getText(), initializerValue);
      }
    }

    return staticProperties;
  }

  private handleClassDeclaration(declaration: Declaration, parentScope: Scope, generator: LLVMGenerator): void {
    if (declaration.typeParameters) {
      // Generics will be handled once called to figure out actual generic arguments.
      return;
    }

    const name = declaration.name!.getText();
    const thisType = generator.ts.checker.getTypeAtLocation(declaration.unwrapped);
    if (thisType.isDeclared() && parentScope.get(name)) {
      return;
    }

    const llvmType = thisType.getLLVMType();

    const staticProperties = this.getStaticPropertiesFromDeclaration(declaration, parentScope);

    const mangledTypename = thisType.mangle();
    const scope = new Scope(name, mangledTypename, parentScope, {
      declaration,
      llvmType,
      tsType: thisType,
      staticProperties,
    });

    for (const memberDecl of declaration.members) {
      if (memberDecl.isProperty() && memberDecl.initializer && memberDecl.type.isFunction()) {
        const method = this.generator.handleExpression(memberDecl.initializer);
        scope.set(memberDecl.name!.getText(), method);
      }
    }

    // @todo: this logic is required because of builtins
    if (parentScope.get(mangledTypename)) {
      parentScope.overwrite(mangledTypename, scope);
    } else {
      parentScope.set(mangledTypename, scope);
    }
  }
}

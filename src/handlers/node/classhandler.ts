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
import { Scope, Environment } from "@scope";
import { checkIfStaticProperty, getDeclarationNamespace, error } from "@utils";
import { LLVMGenerator } from "@generator";
import { LLVMValue } from "../../llvm/value";

export class ClassHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isClassDeclaration(node)) {
      this.handleClassDeclaration(node as ts.ClassDeclaration, parentScope, this.generator);
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private getStaticPropertiesFromDeclaration(declaration: ts.ClassDeclaration, parentScope: Scope) {
    const staticProperties = new Map<string, LLVMValue>();

    if (declaration.heritageClauses) {
      for (const clause of declaration.heritageClauses) {
        for (const type of clause.types) {
          const symbol = this.generator.ts.checker.getSymbolAtLocation(type.expression);
          const baseClassDeclaration = symbol.declarations[0] as ts.ClassDeclaration;
          if (!baseClassDeclaration) {
            error("Base class declaration not found");
          }

          const baseClassThisType = this.generator.ts.checker.getTypeAtLocation(baseClassDeclaration);
          const mangledBaseClassTypename = baseClassThisType.mangle();

          const namespace = getDeclarationNamespace(baseClassDeclaration);
          const qualifiedName = namespace.concat(mangledBaseClassTypename).join(".");
          const baseClassScope = parentScope.get(qualifiedName) as Scope;

          baseClassScope?.thisData?.staticProperties?.forEach((value, key) => {
            staticProperties.set(key, value);
          });
        }
      }
    }

    for (const memberDecl of declaration.members) {
      if (ts.isPropertyDeclaration(memberDecl) && memberDecl.initializer && checkIfStaticProperty(memberDecl)) {
        const initializerValue = this.generator.handleExpression(memberDecl.initializer);
        staticProperties.set(memberDecl.name.getText(), initializerValue);
      }
    }

    return staticProperties;
  }

  private handleClassDeclaration(declaration: ts.ClassDeclaration, parentScope: Scope, generator: LLVMGenerator): void {
    if (declaration.typeParameters) {
      // Generics will be handled once called to figure out actual generic arguments.
      return;
    }

    const name = declaration.name!.getText();
    const thisType = generator.ts.checker.getTypeAtLocation(declaration);
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
      if (
        ts.isPropertyDeclaration(memberDecl) &&
        memberDecl.initializer &&
        this.generator.ts.checker.getTypeAtLocation(memberDecl).isFunction()
      ) {
        const method = this.generator.handleExpression(memberDecl.initializer);
        scope.set(memberDecl.name.getText(), method);
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

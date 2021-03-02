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
import {
  getStructType,
  isTypeDeclared,
  checkIfStaticProperty,
  getDeclarationNamespace,
  error,
  getAliasedSymbolIfNecessary,
  checkIfFunction,
} from "@utils";
import { TypeMangler } from "@mangling";
import { LLVMGenerator } from "@generator";

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
    const staticProperties = new Map<string, llvm.Value>();

    if (declaration.heritageClauses) {
      for (const clause of declaration.heritageClauses) {
        for (const type of clause.types) {
          let symbol = this.generator.checker.getSymbolAtLocation(type.expression);
          if (!symbol) {
            error(`No symbol found ${declaration.getText()}`);
          }
          symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);

          const baseClassDeclaration = symbol.declarations[0] as ts.ClassDeclaration;
          if (!baseClassDeclaration) {
            error("Base class declaration not found");
          }

          const baseClassThisType = this.generator.checker.getTypeAtLocation(baseClassDeclaration);
          const mangledBaseClassTypename: string = TypeMangler.mangle(
            baseClassThisType,
            this.generator.checker,
            baseClassDeclaration
          );

          const namespace: string[] = getDeclarationNamespace(baseClassDeclaration);
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
    const thisType = generator.checker.getTypeAtLocation(declaration);
    if (isTypeDeclared(thisType, declaration, generator) && parentScope.get(name)) {
      return;
    }

    const llvmType = getStructType(thisType, declaration, generator).getPointerTo();

    const staticProperties = this.getStaticPropertiesFromDeclaration(declaration, parentScope);

    const mangledTypename = TypeMangler.mangle(thisType, generator.checker, declaration);
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
        checkIfFunction(this.generator.checker.getTypeAtLocation(memberDecl))
      ) {
        const initializerValue = this.generator.handleExpression(memberDecl.initializer);

        scope.set(memberDecl.name.getText(), initializerValue);
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

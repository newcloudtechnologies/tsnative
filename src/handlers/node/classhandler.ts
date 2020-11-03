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
import { getStructType, isTypeDeclared, checkIfStaticProperty, error } from "@utils";
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

  private handleClassDeclaration(declaration: ts.ClassDeclaration, parentScope: Scope, generator: LLVMGenerator): void {
    if (declaration.typeParameters) {
      // Generics will be handled once called to figure out actual generic arguments.
      return;
    }

    const thisType = generator.checker.getTypeAtLocation(declaration);
    if (isTypeDeclared(thisType, declaration, generator)) {
      return;
    }

    const populateStaticProperties = (map: Map<string, llvm.Value>, classDeclatation: ts.ClassDeclaration) => {
      // iterate static properties
      for (const memberDecl of classDeclatation.members) {
        if (ts.isPropertyDeclaration(memberDecl)) {
          const propertyDeclaration = memberDecl as ts.PropertyDeclaration;

          if (propertyDeclaration.initializer && checkIfStaticProperty(propertyDeclaration)) {
            const propertyName = propertyDeclaration.name;
            const initializer = propertyDeclaration.initializer!;

            const initializerValue: llvm.Value = this.generator.handleExpression(initializer);
            if (map.has(propertyName.getText())) map.delete(propertyName.getText());

            map.set(propertyName.getText(), initializerValue);
          }
        }
      }
    };

    const staticProperties = new Map<string, llvm.Value>();

    if (declaration.heritageClauses) {
      for (const clause of declaration.heritageClauses!) {
        for (const type of clause.types) {
          const symbol = this.generator.checker.getSymbolAtLocation(type.expression)!;
          const baseClassDeclaration = symbol.valueDeclaration as ts.ClassDeclaration;

          const baseClassThisType = generator.checker.getTypeAtLocation(baseClassDeclaration);
          const mangledBaseClassTypename: string = TypeMangler.mangle(
            baseClassThisType,
            generator.checker,
            baseClassDeclaration
          );

          const baseClassScope = parentScope.get(mangledBaseClassTypename) as Scope;

          if (!baseClassScope) {
            error(`Scope is not found: ${mangledBaseClassTypename}`);
          }

          if (baseClassScope.thisData && baseClassScope.thisData.staticProperties) {
            baseClassScope.thisData.staticProperties.forEach((value, key) => {
              if (key.includes(".")) {
                staticProperties.set(key, value);

                const parts = key.split(".");
                if (parts[0] === baseClassScope.name) {
                  staticProperties.set(declaration.name!.getText() + "." + parts[1], value);
                }
              } else {
                staticProperties.set(declaration.name!.getText() + "." + key, value);
                staticProperties.set(baseClassScope.name + "." + key, value);
              }
            });
          }
        }
      }
    }

    populateStaticProperties(staticProperties, declaration);

    const mangledTypename: string = TypeMangler.mangle(thisType, generator.checker, declaration);

    const llvmType = getStructType(thisType, declaration, generator).getPointerTo();
    const scope = new Scope(declaration.name!.getText(), mangledTypename, undefined, {
      declaration,
      llvmType,
      tsType: thisType,
      staticProperties,
    });

    parentScope.set(mangledTypename, scope);

    const methods = declaration.members.filter((member) => !ts.isPropertyDeclaration(member));
    for (const method of methods) {
      generator.handleNode(method, scope);
    }
  }
}

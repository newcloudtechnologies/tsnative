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
import { Scope } from "@scope";
import { getStructType, isTypeDeclared } from "@utils";
import { TypeMangler } from "@mangling";
import { LLVMGenerator } from "@generator";

export class ClassHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope): boolean {
    if (ts.isClassDeclaration(node)) {
      this.handleClassDeclaration(node as ts.ClassDeclaration, parentScope, this.generator);
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope);
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

    const mangledTypename: string = TypeMangler.mangle(thisType, generator.checker, declaration);
    const type = getStructType(thisType as ts.ObjectType, declaration, generator).getPointerTo();
    const scope = new Scope(mangledTypename, undefined, { declaration, type });
    parentScope.set(mangledTypename, scope);
    const methods = declaration.members.filter((member) => !ts.isPropertyDeclaration(member));
    for (const method of methods) {
      generator.handleNode(method, scope);
    }
  }
}

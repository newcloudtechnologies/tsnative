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

export class ModuleHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope): boolean {
    if (ts.isModuleDeclaration(node)) {
      const declaration = node as ts.ModuleDeclaration;
      const name = declaration.name.text;
      const scope = new Scope(name);
      declaration.body!.forEachChild((childNode) => this.generator.handleNode(childNode, scope));
      parentScope.set(name, scope);
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope);
    }

    return false;
  }
}

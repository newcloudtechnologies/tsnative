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

import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";

export class ModuleHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isModuleDeclaration(node)) {
      const declaration = node as ts.ModuleDeclaration;

      if (!declaration.body) {
        throw new Error(`Expected body for module declaration ${declaration.getText()}`);
      }

      const isNamespace = (node.flags & ts.NodeFlags.Namespace) !== 0;
      if (isNamespace) {
        const name = declaration.name.getText().replace(/\"/g, "");
        const scope = new Scope(name, name, this.generator, true);

        declaration.body.forEachChild((childNode) => this.generator.handleNode(childNode, scope, env));
        parentScope.set(name, scope);
      } else {
        declaration.body.forEachChild((childNode) => this.generator.handleNode(childNode, parentScope, env));
      }

      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }
}

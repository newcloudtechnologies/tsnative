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

import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "@scope";

export class EnumHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isEnumDeclaration(node)) {
      this.generator.symbolTable.withLocalScope((localScope) => {
        const scope = new Scope(node.name.getText(), node.name.getText());

        parentScope.set(scope.name!, scope);

        node.members.forEach((member) => {
          if (!member.initializer) {
            return;
          }

          let value = this.generator.handleExpression(member.initializer, env);
          if (!value.type.isPointerTy()) {
            const allocated = this.generator.gc.allocate(value.type);
            this.generator.xbuilder.createSafeStore(value, allocated);
            value = allocated;
          }
          localScope.set(member.name.getText(), value);
          scope.set(member.name.getText(), value);
        });
      }, this.generator.symbolTable.currentScope);
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }
}

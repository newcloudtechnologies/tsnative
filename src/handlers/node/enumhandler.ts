/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
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
import { LLVMConstantFP } from "../../llvm/value";

export class EnumHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isEnumDeclaration(node)) {
      this.generator.symbolTable.withLocalScope((localScope) => {
        const scope = new Scope(node.name.getText(), node.name.getText());

        parentScope.set(scope.name!, scope);

        node.members.forEach((member, index) => {
          let value = member.initializer
            ? this.generator.handleExpression(member.initializer, env)
            : LLVMConstantFP.get(this.generator, index);
          if (!value.type.isPointer()) {
            value = value.createHeapAllocated();
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

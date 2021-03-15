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
import * as llvm from "llvm-node";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "@scope";
import { createHeapAllocatedFromValue } from "@utils";

export class EnumHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isEnumDeclaration(node)) {
      this.generator.symbolTable.withLocalScope((localScope) => {
        const scope = new Scope(node.name.getText(), node.name.getText());

        parentScope.set(scope.name!, scope);

        node.members.forEach((member, index) => {
          let value = member.initializer
            ? this.generator.handleExpression(member.initializer, env)
            : llvm.ConstantFP.get(this.generator.context, index);
          if (!value.type.isPointerTy()) {
            value = createHeapAllocatedFromValue(value, this.generator);
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

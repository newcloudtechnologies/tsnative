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

export class BlockHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.Block:
        this.generator.symbolTable.withLocalScope((scope) => {
          for (const statement of (node as ts.Block).statements) {
            this.generator.handleNode(statement, scope, env);
          }
        }, this.generator.symbolTable.currentScope);
        return true;
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }
}

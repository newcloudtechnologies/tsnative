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
import { LLVMGenerator } from "../../generator";

export class BlockHandler extends AbstractNodeHandler {
  private readonly prepare?: () => void;

  constructor(gen: LLVMGenerator, prepare? : () => void) {
    super(gen);
    this.prepare = prepare;
  }

  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.Block:
        const block = node as ts.Block;

        this.generator.symbolTable.withLocalScope((scope) => {
          if (this.prepare) {
            this.prepare();
          }

          scope.hoist(block, this.generator);
          this.hoistFunctionDeclarations(block, scope, env);

          this.handleBlock(block, scope, env);
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

  private hoistFunctionDeclarations(block: ts.Block, scope: Scope, env?: Environment) {
    for (const statement of block.statements) {
      if (this.generator.shouldHandleNodeInFunctionHoistingContext(statement)) {
        this.generator.handleNode(statement, scope, env);
      }
    }
  }

  private handleBlock(block: ts.Block, scope: Scope, env?: Environment) {
    for (const statement of block.statements) {
      if (!this.generator.shouldHandleNodeInFunctionHoistingContext(statement)) {
        this.generator.handleNode(statement, scope, env);
      }
    }
  }
}

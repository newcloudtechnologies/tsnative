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

import { BasicBlock } from "llvm-node";
import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";

export class BranchHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isIfStatement(node)) {
      this.generator.emitLocation(node);
      const statement = node as ts.IfStatement;
      const condition = this.generator.handleExpression(statement.expression, env).derefToPtrLevel1().makeBoolean();

      const thenBlock = BasicBlock.create(this.generator.context, "then", this.generator.currentFunction);
      const elseBlock = BasicBlock.create(this.generator.context, "else", this.generator.currentFunction);
      const endBlock = BasicBlock.create(this.generator.context, "endif", this.generator.currentFunction);
      this.generator.builder.createCondBr(condition.derefToPtrLevel1(), thenBlock, elseBlock);
      this.handleBranch(statement.thenStatement, thenBlock, endBlock, parentScope, env);
      this.handleBranch(statement.elseStatement, elseBlock, endBlock, parentScope, env);
      this.generator.builder.setInsertionPoint(endBlock);
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private handleBranch(
    statement: ts.Statement | undefined,
    destination: BasicBlock,
    continuation: BasicBlock,
    parentScope: Scope,
    env?: Environment
  ): void {
    this.generator.builder.setInsertionPoint(destination);

    if (statement) {
      this.generator.handleNode(statement, parentScope, env);
    }

    if (!this.generator.isCurrentBlockTerminated) {
      this.generator.builder.createBr(continuation);
    }
  }
}

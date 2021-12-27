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

import { BasicBlock } from "llvm-node";
import * as ts from "typescript";

import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";
import { last } from "lodash";
import { LoopHelper } from "./loophelper";

export class BreakHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isBreakStatement(node)) {
      this.handleBreakStatement();
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private handleBreakStatement(): void {
    const basicBlocks = this.generator.currentFunction.getBasicBlocks();
    const blocks = basicBlocks.filter((block) => LoopHelper.isLoopBlock(block) || this.isSwitchBlock(block));

    if (!blocks.length) {
      return;
    }

    const exitingBlocks = blocks.filter((block) => block.name.includes(".exiting"));
    const currentExitingBlock = last(exitingBlocks);

    if (!currentExitingBlock) {
      throw new Error(`Unable to find exiting block`);
    }

    this.generator.builder.createBr(currentExitingBlock);
  }

  private isSwitchBlock(block: BasicBlock): boolean {
    return block.name.startsWith("switch.");
  }
}

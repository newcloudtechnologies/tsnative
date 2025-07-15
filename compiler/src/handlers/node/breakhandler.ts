import * as ts from "typescript";

import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";
import { ExitingBlocks } from "../../llvm/exiting_blocks";
import { LoopHelper } from "./loophelper";

export class BreakHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isBreakStatement(node)) {
      this.generator.emitLocation(node);
      this.handleBreakStatement();
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private handleBreakStatement(): void {
    const currentExitingBlock = ExitingBlocks.last();

    if (!currentExitingBlock) {
      throw new Error(`Unable to find exiting block`);
    }

    if (LoopHelper.isForLoopBlock(currentExitingBlock)) {
      LoopHelper.onBodyExitHandlers.last()?.apply(null, [true]);
    }

    this.generator.builder.createBr(currentExitingBlock);
  }
}

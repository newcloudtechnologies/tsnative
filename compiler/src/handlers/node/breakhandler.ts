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
import { ExitingBlocks } from "../../llvm/exiting_blocks";

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

    this.generator.builder.createBr(currentExitingBlock);
  }
}

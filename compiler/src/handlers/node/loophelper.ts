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

export class LoopHelper {
  static isWhileLoopBlock(block: BasicBlock): boolean {
    return block.name.startsWith("while.");
  }

  static isForLoopBlock(block: BasicBlock): boolean {
    return block.name.startsWith("for.");
  }
  
  static isForOfLoopBlock(block: BasicBlock): boolean {
    return block.name.startsWith("for_of.");
  }

  static isForInLoopBlock(block: BasicBlock): boolean {
    return block.name.startsWith("for_in.");
  }

  static isDoWhileLoopBlock(block: BasicBlock): boolean { 
    return block.name.startsWith("do.");
  }
  
  static isLoopBlock(block: BasicBlock): boolean {
    return this.isForLoopBlock(block) 
          || this.isForOfLoopBlock(block)
          || this.isForInLoopBlock(block)
          || this.isWhileLoopBlock(block) 
          || this.isDoWhileLoopBlock(block);
  }
}

/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import * as llvm from "llvm-node";

// Class represents stack of exiting blocks. Helps 'break' instruction handler to determine where to 'break' actually.
export class ExitingBlocks {
    private static blocks: llvm.BasicBlock[] = []

    static push(block: llvm.BasicBlock) {
        ExitingBlocks.blocks.push(block);
    }

    static pop() {
        ExitingBlocks.blocks.pop();
    }

    static last() {
        const blocks = ExitingBlocks.blocks;
        return blocks.length > 0 ? blocks[blocks.length - 1] : undefined;
    }
}

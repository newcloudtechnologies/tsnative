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

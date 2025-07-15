import { BasicBlock } from "llvm-node";

class LoopBodyExitHandlers {
  private onBodyExitActions: ((...args: any[]) => void)[] = []

  add(action: (...args: any[]) => void) {
    this.onBodyExitActions.push(action);
  }

  pop() {
    this.onBodyExitActions.pop();
  }

  last(): ((...args: any[]) => void) | undefined {
    return this.onBodyExitActions[this.onBodyExitActions.length - 1];
  }
}

export class LoopHelper {
  static onBodyExitHandlers = new LoopBodyExitHandlers();

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

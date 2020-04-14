import { LLVMGenerator } from "@generator";
import { Block } from "typescript";

export class BlockEmitter {
  emitBlock(block: Block, generator: LLVMGenerator): void {
    generator.symbolTable.inLocalScope(undefined, scope => {
      for (const statement of block.statements) {
        generator.emitNode(statement, scope);
      }
    });
  }
}

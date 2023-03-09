import { LLVMValue } from "../llvm/value"
import { BasicBlock } from "llvm-node";
import { LLVMGenerator } from "../generator";

export class IfBlockCreator {
    private generator: LLVMGenerator;

    constructor(gen: LLVMGenerator) {
        this.generator = gen;
    }

    create(condition: LLVMValue, thenAction: () => void, elseAction: () => void): void {
        const thenBlock = BasicBlock.create(this.generator.context, "then", this.generator.currentFunction);
        const elseBlock = BasicBlock.create(this.generator.context, "else", this.generator.currentFunction);
        const endBlock = BasicBlock.create(this.generator.context, "endif", this.generator.currentFunction);
        this.generator.builder.createCondBr(condition.derefToPtrLevel1(), thenBlock, elseBlock);
  
        this.generator.builder.setInsertionPoint(thenBlock);
        thenAction();
        
        if (!this.generator.isCurrentBlockTerminated) {
            this.generator.builder.createBr(endBlock);
        }
  
        this.generator.builder.setInsertionPoint(elseBlock);
        elseAction();

        if (!this.generator.isCurrentBlockTerminated) {
            this.generator.builder.createBr(endBlock);
        }
  
        this.generator.builder.setInsertionPoint(endBlock);
    }
}
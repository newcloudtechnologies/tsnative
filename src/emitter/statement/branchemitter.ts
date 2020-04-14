import { LLVMGenerator } from "@generator";
import { Scope } from "@scope";
import { BasicBlock } from "llvm-node";
import { IfStatement, Statement } from "typescript";

export class BranchEmitter {
    emitIfStatement(statement: IfStatement, parentScope: Scope, generator: LLVMGenerator): void {
        const condition = generator.emitExpression(statement.expression);
        const thenBlock = BasicBlock.create(generator.context, "then", generator.currentFunction);
        const elseBlock = BasicBlock.create(generator.context, "else", generator.currentFunction);
        const endBlock = BasicBlock.create(generator.context, "endif", generator.currentFunction);
        generator.builder.createCondBr(condition, thenBlock, elseBlock);
        this.emitIfBranch(statement.thenStatement, thenBlock, endBlock, parentScope, generator);
        this.emitIfBranch(statement.elseStatement, elseBlock, endBlock, parentScope, generator);
        generator.builder.setInsertionPoint(endBlock);
    }

    private emitIfBranch(
        block: Statement | undefined,
        destination: BasicBlock,
        continuation: BasicBlock,
        parentScope: Scope,
        generator: LLVMGenerator
    ): void {
        generator.builder.setInsertionPoint(destination);

        if (block) {
            generator.emitNode(block, parentScope);
        }

        if (!generator.builder.getInsertBlock()?.getTerminator()) {
            generator.builder.createBr(continuation);
        }
    }
}
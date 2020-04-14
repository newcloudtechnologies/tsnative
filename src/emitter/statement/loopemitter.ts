/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { LLVMGenerator } from "@generator";
import { BasicBlock } from "llvm-node";
import { last } from "ramda";
import * as ts from "typescript";

export class LoopEmitter {
    emitWhileStatement(statement: ts.WhileStatement, generator: LLVMGenerator): void {
        const condition = BasicBlock.create(generator.context, "while.cond", generator.currentFunction);
        const body = BasicBlock.create(generator.context, "while.body");
        const end = BasicBlock.create(generator.context, "while.end");

        generator.builder.createBr(condition);
        generator.builder.setInsertionPoint(condition);
        const conditionValue = generator.emitExpression(statement.expression);
        generator.builder.createCondBr(conditionValue, body, end);

        generator.currentFunction.addBasicBlock(body);
        generator.builder.setInsertionPoint(body);
        generator.symbolTable.inLocalScope(undefined, scope => {
            generator.emitNode(statement.statement, scope);
        });

        if (!generator.builder.getInsertBlock()?.getTerminator()) {
            generator.builder.createBr(condition);
        }

        generator.currentFunction.addBasicBlock(end);
        generator.builder.setInsertionPoint(end);
    }

    emitForStatement(
        statement: ts.ForStatement,
        generator: LLVMGenerator
    ): void {
        const condition = BasicBlock.create(generator.context, "for.condition");
        const body = BasicBlock.create(generator.context, "for.body");
        const bodyLatch = BasicBlock.create(generator.context, "for.body.latch");
        const incrementor = BasicBlock.create(generator.context, "for.incrementor");
        const exiting = BasicBlock.create(generator.context, "for.exiting");
        const end = BasicBlock.create(generator.context, "for.end");

        generator.symbolTable.inLocalScope(undefined, scope => {
            if (statement.initializer) {
                generator.emitNode(statement.initializer, scope);
            }

            if (statement.condition) {
                generator.builder.createBr(condition);
                generator.currentFunction.addBasicBlock(condition);
                generator.builder.setInsertionPoint(condition);
                const conditionValue = generator.emitExpression(statement.condition);
                generator.builder.createCondBr(conditionValue, body, exiting);
            } else {
                generator.builder.createBr(body);
            }

            generator.currentFunction.addBasicBlock(bodyLatch);
            generator.builder.setInsertionPoint(bodyLatch);
            if (statement.incrementor) {
                generator.builder.createBr(incrementor);
            } else if (statement.condition) {
                generator.builder.createBr(condition);
            } else {
                generator.builder.createBr(body);
            }

            generator.currentFunction.addBasicBlock(exiting);
            generator.builder.setInsertionPoint(exiting);
            generator.builder.createBr(end);

            generator.currentFunction.addBasicBlock(body);
            generator.builder.setInsertionPoint(body);
            generator.emitNode(statement.statement, scope);
            generator.builder.createBr(bodyLatch);

            if (statement.incrementor) {
                generator.currentFunction.addBasicBlock(incrementor);
                generator.builder.setInsertionPoint(incrementor);
                generator.emitExpression(statement.incrementor);
                if (statement.condition) {
                    generator.builder.createBr(condition);
                } else {
                    generator.builder.createBr(body);
                }
            }
        });

        generator.currentFunction.addBasicBlock(end);
        generator.builder.setInsertionPoint(end);
    }

    emitContinueStatement(
        statement: ts.ContinueStatement,
        generator: LLVMGenerator
    ): void {
        const basicBlocks = generator.currentFunction.getBasicBlocks();
        const cycleBlocks = basicBlocks.filter(this.isLoopBlock.bind(this));
        if (!cycleBlocks.length) {
            return;
        }

        const latchBlocks = cycleBlocks.filter(block => block.name.includes(".body.latch"));
        const currentLatchBlock = last(latchBlocks);

        if (ts.isIfStatement(statement.parent) || (ts.isBlock(statement.parent) && ts.isIfStatement(statement.parent.parent))) {
            generator.builder.createBr(currentLatchBlock!);
        } else {
            throw new Error("Senseless `continue` without any condition currently not supported");
        }
    }

    emitBreakStatement(
        statement: ts.BreakStatement,
        generator: LLVMGenerator
    ): void {
        const basicBlocks = generator.currentFunction.getBasicBlocks();
        const cycleBlocks = basicBlocks.filter(this.isLoopBlock.bind(this));
        if (!cycleBlocks.length) {
            return;
        }

        const exitingBlocks = cycleBlocks.filter(block => block.name.includes(".exiting"));
        const currentExitingBlock = last(exitingBlocks);

        if (ts.isIfStatement(statement.parent) || (ts.isBlock(statement.parent) && ts.isIfStatement(statement.parent.parent))) {
            generator.builder.createBr(currentExitingBlock!);
        } else {
            throw new Error("Senseless `break` without any condition currently not supported");
        }
    }

    private isWhileLoopBlock(block: BasicBlock): boolean {
        return block.name.startsWith('while.');
    }

    private isForLoopBlock(block: BasicBlock): boolean {
        return block.name.startsWith('for.');
    }

    private isLoopBlock(block: BasicBlock): boolean {
        return this.isForLoopBlock(block) || this.isWhileLoopBlock(block);
    }

}
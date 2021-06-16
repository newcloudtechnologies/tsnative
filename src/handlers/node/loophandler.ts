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

import { error } from "@utils";
import { BasicBlock } from "llvm-node";
import * as ts from "typescript";

import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "@scope";
import { last } from "lodash";

export class LoopHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.WhileStatement:
        this.handleWhileStatement(node as ts.WhileStatement, env);
        return true;
      case ts.SyntaxKind.ForStatement:
        this.handleForStatement(node as ts.ForStatement, env);
        return true;
      case ts.SyntaxKind.ContinueStatement:
        this.handleContinueStatement(node as ts.ContinueStatement);
        return true;
      case ts.SyntaxKind.BreakStatement:
        this.handleBreakStatement(node as ts.BreakStatement);
        return true;
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private handleWhileStatement(statement: ts.WhileStatement, env?: Environment): void {
    const { builder, context, symbolTable, currentFunction } = this.generator;

    const condition = BasicBlock.create(context, "while.cond", currentFunction);
    const body = BasicBlock.create(context, "while.body");
    const bodyLatch = BasicBlock.create(context, "while.body.latch");
    const exiting = BasicBlock.create(context, "while.exiting");
    const end = BasicBlock.create(context, "while.end");

    builder.createBr(condition);
    builder.setInsertionPoint(condition);
    const conditionValue = this.generator.createLoadIfNecessary(
      this.generator.handleExpression(statement.expression, env)
    );
    builder.createCondBr(conditionValue, body, exiting);

    currentFunction.addBasicBlock(bodyLatch);
    builder.setInsertionPoint(bodyLatch);
    builder.createBr(condition);

    currentFunction.addBasicBlock(exiting);
    builder.setInsertionPoint(exiting);
    builder.createBr(end);

    currentFunction.addBasicBlock(body);
    builder.setInsertionPoint(body);
    symbolTable.withLocalScope((scope) => {
      this.generator.handleNode(statement.statement, scope, env);
    }, this.generator.symbolTable.currentScope);

    if (!this.generator.isCurrentBlockTerminated) {
      builder.createBr(bodyLatch);
    }

    currentFunction.addBasicBlock(end);
    builder.setInsertionPoint(end);
  }

  private handleForStatement(statement: ts.ForStatement, env?: Environment): void {
    const { builder, context, symbolTable, currentFunction } = this.generator;

    const handlerImpl = (): void => {
      const condition = BasicBlock.create(context, "for.condition");
      const body = BasicBlock.create(context, "for.body");
      const bodyLatch = BasicBlock.create(context, "for.body.latch");
      const incrementor = BasicBlock.create(context, "for.incrementor");
      const exiting = BasicBlock.create(context, "for.exiting");
      const end = BasicBlock.create(context, "for.end");

      if (statement.condition) {
        builder.createBr(condition);
        currentFunction.addBasicBlock(condition);
        builder.setInsertionPoint(condition);
        const conditionValue = this.generator.createLoadIfNecessary(
          this.generator.handleExpression(statement.condition, env)
        );
        builder.createCondBr(conditionValue, body, exiting);
      } else {
        builder.createBr(body);
      }

      currentFunction.addBasicBlock(bodyLatch);
      builder.setInsertionPoint(bodyLatch);
      if (statement.incrementor) {
        builder.createBr(incrementor);
      } else if (statement.condition) {
        builder.createBr(condition);
      } else {
        builder.createBr(body);
      }

      currentFunction.addBasicBlock(exiting);
      builder.setInsertionPoint(exiting);
      builder.createBr(end);

      currentFunction.addBasicBlock(body);
      builder.setInsertionPoint(body);
      this.generator.handleNode(statement.statement, symbolTable.currentScope, env);
      builder.createBr(bodyLatch);

      if (statement.incrementor) {
        currentFunction.addBasicBlock(incrementor);
        builder.setInsertionPoint(incrementor);
        this.generator.handleExpression(statement.incrementor, env);
        if (statement.condition) {
          builder.createBr(condition);
        } else {
          builder.createBr(body);
        }
      }

      currentFunction.addBasicBlock(end);
      builder.setInsertionPoint(end);
    };

    if (statement.initializer && ts.isVariableDeclarationList(statement.initializer)) {
      symbolTable.withLocalScope(() => {
        this.generator.handleNode(statement.initializer!, symbolTable.currentScope, env);
        handlerImpl();
      }, this.generator.symbolTable.currentScope);
    } else {
      if (statement.initializer) {
        this.generator.handleExpression(statement.initializer as ts.Expression, env);
      }
      handlerImpl();
    }
  }

  private handleContinueStatement(statement: ts.ContinueStatement): void {
    const basicBlocks = this.generator.currentFunction.getBasicBlocks();
    const cycleBlocks = basicBlocks.filter(this.isLoopBlock.bind(this));
    if (!cycleBlocks.length) {
      return;
    }

    const latchBlocks = cycleBlocks.filter((block) => block.name.includes(".body.latch"));
    const currentLatchBlock = last(latchBlocks);

    if (
      ts.isIfStatement(statement.parent) ||
      (ts.isBlock(statement.parent) && ts.isIfStatement(statement.parent.parent))
    ) {
      this.generator.builder.createBr(currentLatchBlock!);
    } else {
      // To allow conditionless `continue` we have to erase body's latch block, which is quite impossible lacking an API provided for that.
      error("Conditionless `continue` is not supported");
    }
  }

  private handleBreakStatement(statement: ts.BreakStatement): void {
    const basicBlocks = this.generator.currentFunction.getBasicBlocks();
    const cycleBlocks = basicBlocks.filter(this.isLoopBlock.bind(this));
    if (!cycleBlocks.length) {
      return;
    }

    const exitingBlocks = cycleBlocks.filter((block) => block.name.includes(".exiting"));
    const currentExitingBlock = last(exitingBlocks);

    if (
      ts.isIfStatement(statement.parent) ||
      (ts.isBlock(statement.parent) && ts.isIfStatement(statement.parent.parent))
    ) {
      this.generator.builder.createBr(currentExitingBlock!);
    } else {
      // To allow conditionless `break` we have to erase exiting block, which is quite impossible lacking an API provided for that.
      error("Conditionless `break` is not supported");
    }
  }

  private isWhileLoopBlock(block: BasicBlock): boolean {
    return block.name.startsWith("while.");
  }

  private isForLoopBlock(block: BasicBlock): boolean {
    return block.name.startsWith("for.");
  }

  private isLoopBlock(block: BasicBlock): boolean {
    return this.isForLoopBlock(block) || this.isWhileLoopBlock(block);
  }
}

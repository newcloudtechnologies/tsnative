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
import * as ts from "typescript";

import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";
import { last } from "lodash";
import { LLVMConstantFP, LLVMValue } from "../../llvm/value";
import { LoopHelper } from "./loophelper";

export class LoopHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.WhileStatement:
        this.handleWhileStatement(node as ts.WhileStatement, env);
        return true;
      case ts.SyntaxKind.ForStatement:
        this.handleForStatement(node as ts.ForStatement, env);
        return true;
      case ts.SyntaxKind.ForOfStatement:
        this.handleForOfStatement(node as ts.ForOfStatement, env);
        return true;
      case ts.SyntaxKind.ContinueStatement:
        this.handleContinueStatement(node as ts.ContinueStatement);
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
    const conditionValue = this.generator.handleExpression(statement.expression, env);
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
        const conditionValue = this.generator.handleExpression(statement.condition, env);
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

  private handleForOfStatement(statement: ts.ForOfStatement, env?: Environment): void {
    if (statement.awaitModifier) {
      throw new Error(`'await' currently is not supported in for..of, '${statement.getText()}'`);
    }

    const { builder, context, symbolTable, currentFunction } = this.generator;

    if (statement.initializer && ts.isVariableDeclarationList(statement.initializer)) {
      if (statement.initializer.declarations.length > 1) {
        throw new Error(`Expected only variable declaration in for..of at '${statement.getText()}'`);
      }

      const initializer = statement.initializer.declarations[0];

      const isTupleInitializer = () => ts.isArrayBindingPattern(initializer.name);
      const isSingleVariableInitializer = () => ts.isIdentifier(initializer.name);

      if (!isTupleInitializer() && !isSingleVariableInitializer()) {
        throw new Error(`Allowed initializers in for..of are identifiers and tuples (at '${initializer.getText()}')`);
      }

      const updateScope = (updated: LLVMValue) => {
        if (isSingleVariableInitializer()) {
          const name = initializer.name.getText();
          this.generator.symbolTable.currentScope.set(name, updated);
        } else if (isTupleInitializer()) {
          const bindingPattern = initializer.name as ts.ArrayBindingPattern;

          const identifiers: ts.Identifier[] = [];
          bindingPattern.elements.forEach((element) => {
            if (!ts.isBindingElement(element) || element.initializer) {
              throw new Error("Array destructuring is not support omitting nor default initializers.");
            }

            if (!ts.isIdentifier(element.name)) {
              throw new Error(
                `Array destructuring is not support non-identifiers, got '${
                  ts.SyntaxKind[element.kind]
                }' at '${element.getText()}'`
              );
            }

            identifiers.push(element.name);
          });

          const elementTypes = bindingPattern.elements.map((e) => this.generator.ts.checker.getTypeAtLocation(e));

          const subscription = this.generator.ts.tuple.createSubscription();
          updated = this.generator.builder.asVoidStar(updated);

          for (let i = 0; i < identifiers.length; ++i) {
            const llvmIntegralIndex = LLVMConstantFP.get(this.generator, i);
            const llvmNumberIndex = this.generator.builtinNumber.create(llvmIntegralIndex);

            const elementType = elementTypes[i];

            const destructedValueUntyped = this.generator.builder.createSafeCall(subscription, [
              updated,
              llvmNumberIndex,
            ]);
            const destructedValue = this.generator.builder.createBitCast(
              destructedValueUntyped,
              elementType.getLLVMType()
            );

            this.generator.symbolTable.currentScope.set(identifiers[i].getText(), destructedValue);
          }
        } else {
          // Unreachable
          throw new Error(`Unexpected initializer in for..of: '${initializer.getText()}'`);
        }
      };

      const variableType = this.generator.ts.checker.getTypeAtLocation(initializer.name);

      const iterable = this.generator.handleExpression(statement.expression, env);
      const iterableTypeless = this.generator.builder.asVoidStar(iterable);

      const forOfHandlerImpl = () => {
        const condition = BasicBlock.create(context, "for_of.condition");
        const incrementor = BasicBlock.create(context, "for_of.incrementor");
        const body = BasicBlock.create(context, "for_of.body");
        const exiting = BasicBlock.create(context, "for_of.exiting");
        const end = BasicBlock.create(context, "for_of.end");

        const iteratorGetterMethod = this.generator.ts.iterableIterator.createIterator(statement.expression);
        const iterator = this.generator.builder.createSafeCall(iteratorGetterMethod, [iterableTypeless]);
        const iteratorTypeless = this.generator.builder.asVoidStar(iterator);

        const iteratorNextMethod = this.generator.ts.iterator.getNext(statement.expression, variableType);

        builder.createBr(condition);
        currentFunction.addBasicBlock(condition);
        builder.setInsertionPoint(condition);

        const next = this.generator.builder.createSafeCall(iteratorNextMethod, [iteratorTypeless]);
        const nextTypeless = this.generator.builder.asVoidStar(next);

        const doneFn = this.generator.iteratorResult.getDoneGetter(variableType);
        const isDone = this.generator.builder.createSafeCall(doneFn, [nextTypeless]);

        builder.createCondBr(isDone, exiting, incrementor);

        currentFunction.addBasicBlock(incrementor);
        builder.setInsertionPoint(incrementor);

        const valueFn = this.generator.iteratorResult.getValueGetter();
        let value = this.generator.builder.createSafeCall(valueFn, [nextTypeless]);
        value = this.generator.builder.createBitCast(value, variableType.getLLVMType());

        updateScope(value);

        builder.createBr(body);

        currentFunction.addBasicBlock(body);
        builder.setInsertionPoint(body);
        this.generator.handleNode(statement.statement, symbolTable.currentScope, env);
        builder.createBr(condition);

        currentFunction.addBasicBlock(exiting);
        builder.setInsertionPoint(exiting);
        builder.createBr(end);

        currentFunction.addBasicBlock(end);
        builder.setInsertionPoint(end);
      };

      this.generator.symbolTable.withLocalScope(forOfHandlerImpl, this.generator.symbolTable.currentScope);
    } else {
      throw new Error(`Unsupported for..of initializer: '${statement.initializer.getText()}'`);
    }
  }

  private handleContinueStatement(statement: ts.ContinueStatement): void {
    const basicBlocks = this.generator.currentFunction.getBasicBlocks();
    const cycleBlocks = basicBlocks.filter((block) => LoopHelper.isLoopBlock(block));
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
      throw new Error("Conditionless `continue` is not supported");
    }
  }
}

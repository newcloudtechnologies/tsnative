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

import * as ts from "typescript";
import * as llvm from "llvm-node";

import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMValue } from "../../llvm/value";

export class LogicHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      const emitLocation = () => {
        this.generator.emitLocation(expression.left);
        this.generator.emitLocation(expression.right);
      };
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.AmpersandAmpersandToken:
          emitLocation();
          return this.handleLogicalAnd(left, right, env);
        case ts.SyntaxKind.BarBarToken:
          emitLocation();
          return this.handleLogicalOr(left, right, env);
        default:
          break;
      }
    }

    if (ts.isConditionalExpression(expression)) {
      const conditionValue = this.generator.handleExpression(expression.condition, env).derefToPtrLevel1();
      const condition = conditionValue.makeBoolean().derefToPtrLevel1();

      const tsType = this.generator.ts.checker.getTypeAtLocation(expression);

      let result = this.generator.builder.createAlloca(tsType.getLLVMType());

      const trueBlock = llvm.BasicBlock.create(this.generator.context, "trueTernary", this.generator.currentFunction);
      const falseBlock = llvm.BasicBlock.create(this.generator.context, "falseTernary", this.generator.currentFunction);
      const endBlock = llvm.BasicBlock.create(this.generator.context, "endTernary", this.generator.currentFunction);
      this.generator.builder.createCondBr(condition, trueBlock, falseBlock);

      this.generator.builder.setInsertionPoint(trueBlock);
      let thenResult = this.generator.handleExpression(expression.whenTrue, env).derefToPtrLevel1();

      if (tsType.isUnion() && !thenResult.type.isUnion()) {
        thenResult = this.generator.ts.union.create(thenResult);
      } else if (!tsType.isUnion() && thenResult.type.isUnion()) {
        thenResult = this.generator.ts.union.get(thenResult);
        thenResult = this.generator.builder.createBitCast(thenResult, tsType.getLLVMType());
      }

      this.generator.builder.createSafeStore(thenResult, result);
      this.generator.builder.createBr(endBlock);

      this.generator.builder.setInsertionPoint(falseBlock);
      let elseResult = this.generator.handleExpression(expression.whenFalse, env).derefToPtrLevel1();

      if (tsType.isUnion() && !elseResult.type.isUnion()) {
        elseResult = this.generator.ts.union.create(elseResult);
      } else if (!tsType.isUnion() && elseResult.type.isUnion()) {
        elseResult = this.generator.ts.union.get(elseResult);
        elseResult = this.generator.builder.createBitCast(elseResult, tsType.getLLVMType());
      }

      this.generator.builder.createSafeStore(elseResult, result);
      this.generator.builder.createBr(endBlock);

      this.generator.builder.setInsertionPoint(endBlock);


      return result;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }
    return;
  }

  private handleLogicalAnd(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const lhsBlock = llvm.BasicBlock.create(this.generator.context, "logical_and.lhs", this.generator.currentFunction);
    const rhsBlock = llvm.BasicBlock.create(this.generator.context, "logical_and.rhs", this.generator.currentFunction);
    const endBlock = llvm.BasicBlock.create(this.generator.context, "logical_and.end", this.generator.currentFunction);

    const expressionType = this.generator.ts.obj.getLLVMType();
    // Phi instruction requires value and block label as parameter,
    // therefore we have to create explicit logical_and.lhs basic block
    // and jump into it first.
    this.generator.builder.createBr(lhsBlock);
    this.generator.builder.setInsertionPoint(lhsBlock);
    const left = this.generator.handleExpression(lhs, env).derefToPtrLevel1();
    const leftObject = this.generator.builder.createBitCast(left, expressionType);
    const leftBoolean = left.makeBoolean().derefToPtrLevel1();
    this.generator.builder.createCondBr(leftBoolean, rhsBlock, endBlock);

    this.generator.builder.setInsertionPoint(rhsBlock);
    const right = this.generator.handleExpression(rhs, env).derefToPtrLevel1();
    const rightObject = this.generator.builder.createBitCast(right, expressionType);
    this.generator.builder.createBr(endBlock);

    this.generator.builder.setInsertionPoint(endBlock);
    const phi = this.generator.builder.createPhi(expressionType, 2);
    phi.addIncoming(leftObject.unwrapped, lhsBlock);
    phi.addIncoming(rightObject.unwrapped, rhsBlock);
    return LLVMValue.create(phi, this.generator);
  }

  private handleLogicalOr(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const lhsBlock = llvm.BasicBlock.create(this.generator.context, "logical_or.lhs", this.generator.currentFunction);
    const rhsBlock = llvm.BasicBlock.create(this.generator.context, "logical_or.rhs", this.generator.currentFunction);
    const endBlock = llvm.BasicBlock.create(this.generator.context, "logical_or.end", this.generator.currentFunction);

    const expressionType = this.generator.ts.obj.getLLVMType();
    // Phi instruction requires value and block label as parameter,
    // therefore we have to create explicit logical_and.lhs basic block
    // and jump into it first.
    this.generator.builder.createBr(lhsBlock);
    this.generator.builder.setInsertionPoint(lhsBlock);
    const left = this.generator.handleExpression(lhs, env).derefToPtrLevel1();
    const leftObject = this.generator.builder.createBitCast(left, expressionType);
    const leftBoolean = left.makeBoolean().derefToPtrLevel1();
    this.generator.builder.createCondBr(leftBoolean, endBlock, rhsBlock);

    this.generator.builder.setInsertionPoint(rhsBlock);
    const right = this.generator.handleExpression(rhs, env).derefToPtrLevel1();
    const rightObject = this.generator.builder.createBitCast(right, expressionType);
    this.generator.builder.createBr(endBlock);

    this.generator.builder.setInsertionPoint(endBlock);
    const phi = this.generator.builder.createPhi(expressionType, 2);
    phi.addIncoming(leftObject.unwrapped, lhsBlock);
    phi.addIncoming(rightObject.unwrapped, rhsBlock);
    return LLVMValue.create(phi, this.generator);
  }
}

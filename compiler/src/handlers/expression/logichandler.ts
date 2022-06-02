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
      const conditionValue = this.generator.handleExpression(expression.condition, env);
      const condition = conditionValue.makeBoolean();

      const resultType = this.generator.ts.checker.getTypeAtLocation(expression);
      const result = this.generator.gc.allocate(resultType.getLLVMType().unwrapPointer());

      const trueBlock = llvm.BasicBlock.create(this.generator.context, "trueTernary", this.generator.currentFunction);
      const falseBlock = llvm.BasicBlock.create(this.generator.context, "falseTernary", this.generator.currentFunction);
      const endBlock = llvm.BasicBlock.create(this.generator.context, "endTernary", this.generator.currentFunction);
      this.generator.builder.createCondBr(condition, trueBlock, falseBlock);

      this.generator.builder.setInsertionPoint(trueBlock);
      let thenResult = this.generator.handleExpression(expression.whenTrue, env);

      if (result.type.isUnion()) {
        thenResult = this.generator.ts.union.create(thenResult);
      } else if (thenResult.type.isUnion()) {
        thenResult = this.generator.ts.union.get(thenResult);
        thenResult = this.generator.builder.createBitCast(thenResult, result.type);
      }

      this.generator.builder.createSafeStore(thenResult, result);
      this.generator.builder.createBr(endBlock);

      this.generator.builder.setInsertionPoint(falseBlock);
      let elseResult = this.generator.handleExpression(expression.whenFalse, env);

      if (result.type.isUnion()) {
        elseResult = this.generator.ts.union.create(elseResult);
      } else if (elseResult.type.isUnion()) {
        elseResult = this.generator.ts.union.get(elseResult);
        elseResult = this.generator.builder.createBitCast(elseResult, result.type);
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
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    const lhsBoolean = left.makeBoolean();

    if (left.type.equals(right.type)) {
      return this.generator.builder.createSelect(lhsBoolean, right, left);
    }

    throw new Error(`Invalid operand types to logical AND:
        lhs: ${left.type.toString()}
        rhs: ${right.type.toString()}
        Error at: ${lhs.parent.getText()}`);
  }

  private handleLogicalOr(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    const lhsBoolean = left.makeBoolean();

    if (left.type.equals(right.type)) {
      return this.generator.builder.createSelect(lhsBoolean, left, right);
    }

    throw new Error("Invalid operand types to logical OR");
  }
}

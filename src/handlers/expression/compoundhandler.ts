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
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMValue, MathFlags } from "../../llvm/value";

type CompoundHandler = (lhs: LLVMValue, rhs: LLVMValue) => LLVMValue;
export class CompoundAssignmentHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.PlusEqualsToken:
          return this.handleCompoundPlus(left, right, env);
        case ts.SyntaxKind.MinusEqualsToken:
          return this.handleCompoundMinus(left, right, env);
        case ts.SyntaxKind.AsteriskEqualsToken:
          return this.handleCompoundMultiply(left, right, env);
        case ts.SyntaxKind.SlashEqualsToken:
          return this.handleCompoundDivision(left, right, env);
        case ts.SyntaxKind.PercentEqualsToken:
          return this.handleCompoundModulo(left, right, env);

        case ts.SyntaxKind.AmpersandEqualsToken:
          return this.handleCompoundBitwiseAnd(left, right, env);
        case ts.SyntaxKind.BarEqualsToken:
          return this.handleCompoundBitwiseOr(left, right, env);
        case ts.SyntaxKind.CaretEqualsToken:
          return this.handleCompoundBitwiseXor(left, right, env);
        case ts.SyntaxKind.LessThanLessThanEqualsToken:
          return this.handleCompoundLeftShift(left, right, env);
        case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
          return this.handleCompoundRightShift(left, right, env);
        case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
          throw new Error(`Logical shift right is not supported. Error at '${expression.getText()}'`);
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleCompoundPlus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const numericHandler: CompoundHandler = (l: LLVMValue, r: LLVMValue): LLVMValue =>
      l.createAdd(r, MathFlags.Inplace);
    const stringHandler: CompoundHandler = (l: LLVMValue, r: LLVMValue): LLVMValue => {
      const concat = this.generator.builtinString.getLLVMConcat();
      const untypedThis = this.generator.builder.asVoidStar(l);

      return this.generator.builder.createSafeCall(concat, [untypedThis, r]);
    };
    return this.handleCompoundAssignment(lhs, rhs, env, numericHandler, stringHandler);
  }

  private handleCompoundMinus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(
      lhs,
      rhs,
      env,
      (l: LLVMValue, r: LLVMValue): LLVMValue => l.createSub(r, MathFlags.Inplace)
    );
  }

  private handleCompoundMultiply(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(
      lhs,
      rhs,
      env,
      (l: LLVMValue, r: LLVMValue): LLVMValue => l.createMul(r, MathFlags.Inplace)
    );
  }

  private handleCompoundDivision(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(
      lhs,
      rhs,
      env,
      (l: LLVMValue, r: LLVMValue): LLVMValue => l.createDiv(r, MathFlags.Inplace)
    );
  }

  private handleCompoundModulo(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(
      lhs,
      rhs,
      env,
      (l: LLVMValue, r: LLVMValue): LLVMValue => l.createMod(r, MathFlags.Inplace)
    );
  }

  private handleCompoundBitwiseAnd(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(
      lhs,
      rhs,
      env,
      (l: LLVMValue, r: LLVMValue): LLVMValue => l.createBitwiseAnd(r, MathFlags.Inplace)
    );
  }

  private handleCompoundBitwiseOr(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(
      lhs,
      rhs,
      env,
      (l: LLVMValue, r: LLVMValue): LLVMValue => l.createBitwiseOr(r, MathFlags.Inplace)
    );
  }

  private handleCompoundBitwiseXor(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(
      lhs,
      rhs,
      env,
      (l: LLVMValue, r: LLVMValue): LLVMValue => l.createBitwiseXor(r, MathFlags.Inplace)
    );
  }

  private handleCompoundLeftShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(
      lhs,
      rhs,
      env,
      (l: LLVMValue, r: LLVMValue): LLVMValue => l.createBitwiseLeftShift(r, MathFlags.Inplace)
    );
  }

  private handleCompoundRightShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(
      lhs,
      rhs,
      env,
      (l: LLVMValue, r: LLVMValue): LLVMValue => l.createBitwiseRightShift(r, MathFlags.Inplace)
    );
  }

  private handleCompoundAssignment(
    lhs: ts.Expression,
    rhs: ts.Expression,
    env?: Environment,
    ...handlers: CompoundHandler[]
  ): LLVMValue {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    const oldValue = this.generator.createLoadIfNecessary(left);
    const [numericHandler, sHandler] = handlers;

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      if (!numericHandler) {
        throw new Error("No  numeric handler provided");
      }
      return numericHandler(left, right);
    }

    if (oldValue.type.isString() && right.type.isString()) {
      if (!sHandler) {
        throw new Error("String type met, but no handler provided");
      }
      const newValue = sHandler(oldValue, right);
      return left.makeAssignment(newValue);
    }

    throw new Error(
      `Invalid operand types to compound assignment: lhs of type '${oldValue.type.toString()}', rhs of type '${right.type.toString()}' at '${lhs.parent.getText()}'`
    );
  }
}

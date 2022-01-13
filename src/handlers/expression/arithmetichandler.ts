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
import { LLVMValue } from "../../llvm/value";

export class ArithmeticHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.PlusToken:
          return this.handleBinaryPlus(left, right, env);
        case ts.SyntaxKind.MinusToken:
          return this.handleBinaryMinus(left, right, env);
        case ts.SyntaxKind.AsteriskToken:
          return this.handleMultiply(left, right, env);
        case ts.SyntaxKind.SlashToken:
          return this.handleDivision(left, right, env);
        case ts.SyntaxKind.PercentToken:
          return this.handleModulo(left, right, env);
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleBinaryPlus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    if (left.type.isString() && right.type.isString()) {
      const concat = this.generator.builtinString.getLLVMConcat();
      const untypedThis = this.generator.builder.asVoidStar(left);

      return this.generator.builder.createSafeCall(concat, [untypedThis, right]);
    }

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createAdd(right);
    }

    throw new Error(`Invalid operand types to binary plus: '${left.type.toString()}' '${right.type.toString()}'`);
  }

  private handleBinaryMinus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createSub(right);
    }

    throw new Error(`Invalid operand types to binary minus: '${left.type.toString()}' '${right.type.toString()}'`);
  }

  private handleMultiply(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createMul(right);
    }

    throw new Error(`Invalid operand types to binary multiply: '${left.type.toString()}' '${right.type.toString()}'`);
  }

  private handleDivision(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createDiv(right);
    }

    throw new Error(`Invalid operand types to binary division: '${left.type.toString()}' '${right.type.toString()}'`);
  }

  private handleModulo(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.handleExpression(lhs, env);
    const right = this.generator.handleExpression(rhs, env);

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createMod(right);
    }

    throw new Error(`Invalid operand types to binary modulo: '${left.type.toString()}' '${right.type.toString()}'`);
  }
}

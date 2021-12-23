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
import { Conversion, LLVMValue } from "../../llvm/value";
import { LLVMType } from "../../llvm/type";
import { Builder } from "../../builder/builder";

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
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);

    left = left.getValue();
    right = right.adjustToType(left.type);

    if (left.type.isString() && right.type.isString()) {
      const concat = this.generator.builtinString.getLLVMConcat();
      const untypedThis = this.generator.builder.asVoidStar(left);

      return this.generator.builder.createSafeCall(concat, [untypedThis, right]);
    }

    if (left.canPerformNumericOperation() && right.canPerformNumericOperation() && right.type.equals(left.type)) {
      return this.generator.builder.createAdd(left, right).createHeapAllocated();
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left
        .handleBinaryWithConversion(lhs, rhs, right, Conversion.Narrowing, Builder.prototype.createAdd)
        .createHeapAllocated();
    }

    throw new Error(`Invalid operand types to binary plus: '${left.type.toString()}' '${right.type.toString()}'`);
  }

  private handleBinaryMinus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);

    left = left.getValue();
    right = right.adjustToType(left.type);

    if (left.canPerformNumericOperation() && right.canPerformNumericOperation() && right.type.equals(left.type)) {
      return this.generator.builder.createSub(left, right).createHeapAllocated();
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left
        .handleBinaryWithConversion(lhs, rhs, right, Conversion.Narrowing, Builder.prototype.createSub)
        .createHeapAllocated();
    }

    throw new Error(`Invalid operand types to binary minus: '${left.type.toString()}' '${right.type.toString()}'`);
  }

  private handleMultiply(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);

    left = left
      .getValue()
      .promoteIntegralToFP(
        LLVMType.getDoubleType(this.generator),
        this.generator.ts.checker.getTypeAtLocation(lhs).isSigned()
      );
    right = right
      .getValue()
      .promoteIntegralToFP(
        LLVMType.getDoubleType(this.generator),
        this.generator.ts.checker.getTypeAtLocation(rhs).isSigned()
      );

    return this.generator.builder.createMul(left, right).createHeapAllocated();
  }

  private handleDivision(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);

    left = left
      .getValue()
      .promoteIntegralToFP(
        LLVMType.getDoubleType(this.generator),
        this.generator.ts.checker.getTypeAtLocation(lhs).isSigned()
      );
    right = right
      .getValue()
      .promoteIntegralToFP(
        LLVMType.getDoubleType(this.generator),
        this.generator.ts.checker.getTypeAtLocation(rhs).isSigned()
      );

    return this.generator.builder.createDiv(left, right).createHeapAllocated();
  }

  private handleModulo(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);

    left = left
      .getValue()
      .promoteIntegralToFP(
        LLVMType.getDoubleType(this.generator),
        this.generator.ts.checker.getTypeAtLocation(lhs).isSigned()
      );
    right = right
      .getValue()
      .promoteIntegralToFP(
        LLVMType.getDoubleType(this.generator),
        this.generator.ts.checker.getTypeAtLocation(rhs).isSigned()
      );

    return this.generator.builder.createRem(left, right).createHeapAllocated();
  }
}

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

import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { Conversion, LLVMValue } from "../../llvm/value";
import { Builder } from "../../builder/builder";
import { LLVMType } from "../../llvm/type";

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

    if (
      (left.type.isDoubleType() && right.type.isDoubleType()) ||
      (left.type.isIntegerType() && right.type.isIntegerType())
    ) {
      return this.generator.builder.createAdd(left, right).createHeapAllocated();
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left
        .handleBinaryWithConversion(lhs, rhs, right, Conversion.Narrowing, Builder.prototype.createAdd)
        .createHeapAllocated();
    }

    if (left.type.isString() && right.type.isString()) {
      const concat = this.generator.builtinString.getLLVMConcat();
      const untypedThis = this.generator.builder.asVoidStar(left);

      return this.generator.builder.createSafeCall(concat, [untypedThis, right]);
    }

    throw new Error(`Invalid operand types to binary plus: '${left.type.toString()}' '${right.type.toString()}'`);
  }

  private handleBinaryMinus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = left.getValue();
    right = right.adjustToType(left.type);

    if (
      (left.type.isDoubleType() && right.type.isDoubleType()) ||
      (left.type.isIntegerType() && right.type.isIntegerType())
    ) {
      return this.generator.builder.createSub(left, right).createHeapAllocated();
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left
        .handleBinaryWithConversion(lhs, rhs, right, Conversion.Narrowing, Builder.prototype.createSub)
        .createHeapAllocated();
    }

    throw new Error("Invalid operand types to binary minus");
  }

  private handleMultiply(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = left.getValue();
    right = right.adjustToType(left.type);

    if (
      (left.type.isDoubleType() && right.type.isDoubleType()) ||
      (left.type.isIntegerType() && right.type.isIntegerType())
    ) {
      return this.generator.builder.createMul(left, right).createHeapAllocated();
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left
        .handleBinaryWithConversion(lhs, rhs, right, Conversion.Promotion, Builder.prototype.createMul)
        .createHeapAllocated();
    }

    throw new Error("Invalid operand types to multiply");
  }

  private handleDivision(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = left.getValue();
    right = right.adjustToType(left.type);

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return this.generator.builder.createDiv(left, right).createHeapAllocated();
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      const doubleType = LLVMType.getDoubleType(this.generator);

      const lhsTsType = this.generator.ts.checker.getTypeAtLocation(lhs);
      const rhsTsType = this.generator.ts.checker.getTypeAtLocation(rhs);

      left = left.promoteIntegralToFP(doubleType, lhsTsType.isSigned());
      right = right.promoteIntegralToFP(doubleType, rhsTsType.isSigned());
      return this.generator.builder.createDiv(left, right).createHeapAllocated();
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left
        .handleBinaryWithConversion(lhs, rhs, right, Conversion.Promotion, Builder.prototype.createDiv)
        .createHeapAllocated();
    }

    throw new Error("Invalid operand types to division");
  }

  private handleModulo(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = left.getValue();
    right = right.adjustToType(left.type);

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return this.generator.builder.createRem(left, right).createHeapAllocated();
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      const doubleType = LLVMType.getDoubleType(this.generator);

      const lhsTsType = this.generator.ts.checker.getTypeAtLocation(lhs);
      const rhsTsType = this.generator.ts.checker.getTypeAtLocation(rhs);

      left = left.promoteIntegralToFP(doubleType, lhsTsType.isSigned());
      right = right.promoteIntegralToFP(doubleType, rhsTsType.isSigned());

      return this.generator.builder.createRem(left, right).createHeapAllocated();
    }

    if (left.type.isConvertibleTo(right.type)) {
      return left
        .handleBinaryWithConversion(lhs, rhs, right, Conversion.Promotion, Builder.prototype.createRem)
        .createHeapAllocated();
    }

    throw new Error("Invalid operand types to modulo");
  }
}

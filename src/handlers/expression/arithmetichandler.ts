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

import { isSigned } from "@cpp";
import { Conversion, handleBinaryWithConversion, promoteIntegralToFP } from "@handlers";
import { error, createHeapAllocatedFromValue } from "@utils";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { LLVMValue } from "../../llvm/value";
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

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFAdd(left, right), this.generator);
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createAdd(left, right), this.generator);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return createHeapAllocatedFromValue(
        handleBinaryWithConversion(
          lhs,
          rhs,
          left,
          right,
          Conversion.Narrowing,
          Builder.prototype.createAdd,
          this.generator
        ),
        this.generator
      );
    }

    if (left.type.isString() && right.type.isString()) {
      const concat = this.generator.builtinString.getLLVMConcat(lhs);
      const untypedThis = this.generator.builder.asVoidStar(left);

      return this.generator.builder.createSafeCall(concat, [untypedThis, right]);
    }

    error(`Invalid operand types to binary plus: '${left.type.toString()}' '${right.type.toString()}'`);
  }

  private handleBinaryMinus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = left.getValue();
    right = right.adjustToType(left.type);

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFSub(left, right), this.generator);
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createSub(left, right), this.generator);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return createHeapAllocatedFromValue(
        handleBinaryWithConversion(
          lhs,
          rhs,
          left,
          right,
          Conversion.Narrowing,
          Builder.prototype.createSub,
          this.generator
        ),
        this.generator
      );
    }

    error("Invalid operand types to binary minus");
  }

  private handleMultiply(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = left.getValue();
    right = right.adjustToType(left.type);

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFMul(left, right), this.generator);
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createMul(left, right), this.generator);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return createHeapAllocatedFromValue(
        handleBinaryWithConversion(
          lhs,
          rhs,
          left,
          right,
          Conversion.Promotion,
          Builder.prototype.createFMul,
          this.generator
        ),
        this.generator
      );
    }

    error("Invalid operand types to multiply");
  }

  private handleDivision(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = left.getValue();
    right = right.adjustToType(left.type);

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFDiv(left, right), this.generator);
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      const doubleType = LLVMType.getDoubleType(this.generator);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, this.generator), this.generator);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, this.generator), this.generator);
      return createHeapAllocatedFromValue(this.generator.builder.createFDiv(left, right), this.generator);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return createHeapAllocatedFromValue(
        handleBinaryWithConversion(
          lhs,
          rhs,
          left,
          right,
          Conversion.Promotion,
          Builder.prototype.createFDiv,
          this.generator
        ),
        this.generator
      );
    }

    error("Invalid operand types to division");
  }

  private handleModulo(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = left.getValue();
    right = right.adjustToType(left.type);

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFRem(left, right), this.generator);
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      const doubleType = LLVMType.getDoubleType(this.generator);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, this.generator), this.generator);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, this.generator), this.generator);
      return createHeapAllocatedFromValue(this.generator.builder.createFRem(left, right), this.generator);
    }

    if (left.type.isConvertibleTo(right.type)) {
      return createHeapAllocatedFromValue(
        handleBinaryWithConversion(
          lhs,
          rhs,
          left,
          right,
          Conversion.Promotion,
          Builder.prototype.createFRem,
          this.generator
        ),
        this.generator
      );
    }

    error("Invalid operand types to modulo");
  }
}

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
import { Conversion, handleBinaryWithConversion, isConvertible, promoteIntegralToFP } from "@handlers";
import { error, checkIfLLVMString, adjustLLVMValueToType, getLLVMValue } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";

export class ArithmeticHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
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

  private handleBinaryPlus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);

    left = getLLVMValue(left, this.generator);
    right = adjustLLVMValueToType(right, left.type, this.generator);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      const sum = this.generator.builder.createFAdd(left, right);
      const allocated = this.generator.gc.allocate(sum.type);
      this.generator.xbuilder.createSafeStore(sum, allocated);
      return allocated;
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createAdd(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createAdd,
        this.generator
      );
    }

    if (checkIfLLVMString(left.type) && checkIfLLVMString(right.type)) {
      const concat = this.generator.builtinString.getLLVMConcat(lhs);
      const sret = this.generator.gc.allocate(this.generator.builtinString.getLLVMType().elementType);
      this.generator.builder.createCall(concat, [sret, left, right]);
      return sret;
    }

    error(`Invalid operand types to binary plus: '${left.type.toString()}' '${right.type.toString()}'`);
  }

  private handleBinaryMinus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = getLLVMValue(left, this.generator);
    right = adjustLLVMValueToType(right, left.type, this.generator);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFSub(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createSub(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Narrowing,
        llvm.IRBuilder.prototype.createSub,
        this.generator
      );
    }

    error("Invalid operand types to binary minus");
  }

  private handleMultiply(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = getLLVMValue(left, this.generator);
    right = adjustLLVMValueToType(right, left.type, this.generator);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFMul(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createMul(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFMul,
        this.generator
      );
    }

    error("Invalid operand types to multiply");
  }

  private handleDivision(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = getLLVMValue(left, this.generator);
    right = adjustLLVMValueToType(right, left.type, this.generator);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFDiv(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      const doubleType = llvm.Type.getDoubleTy(this.generator.context);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, this.generator), this.generator);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, this.generator), this.generator);
      return this.generator.builder.createFDiv(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFDiv,
        this.generator
      );
    }

    error("Invalid operand types to division");
  }

  private handleModulo(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    let left = this.generator.handleExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);
    left = getLLVMValue(left, this.generator);
    right = adjustLLVMValueToType(right, left.type, this.generator);

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFRem(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      const doubleType = llvm.Type.getDoubleTy(this.generator.context);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, this.generator), this.generator);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, this.generator), this.generator);
      return this.generator.builder.createFRem(left, right);
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFRem,
        this.generator
      );
    }

    error("Invalid operand types to modulo");
  }
}

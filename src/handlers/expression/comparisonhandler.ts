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

import { bothSigned, bothUnsigned, isSigned } from "@cpp";
import {
  castFPToIntegralType,
  Conversion,
  handleBinaryWithConversion,
  isConvertible,
  promoteIntegralToFP,
} from "@handlers";
import {
  error,
  checkIfLLVMString,
  isUnionLLVMType,
  isUnionWithUndefinedLLVMType,
  isUnionWithNullLLVMType,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";

export class ComparisonHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.EqualsEqualsEqualsToken: {
          const lhs: llvm.Value = this.generator.handleExpression(left, env);
          const rhs: llvm.Value = this.generator.handleExpression(right, env);
          return this.handleStrictEquals(left, right, lhs, rhs, env);
        }
        case ts.SyntaxKind.ExclamationEqualsEqualsToken:
          return this.handleStrictNotEquals(left, right, env);

        case ts.SyntaxKind.LessThanToken:
          return this.handleLessThan(left, right, env);
        case ts.SyntaxKind.GreaterThanToken:
          return this.handleGreaterThan(left, right, env);
        case ts.SyntaxKind.LessThanEqualsToken:
          return this.handleLessEqualsThan(left, right, env);
        case ts.SyntaxKind.GreaterThanEqualsToken:
          return this.handleGreaterEqualsThan(left, right, env);
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleStrictEquals(
    lhs: ts.Expression,
    rhs: ts.Expression,
    lhsLLVM: llvm.Value,
    rhsLLVM: llvm.Value,
    env?: Environment
  ): llvm.Value {
    lhsLLVM = this.generator.createLoadIfNecessary(lhsLLVM);
    rhsLLVM = this.generator.createLoadIfNecessary(rhsLLVM);

    if (lhsLLVM.type.isDoubleTy() && rhsLLVM.type.isDoubleTy()) {
      return this.generator.builder.createFCmpOEQ(lhsLLVM, rhsLLVM);
    }

    if (lhsLLVM.type.isIntegerTy() && rhsLLVM.type.isIntegerTy()) {
      return this.generator.builder.createICmpEQ(lhsLLVM, rhsLLVM);
    }

    if (lhsLLVM.type.isIntegerTy() && rhsLLVM.type.isDoubleTy()) {
      const signed = isSigned(lhs, this.generator);
      rhsLLVM = castFPToIntegralType(rhsLLVM, lhsLLVM.type, signed, this.generator);
      return this.generator.builder.createICmpEQ(lhsLLVM, rhsLLVM);
    }

    if (lhsLLVM.type.isDoubleTy() && rhsLLVM.type.isIntegerTy()) {
      const signed = isSigned(rhs, this.generator);
      rhsLLVM = promoteIntegralToFP(rhsLLVM, lhsLLVM.type, signed, this.generator);
      return this.generator.builder.createFCmpOEQ(lhsLLVM, rhsLLVM);
    }

    if (checkIfLLVMString(lhsLLVM.type) && checkIfLLVMString(rhsLLVM.type)) {
      const equals = this.generator.builtinString.getLLVMEquals(lhs);
      return this.generator.builder.createCall(equals, [lhsLLVM, rhsLLVM]);
    }

    if (isUnionLLVMType(lhsLLVM.type)) {
      if (isUnionWithNullLLVMType(lhsLLVM.type) || isUnionWithUndefinedLLVMType(lhsLLVM.type)) {
        const unionStructType = (lhsLLVM.type as llvm.PointerType).elementType as llvm.StructType;
        let activeIndex = -1;
        for (let i = 0; i < unionStructType.numElements; ++i) {
          if (
            unionStructType
              .getElementType(i)
              .equals(rhsLLVM.type.isPointerTy() ? rhsLLVM.type : rhsLLVM.type.getPointerTo())
          ) {
            activeIndex = i;
            break;
          }
        }

        if (activeIndex === -1) {
          error(`Type '${rhsLLVM.type.toString()}' not found in '${unionStructType.toString()}'`);
        }

        const activeValuePointer = this.generator.builder.createInBoundsGEP(lhsLLVM, [
          llvm.ConstantInt.get(this.generator.context, 0),
          llvm.ConstantInt.get(this.generator.context, activeIndex),
        ]);

        const activeValue = this.generator.builder.createLoad(activeValuePointer);
        return this.handleStrictEquals(lhs, rhs, activeValue, rhsLLVM, env);
      }
    }

    error(`Invalid operand types to strict equals ${lhsLLVM.type.typeID} ${rhsLLVM.type.typeID}`);
  }

  private handleStrictNotEquals(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    let right: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpONE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      return this.generator.builder.createICmpNE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isDoubleTy()) {
      const signed = isSigned(lhs, this.generator);
      right = castFPToIntegralType(right, left.type, signed, this.generator);
      return this.generator.builder.createICmpNE(left, right);
    }

    if (left.type.isDoubleTy() && right.type.isIntegerTy()) {
      const signed = isSigned(rhs, this.generator);
      right = promoteIntegralToFP(right, left.type, signed, this.generator);
      return this.generator.builder.createFCmpONE(left, right);
    }

    if (checkIfLLVMString(left.type) && checkIfLLVMString(right.type)) {
      const equals = this.generator.builtinString.getLLVMEquals(lhs);
      return this.generator.builder.createNot(this.generator.builder.createCall(equals, [left, right]));
    }

    error("Invalid operand types to strict not equals");
  }

  private handleLessThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpOLT(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpSLT(left, right);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpULT(left, right);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOLT,
        this.generator
      );
    }

    error("Invalid operand types to less than comparison");
  }

  private handleGreaterThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpOGT(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpSGT(left, right);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpUGT(left, right);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOGT,
        this.generator
      );
    }

    error("Invalid operand types to greater than comparison");
  }

  private handleLessEqualsThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpOLE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpSLE(left, right);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpULE(left, right);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOLE,
        this.generator
      );
    }

    error("Invalid operand types to less equals than comparison");
  }

  private handleGreaterEqualsThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return this.generator.builder.createFCmpOGE(left, right);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpSGE(left, right);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return this.generator.builder.createICmpUGE(left, right);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return handleBinaryWithConversion(
        lhs,
        rhs,
        left,
        right,
        Conversion.Promotion,
        llvm.IRBuilder.prototype.createFCmpOGE,
        this.generator
      );
    }

    error("Invalid operand types to less than comparison");
  }
}

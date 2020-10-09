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
  extractFromUnion,
  extractFromIntersection,
  createHeapAllocatedFromValue,
  isIntersectionLLVMType,
  isPointerToStruct,
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
          const lhs = this.generator.handleExpression(left, env);
          const rhs = this.generator.handleExpression(right, env);
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
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOEQ(lhsLLVM, rhsLLVM), this.generator);
    }

    if (lhsLLVM.type.isIntegerTy() && rhsLLVM.type.isIntegerTy()) {
      return createHeapAllocatedFromValue(this.generator.builder.createICmpEQ(lhsLLVM, rhsLLVM), this.generator);
    }

    if (lhsLLVM.type.isIntegerTy() && rhsLLVM.type.isDoubleTy()) {
      const signed = isSigned(lhs, this.generator);
      rhsLLVM = castFPToIntegralType(rhsLLVM, lhsLLVM.type, signed, this.generator);
      return createHeapAllocatedFromValue(this.generator.builder.createICmpEQ(lhsLLVM, rhsLLVM), this.generator);
    }

    if (lhsLLVM.type.isDoubleTy() && rhsLLVM.type.isIntegerTy()) {
      const signed = isSigned(rhs, this.generator);
      rhsLLVM = promoteIntegralToFP(rhsLLVM, lhsLLVM.type, signed, this.generator);
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOEQ(lhsLLVM, rhsLLVM), this.generator);
    }

    if (checkIfLLVMString(lhsLLVM.type) && checkIfLLVMString(rhsLLVM.type)) {
      const equals = this.generator.builtinString.getLLVMEquals(lhs);
      return createHeapAllocatedFromValue(
        this.generator.xbuilder.createSafeCall(equals, [lhsLLVM, rhsLLVM]),
        this.generator
      );
    }

    if (isUnionLLVMType(lhsLLVM.type)) {
      const extracted = extractFromUnion(
        lhsLLVM,
        rhsLLVM.type.isPointerTy() ? rhsLLVM.type : rhsLLVM.type.getPointerTo(),
        this.generator
      );

      return this.handleStrictEquals(lhs, rhs, extracted, rhsLLVM, env);
    }

    if (!isIntersectionLLVMType(lhsLLVM.type) && isIntersectionLLVMType(rhsLLVM.type)) {
      if (!lhsLLVM.type.isPointerTy()) {
        error(`Expected left hand side operand to be of PointerType, got ${lhsLLVM.type.toString()}`);
      }

      const extracted = extractFromIntersection(rhsLLVM, lhsLLVM.type, this.generator);
      return this.handleStrictEquals(lhs, rhs, lhsLLVM, extracted, env);
    }

    if (isIntersectionLLVMType(lhsLLVM.type) && isIntersectionLLVMType(rhsLLVM.type)) {
      if (!lhsLLVM.type.isPointerTy()) {
        error(`Expected left hand side operand to be of PointerType, got ${lhsLLVM.type.toString()}`);
      }

      if (!rhsLLVM.type.isPointerTy()) {
        error(`Expected right hand side operand to be of PointerType, got ${rhsLLVM.type.toString()}`);
      }

      const lhsAddress = this.generator.builder.createPtrToInt(lhsLLVM, llvm.Type.getInt32Ty(this.generator.context));
      const rhsAddress = this.generator.builder.createPtrToInt(rhsLLVM, llvm.Type.getInt32Ty(this.generator.context));

      return createHeapAllocatedFromValue(this.generator.builder.createICmpEQ(lhsAddress, rhsAddress), this.generator);
    }

    if (isPointerToStruct(lhsLLVM) && isPointerToStruct(rhsLLVM)) {
      const lhsAddress = this.generator.builder.createPtrToInt(lhsLLVM, llvm.Type.getInt32Ty(this.generator.context));
      const rhsAddress = this.generator.builder.createPtrToInt(rhsLLVM, llvm.Type.getInt32Ty(this.generator.context));
      return createHeapAllocatedFromValue(this.generator.builder.createICmpEQ(lhsAddress, rhsAddress), this.generator);
    }

    error(`Invalid operand types to strict equals ${lhsLLVM.type.typeID} ${rhsLLVM.type.typeID}`);
  }

  private handleStrictNotEquals(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    return createHeapAllocatedFromValue(
      this.generator.builder.createNot(
        this.generator.builder.createLoad(this.handleStrictEquals(lhs, rhs, left, right, env))
      ),
      this.generator
    );
  }

  private handleLessThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOLT(left, right), this.generator);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpSLT(left, right), this.generator);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpULT(left, right), this.generator);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return createHeapAllocatedFromValue(
        handleBinaryWithConversion(
          lhs,
          rhs,
          left,
          right,
          Conversion.Promotion,
          this.generator.builder.createFCmpOLT,
          this.generator
        ),
        this.generator
      );
    }

    error("Invalid operand types to less than comparison");
  }

  private handleGreaterThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOGT(left, right), this.generator);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpSGT(left, right), this.generator);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpUGT(left, right), this.generator);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return createHeapAllocatedFromValue(
        handleBinaryWithConversion(
          lhs,
          rhs,
          left,
          right,
          Conversion.Promotion,
          this.generator.builder.createFCmpOGT,
          this.generator
        ),
        this.generator
      );
    }

    error("Invalid operand types to greater than comparison");
  }

  private handleLessEqualsThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOLE(left, right), this.generator);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpSLE(left, right), this.generator);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpULE(left, right), this.generator);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return createHeapAllocatedFromValue(
        handleBinaryWithConversion(
          lhs,
          rhs,
          left,
          right,
          Conversion.Promotion,
          this.generator.builder.createFCmpOLE,
          this.generator
        ),
        this.generator
      );
    }

    error("Invalid operand types to less equals than comparison");
  }

  private handleGreaterEqualsThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const left: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: llvm.Value = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleTy() && right.type.isDoubleTy()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOGE(left, right), this.generator);
    }

    if (left.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpSGE(left, right), this.generator);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpUGE(left, right), this.generator);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (isConvertible(left.type, right.type)) {
      return createHeapAllocatedFromValue(
        handleBinaryWithConversion(
          lhs,
          rhs,
          left,
          right,
          Conversion.Promotion,
          this.generator.builder.createFCmpOGE,
          this.generator
        ),
        this.generator
      );
    }

    error("Invalid operand types to less than comparison");
  }
}

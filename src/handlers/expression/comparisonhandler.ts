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
import { castFPToIntegralType, Conversion, handleBinaryWithConversion, promoteIntegralToFP } from "@handlers";

import { error, createHeapAllocatedFromValue } from "@utils";

import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { LLVMValue } from "../../llvm/value";
import { LLVMType } from "../../llvm/type";

export class ComparisonHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
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
    lhsLLVM: LLVMValue,
    rhsLLVM: LLVMValue,
    env?: Environment
  ): LLVMValue {
    lhsLLVM = this.generator.createLoadIfNecessary(lhsLLVM);
    rhsLLVM = this.generator.createLoadIfNecessary(rhsLLVM);

    const lhsLLVMType = lhsLLVM.type;
    const rhsLLVMType = rhsLLVM.type;

    if (lhsLLVMType.isDoubleType() && rhsLLVMType.isDoubleType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOEQ(lhsLLVM, rhsLLVM), this.generator);
    }

    if (lhsLLVMType.isIntegerType() && rhsLLVMType.isIntegerType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createICmpEQ(lhsLLVM, rhsLLVM), this.generator);
    }

    if (lhsLLVMType.isIntegerType() && rhsLLVMType.isDoubleType()) {
      const signed = isSigned(lhs, this.generator);
      rhsLLVM = castFPToIntegralType(rhsLLVM, lhsLLVMType, signed, this.generator);
      return createHeapAllocatedFromValue(this.generator.builder.createICmpEQ(lhsLLVM, rhsLLVM), this.generator);
    }

    if (lhsLLVMType.isDoubleType() && rhsLLVMType.isIntegerType()) {
      const signed = isSigned(rhs, this.generator);
      rhsLLVM = promoteIntegralToFP(rhsLLVM, lhsLLVMType, signed, this.generator);
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOEQ(lhsLLVM, rhsLLVM), this.generator);
    }

    if (lhsLLVMType.isString() && rhsLLVMType.isString()) {
      const equals = this.generator.builtinString.getLLVMEquals(lhs);
      return createHeapAllocatedFromValue(
        this.generator.builder.createSafeCall(equals, [lhsLLVM, rhsLLVM]),
        this.generator
      );
    }

    if (this.generator.types.union.isLLVMUnion(lhsLLVMType)) {
      const extracted = this.generator.types.union.extract(
        lhsLLVM,
        rhsLLVMType.isPointer() ? rhsLLVMType : rhsLLVMType.getPointer()
      );

      return this.handleStrictEquals(lhs, rhs, extracted, rhsLLVM, env);
    }

    if (
      !this.generator.types.intersection.isLLVMIntersection(lhsLLVMType) &&
      this.generator.types.intersection.isLLVMIntersection(rhsLLVMType)
    ) {
      if (!lhsLLVMType.isPointer()) {
        error(`Expected left hand side operand to be of PointerType, got ${lhsLLVMType.toString()}`);
      }

      const extracted = this.generator.types.intersection.extract(rhsLLVM, lhsLLVMType);
      return this.handleStrictEquals(lhs, rhs, lhsLLVM, extracted, env);
    }

    if (
      this.generator.types.intersection.isLLVMIntersection(lhsLLVMType) &&
      this.generator.types.intersection.isLLVMIntersection(rhsLLVMType)
    ) {
      if (!lhsLLVMType.isPointer()) {
        error(`Expected left hand side operand to be of PointerType, got ${lhsLLVMType.toString()}`);
      }

      if (!rhsLLVMType.isPointer()) {
        error(`Expected right hand side operand to be of PointerType, got ${rhsLLVMType.toString()}`);
      }

      const lhsAddress = this.generator.builder.createPtrToInt(lhsLLVM, LLVMType.getInt32Type(this.generator));
      const rhsAddress = this.generator.builder.createPtrToInt(rhsLLVM, LLVMType.getInt32Type(this.generator));

      return createHeapAllocatedFromValue(this.generator.builder.createICmpEQ(lhsAddress, rhsAddress), this.generator);
    }

    if (lhsLLVMType.isPointerToStruct() && rhsLLVMType.isPointerToStruct()) {
      const lhsAddress = this.generator.builder.createPtrToInt(lhsLLVM, LLVMType.getInt32Type(this.generator));
      const rhsAddress = this.generator.builder.createPtrToInt(rhsLLVM, LLVMType.getInt32Type(this.generator));
      return createHeapAllocatedFromValue(this.generator.builder.createICmpEQ(lhsAddress, rhsAddress), this.generator);
    }

    error(`Invalid operand types to strict equals ${lhsLLVMType.typeID} ${rhsLLVMType.typeID}`);
  }

  private handleStrictNotEquals(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    return createHeapAllocatedFromValue(
      this.generator.builder.createNot(
        this.generator.builder.createLoad(this.handleStrictEquals(lhs, rhs, left, right, env))
      ),
      this.generator
    );
  }

  private handleLessThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOLT(left, right), this.generator);
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpSLT(left, right), this.generator);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpULT(left, right), this.generator);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (left.type.isConvertibleTo(right.type)) {
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

  private handleGreaterThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOGT(left, right), this.generator);
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpSGT(left, right), this.generator);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpUGT(left, right), this.generator);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (left.type.isConvertibleTo(right.type)) {
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

  private handleLessEqualsThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOLE(left, right), this.generator);
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpSLE(left, right), this.generator);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpULE(left, right), this.generator);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (left.type.isConvertibleTo(right.type)) {
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

  private handleGreaterEqualsThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left: LLVMValue = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: LLVMValue = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isDoubleType() && right.type.isDoubleType()) {
      return createHeapAllocatedFromValue(this.generator.builder.createFCmpOGE(left, right), this.generator);
    }

    if (left.type.isIntegerType() && right.type.isIntegerType()) {
      if (bothSigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpSGE(left, right), this.generator);
      } else if (bothUnsigned(lhs, rhs, this.generator)) {
        return createHeapAllocatedFromValue(this.generator.builder.createICmpUGE(left, right), this.generator);
      } else {
        error("Signed -- unsigned comparison not allowed");
      }
    }

    if (left.type.isConvertibleTo(right.type)) {
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

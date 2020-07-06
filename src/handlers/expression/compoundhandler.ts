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
import { castFPToIntegralType, castToInt32AndBack, makeAssignment, promoteIntegralToFP } from "@handlers";
import { LLVMGenerator } from "@generator";
import { error, checkIfLLVMString } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";

type CompoundHandler = (lhs: llvm.Value, rhs: llvm.Value, generator?: LLVMGenerator) => llvm.Value;
export class CompoundAssignmentHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
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
          return this.handleCompoundLogicalRightShift(left, right, env);
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleCompoundPlus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createFAdd(l, r);
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createAdd(l, r);
    const sHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      const concat = this.generator.builtinString.getLLVMConcat(lhs);
      const sret = this.generator.gc.allocate(this.generator.builtinString.getLLVMType().elementType);
      return this.generator.builder.createCall(concat, [sret, l, r]);
    };
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler, sHandler);
  }

  private handleCompoundMinus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createFSub(l, r);
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createSub(l, r);
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler);
  }

  private handleCompoundMultiply(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createFMul(l, r);
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createMul(l, r);
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler);
  }

  private handleCompoundDivision(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createFDiv(l, r);
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createSDiv(l, r);
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler);
  }

  private handleCompoundModulo(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createFRem(l, r);
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createSRem(l, r);
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler);
  }

  private handleCompoundBitwiseAnd(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], this.generator, ([left, right]) =>
        this.generator.builder.createAnd(left, right)
      );
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createAnd(l, r);
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler);
  }

  private handleCompoundBitwiseOr(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], this.generator, ([left, right]) =>
        this.generator.builder.createOr(left, right)
      );
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createOr(l, r);
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler);
  }

  private handleCompoundBitwiseXor(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], this.generator, ([left, right]) =>
        this.generator.builder.createXor(left, right)
      );
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createXor(l, r);
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler);
  }

  private handleCompoundLeftShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], this.generator, ([left, right]) =>
        this.generator.builder.createShl(left, right)
      );
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createShl(l, r);
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler);
  }

  private handleCompoundRightShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], this.generator, ([left, right]) =>
        this.generator.builder.createAShr(left, right)
      );
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createAShr(l, r);
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler);
  }

  private handleCompoundLogicalRightShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], this.generator, ([left, right]) =>
        this.generator.builder.createLShr(left, right)
      );
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value =>
      this.generator.builder.createLShr(l, r);
    return this.handleCompoundAssignment(lhs, rhs, env, fpHandler, iHandler);
  }

  private handleCompoundAssignment(
    lhs: ts.Expression,
    rhs: ts.Expression,
    env?: Environment,
    ...handlers: CompoundHandler[]
  ): llvm.Value {
    const left = this.generator.handleValueExpression(lhs, env);
    let right = this.generator.handleExpression(rhs, env);

    const oldValue = this.generator.createLoadIfNecessary(left);
    const [fpHandler, iHandler, sHandler] = handlers;

    if (oldValue.type.isDoubleTy() && right.type.isDoubleTy()) {
      if (!fpHandler) {
        return error("Floating point type met, but no handler provided");
      }
      const newValue = fpHandler(oldValue, right);
      return makeAssignment(left, newValue, this.generator);
    }

    if (oldValue.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (!iHandler) {
        return error("Integer type met, but no handler provided");
      }

      const newValue = iHandler(oldValue, right);
      return makeAssignment(left, newValue, this.generator);
    }

    if (checkIfLLVMString(oldValue.type) && checkIfLLVMString(right.type)) {
      if (!sHandler) {
        return error("String type met, but no handler provided");
      }
      const newValue = sHandler(oldValue, right, this.generator);
      return makeAssignment(left, newValue, this.generator);
    }

    if (oldValue.type.isIntegerTy() && right.type.isDoubleTy()) {
      if (!iHandler) {
        return error("Integer type met, but no handler provided");
      }

      if (!left.type.isPointerTy()) {
        return error("Pointer type expected");
      }

      right = castFPToIntegralType(
        right,
        (left.type as llvm.PointerType).elementType,
        isSigned(lhs, this.generator),
        this.generator
      );

      const newValue = iHandler(oldValue, right);
      return makeAssignment(left, newValue, this.generator);
    }

    if (oldValue.type.isDoubleTy() && right.type.isIntegerTy()) {
      if (!fpHandler) {
        return error("Floating point type met, but no handler provided");
      }

      right = promoteIntegralToFP(right, oldValue.type, isSigned(rhs, this.generator), this.generator);

      const newValue = fpHandler(oldValue, right);
      return makeAssignment(left, newValue, this.generator);
    }

    return error("Invalid operand types to compound assignment");
  }
}

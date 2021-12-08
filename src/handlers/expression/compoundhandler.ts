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
import { Builder } from "../../builder/builder";

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

  private handleCompoundPlus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const numericHandler: CompoundHandler = (l: LLVMValue, r: LLVMValue): LLVMValue =>
      this.generator.builder.createAdd(l, r);
    const stringHandler: CompoundHandler = (l: LLVMValue, r: LLVMValue): LLVMValue => {
      const concat = this.generator.builtinString.getLLVMConcat();
      const untypedThis = this.generator.builder.asVoidStar(l);

      return this.generator.builder.createSafeCall(concat, [untypedThis, r]);
    };
    return this.handleCompoundAssignment(lhs, rhs, env, numericHandler, stringHandler);
  }

  private handleCompoundMinus(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(lhs, rhs, env, Builder.prototype.createSub.bind(this.generator.builder));
  }

  private handleCompoundMultiply(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(lhs, rhs, env, Builder.prototype.createMul.bind(this.generator.builder));
  }

  private handleCompoundDivision(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(lhs, rhs, env, Builder.prototype.createDiv.bind(this.generator.builder));
  }

  private handleCompoundModulo(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(lhs, rhs, env, Builder.prototype.createRem.bind(this.generator.builder));
  }

  private handleCompoundBitwiseAnd(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(lhs, rhs, env, Builder.prototype.createAnd.bind(this.generator.builder));
  }

  private handleCompoundBitwiseOr(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(lhs, rhs, env, Builder.prototype.createOr.bind(this.generator.builder));
  }

  private handleCompoundBitwiseXor(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(lhs, rhs, env, Builder.prototype.createXor.bind(this.generator.builder));
  }

  private handleCompoundLeftShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(lhs, rhs, env, Builder.prototype.createShl.bind(this.generator.builder));
  }

  private handleCompoundRightShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(lhs, rhs, env, Builder.prototype.createAShr.bind(this.generator.builder));
  }

  private handleCompoundLogicalRightShift(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    return this.handleCompoundAssignment(lhs, rhs, env, Builder.prototype.createLShr.bind(this.generator.builder));
  }

  private handleCompoundAssignment(
    lhs: ts.Expression,
    rhs: ts.Expression,
    env?: Environment,
    ...handlers: CompoundHandler[]
  ): LLVMValue {
    const left = this.generator.handleExpression(lhs, env);
    let right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    const oldValue = this.generator.createLoadIfNecessary(left);
    const [numericHandler, sHandler] = handlers;

    if (
      (oldValue.type.isDoubleType() && right.type.isDoubleType()) ||
      (oldValue.type.isIntegerType() && right.type.isIntegerType())
    ) {
      if (!numericHandler) {
        throw new Error("No  numeric handler provided");
      }
      const newValue = numericHandler(oldValue, right);
      return left.makeAssignment(newValue);
    }

    if (oldValue.type.isString() && right.type.isString()) {
      if (!sHandler) {
        throw new Error("String type met, but no handler provided");
      }
      const newValue = sHandler(oldValue, right);
      return left.makeAssignment(newValue);
    }

    if (oldValue.type.isIntegerType() && right.type.isDoubleType()) {
      if (!numericHandler) {
        throw new Error("No numeric handler provided");
      }

      if (!left.type.isPointer()) {
        throw new Error("Pointer type expected");
      }

      const lhsTsType = this.generator.ts.checker.getTypeAtLocation(lhs);
      right = right.castFPToIntegralType(left.type.getPointerElementType(), lhsTsType.isSigned());

      const newValue = numericHandler(oldValue, right);
      return left.makeAssignment(newValue);
    }

    if (oldValue.type.isDoubleType() && right.type.isIntegerType()) {
      if (!numericHandler) {
        throw new Error("No numeric handler provided");
      }

      const rhsTsType = this.generator.ts.checker.getTypeAtLocation(rhs);
      right = right.promoteIntegralToFP(oldValue.type, rhsTsType.isSigned());

      const newValue = numericHandler(oldValue, right);
      return left.makeAssignment(newValue);
    }

    throw new Error(
      `Invalid operand types to compound assignment: lhs of type '${oldValue.type.toString()}', rhs of type '${right.type.toString()}' at '${lhs.parent.getText()}'`
    );
  }
}

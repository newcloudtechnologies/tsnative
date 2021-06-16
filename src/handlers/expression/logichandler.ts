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
import { makeBoolean, promoteIntegralToFP } from "@handlers";
import { error } from "@utils";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { LLVMValue } from "../../llvm/value";
import { LLVMType } from "../../llvm/type";

export class LogicHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.AmpersandAmpersandToken:
          return this.handleLogicalAnd(left, right, env);
        case ts.SyntaxKind.BarBarToken:
          return this.handleLogicalOr(left, right, env);
        default:
          break;
      }
    }

    if (ts.isConditionalExpression(expression)) {
      const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(expression.whenTrue, env));
      const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(expression.whenFalse, env));

      const conditionValue = this.generator.createLoadIfNecessary(
        this.generator.handleExpression(expression.condition, env)
      );
      const condition = makeBoolean(conditionValue, expression.condition, this.generator);

      return this.generator.builder.createSelect(
        condition,
        this.generator.builder.asVoidStar(left),
        this.generator.builder.asVoidStar(right)
      );
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleLogicalAnd(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    let right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    const lhsBoolean = makeBoolean(left, lhs, this.generator);

    if (left.type.equals(right.type)) {
      return this.generator.builder.createSelect(lhsBoolean, right, left);
    }

    if (left.type.isIntegerType() && right.type.isDoubleType()) {
      const doubleType = LLVMType.getDoubleType(this.generator);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, this.generator), this.generator);
      return this.generator.builder.createSelect(lhsBoolean, right, left);
    }

    if (left.type.isDoubleType() && right.type.isIntegerType()) {
      const doubleType = LLVMType.getDoubleType(this.generator);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, this.generator), this.generator);
      return this.generator.builder.createSelect(lhsBoolean, right, left);
    }

    error("Invalid operand types to logical AND");
  }

  private handleLogicalOr(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    let left: LLVMValue = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    let right: LLVMValue = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    const lhsBoolean = makeBoolean(left, lhs, this.generator);

    if (left.type.equals(right.type)) {
      return this.generator.builder.createSelect(lhsBoolean, left, right);
    }

    if (left.type.isIntegerType() && right.type.isDoubleType()) {
      const doubleType = LLVMType.getDoubleType(this.generator);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, this.generator), this.generator);
      return this.generator.builder.createSelect(lhsBoolean, left, right);
    }

    if (left.type.isDoubleType() && right.type.isIntegerType()) {
      const doubleType = LLVMType.getDoubleType(this.generator);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, this.generator), this.generator);
      return this.generator.builder.createSelect(lhsBoolean, left, right);
    }

    error("Invalid operand types to logical OR");
  }
}

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
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";

export class LogicHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression): llvm.Value | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.AmpersandAmpersandToken:
          return this.handleLogicalAnd(left, right);
        case ts.SyntaxKind.BarBarToken:
          return this.handleLogicalOr(left, right);
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression);
    }

    return;
  }

  private handleLogicalAnd(lhs: ts.Expression, rhs: ts.Expression): llvm.Value {
    let left: llvm.Value = this.generator.handleExpression(lhs);
    let right: llvm.Value = this.generator.handleExpression(rhs);

    const lhsBoolean = makeBoolean(left, lhs, this.generator);

    if (left.type.equals(right.type)) {
      return this.generator.builder.createSelect(lhsBoolean, right, left);
    }

    if (left.type.isIntegerTy() && right.type.isDoubleTy()) {
      const doubleType = llvm.Type.getDoubleTy(this.generator.context);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, this.generator), this.generator);
      return this.generator.builder.createSelect(lhsBoolean, right, left);
    }

    if (left.type.isDoubleTy() && right.type.isIntegerTy()) {
      const doubleType = llvm.Type.getDoubleTy(this.generator.context);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, this.generator), this.generator);
      return this.generator.builder.createSelect(lhsBoolean, right, left);
    }

    return error("Invalid operand types to logical AND");
  }

  private handleLogicalOr(lhs: ts.Expression, rhs: ts.Expression): llvm.Value {
    let left: llvm.Value = this.generator.handleExpression(lhs);
    let right: llvm.Value = this.generator.handleExpression(rhs);

    const lhsBoolean = makeBoolean(left, lhs, this.generator);

    if (left.type.equals(right.type)) {
      return this.generator.builder.createSelect(lhsBoolean, left, right);
    }

    if (left.type.isIntegerTy() && right.type.isDoubleTy()) {
      const doubleType = llvm.Type.getDoubleTy(this.generator.context);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, this.generator), this.generator);
      return this.generator.builder.createSelect(lhsBoolean, left, right);
    }

    if (left.type.isDoubleTy() && right.type.isIntegerTy()) {
      const doubleType = llvm.Type.getDoubleTy(this.generator.context);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, this.generator), this.generator);
      return this.generator.builder.createSelect(lhsBoolean, left, right);
    }

    return error("Invalid operand types to logical OR");
  }
}

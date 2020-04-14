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
import { emitAsBoolean, promoteIntegralToFP } from "@emitter";
import { LLVMGenerator } from "@generator";
import { error } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export class LogicEmitter {
  emitLogicalAnd(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    let left: llvm.Value = generator.emitExpression(lhs);
    let right: llvm.Value = generator.emitExpression(rhs);

    const lhsBoolean = emitAsBoolean(left, generator);

    if (left.type.equals(right.type)) {
      return generator.builder.createSelect(lhsBoolean, right, left);
    }

    if (left.type.isIntegerTy() && right.type.isDoubleTy()) {
      const doubleType = llvm.Type.getDoubleTy(generator.context);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, generator), generator);
      return generator.builder.createSelect(lhsBoolean, right, left);
    }

    if (left.type.isDoubleTy() && right.type.isIntegerTy()) {
      const doubleType = llvm.Type.getDoubleTy(generator.context);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, generator), generator);
      return generator.builder.createSelect(lhsBoolean, right, left);
    }

    return error("Invalid operand types to logical AND");
  }

  emitLogicalOr(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    let left: llvm.Value = generator.emitExpression(lhs);
    let right: llvm.Value = generator.emitExpression(rhs);

    const lhsBoolean = emitAsBoolean(left, generator);

    if (left.type.equals(right.type)) {
      return generator.builder.createSelect(lhsBoolean, left, right);
    }

    if (left.type.isIntegerTy() && right.type.isDoubleTy()) {
      const doubleType = llvm.Type.getDoubleTy(generator.context);
      left = promoteIntegralToFP(left, doubleType, isSigned(lhs, generator), generator);
      return generator.builder.createSelect(lhsBoolean, left, right);
    }

    if (left.type.isDoubleTy() && right.type.isIntegerTy()) {
      const doubleType = llvm.Type.getDoubleTy(generator.context);
      right = promoteIntegralToFP(right, doubleType, isSigned(rhs, generator), generator);
      return generator.builder.createSelect(lhsBoolean, left, right);
    }

    return error("Invalid operand types to logical OR");
  }
}

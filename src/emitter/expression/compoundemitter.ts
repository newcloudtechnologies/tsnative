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

import { getBuiltin } from "@builtins";
import { isSigned } from "@cpp";
import { castFPToIntegralType, castToInt32AndBack, emitAssignment, promoteIntegralToFP } from "@emitter";
import { LLVMGenerator } from "@generator";
import { error, isLLVMString } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

type CompoundHandler = (lhs: llvm.Value, rhs: llvm.Value, generator?: LLVMGenerator) => llvm.Value;
export class CompoundEmitter {
  emitCompoundPlus(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createFAdd(l, r);
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createAdd(l, r);
    const sHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      const concat = getBuiltin("string__concat", generator.context, generator.module);
      return generator.builder.createCall(concat.callee, [l, r]);
    };
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler, sHandler);
  }

  emitCompoundMinus(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createFSub(l, r);
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createSub(l, r);
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler);
  }

  emitCompoundMultiply(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createFMul(l, r);
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createMul(l, r);
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler);
  }

  emitCompoundDivision(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createFDiv(l, r);
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createSDiv(l, r);
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler);
  }

  emitCompoundModulo(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createFRem(l, r);
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createSRem(l, r);
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler);
  }

  emitCompoundBitwiseAnd(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], generator, ([left, right]) => generator.builder.createAnd(left, right));
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createAnd(l, r);
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler);
  }

  emitCompoundBitwiseOr(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], generator, ([left, right]) => generator.builder.createOr(left, right));
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createOr(l, r);
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler);
  }

  emitCompoundBitwiseXor(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], generator, ([left, right]) => generator.builder.createXor(left, right));
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createXor(l, r);
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler);
  }

  emitCompoundLeftShift(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], generator, ([left, right]) => generator.builder.createShl(left, right));
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createShl(l, r);
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler);
  }

  emitCompoundRightShift(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], generator, ([left, right]) => generator.builder.createAShr(left, right));
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createAShr(l, r);
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler);
  }

  emitCompoundLogicalRightShift(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const fpHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => {
      return castToInt32AndBack([l, r], generator, ([left, right]) => generator.builder.createLShr(left, right));
    };
    const iHandler: CompoundHandler = (l: llvm.Value, r: llvm.Value): llvm.Value => generator.builder.createLShr(l, r);
    return this.handleCompoundAssignment(lhs, rhs, generator, fpHandler, iHandler);
  }

  private handleCompoundAssignment(
    lhs: ts.Expression,
    rhs: ts.Expression,
    generator: LLVMGenerator,
    ...handlers: CompoundHandler[]
  ): llvm.Value {
    const left = generator.emitValueExpression(lhs);
    let right = generator.emitExpression(rhs);

    const oldValue = generator.createLoadIfNecessary(left);
    const [fpHandler, iHandler, sHandler] = handlers;

    if (oldValue.type.isDoubleTy() && right.type.isDoubleTy()) {
      if (!fpHandler) {
        return error("Floating point type met, but no handler provided");
      }
      const newValue = fpHandler(oldValue, right);
      return emitAssignment(left, newValue, generator);
    }

    if (oldValue.type.isIntegerTy() && right.type.isIntegerTy()) {
      if (!iHandler) {
        return error("Integer type met, but no handler provided");
      }

      const newValue = iHandler(oldValue, right);
      return emitAssignment(left, newValue, generator);
    }

    if (isLLVMString(oldValue.type) && isLLVMString(right.type)) {
      if (!sHandler) {
        return error("String type met, but no handler provided");
      }
      const newValue = sHandler(oldValue, right, generator);
      return emitAssignment(left, newValue, generator);
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
        isSigned(lhs, generator),
        generator
      );

      const newValue = iHandler(oldValue, right);
      return emitAssignment(left, newValue, generator);
    }

    if (oldValue.type.isDoubleTy() && right.type.isIntegerTy()) {
      if (!fpHandler) {
        return error("Floating point type met, but no handler provided");
      }

      right = promoteIntegralToFP(right, oldValue.type, isSigned(rhs, generator), generator);

      const newValue = fpHandler(oldValue, right);
      return emitAssignment(left, newValue, generator);
    }

    return error("Invalid operand types to compound assignment");
  }
}

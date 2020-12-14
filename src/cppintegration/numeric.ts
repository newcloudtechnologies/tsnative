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

import { LLVMGenerator } from "@generator";
import { makeAssignment } from "@handlers";
import { error, getExpressionTypename } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export function isCppIntegralType(type: string): boolean {
  switch (type) {
    case "int8_t":
    case "int16_t":
    case "int32_t":
    case "int64_t":

    case "uint8_t":
    case "uint16_t":
    case "uint32_t":
    case "uint64_t":
      return true;
    default:
      return false;
  }
}

export function getIntegralType(type: ts.Type, generator: LLVMGenerator): llvm.Type | undefined {
  const { checker, context } = generator;
  switch (checker.typeToString(type)) {
    case "int8_t":
    case "uint8_t":
      return llvm.Type.getInt8Ty(context);
    case "int16_t":
    case "uint16_t":
      return llvm.Type.getInt16Ty(context);
    case "int32_t":
    case "uint32_t":
      return llvm.Type.getInt32Ty(context);
    case "int64_t":
    case "uint64_t":
      return llvm.Type.getInt64Ty(context);
    default:
      return;
  }
}

export function isSignedType(type: string) {
  switch (type) {
    case "int8_t":
    case "int16_t":
    case "int32_t":
    case "int64_t":
      return true;
    case "uint8_t":
    case "uint16_t":
    case "uint32_t":
    case "uint64_t":
      return false;
    default:
      error(`Expected integral type, got '${type}'`);
  }
}

export function isSigned(expression: ts.Expression, generator: LLVMGenerator): boolean {
  const typename = getExpressionTypename(expression, generator.checker);
  if (!isCppIntegralType(typename)) {
    return false;
  }

  return isSignedType(typename);
}

function signedOperand(expression: ts.Expression, generator: LLVMGenerator): boolean {
  return isSigned(expression, generator);
}

export function bothSigned(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): boolean {
  return signedOperand(lhs, generator) && signedOperand(rhs, generator);
}

export function bothUnsigned(lhs: ts.Expression, rhs: ts.Expression, generator: LLVMGenerator): boolean {
  return !signedOperand(lhs, generator) && !signedOperand(rhs, generator);
}

export function getIntegralLLVMTypeTypename(type: llvm.Type): string {
  if (!type || !type.isIntegerTy()) {
    return "";
  }

  if (type.isIntegerTy(8)) {
    return "int8_t";
  }

  if (type.isIntegerTy(16)) {
    return "int16_t";
  }

  if (type.isIntegerTy(32)) {
    return "int32_t";
  }

  if (type.isIntegerTy(128)) {
    error("128 bits width integral type is reserved for conversion from FP-values to integral values");
  }

  return "";
}

/* tslint:disable:object-literal-sort-keys */
const integralAdjust: {
  [type: string]: {
    isSigned: boolean;
    typeGetter: (_: llvm.LLVMContext) => llvm.Type;
  };
} = {
  int8_t: {
    isSigned: true,
    typeGetter: llvm.Type.getInt8Ty,
  },
  int16_t: {
    isSigned: true,
    typeGetter: llvm.Type.getInt16Ty,
  },
  int32_t: {
    isSigned: true,
    typeGetter: llvm.Type.getInt32Ty,
  },
  int64_t: {
    isSigned: true,
    typeGetter: llvm.Type.getInt64Ty,
  },
  uint8_t: {
    isSigned: false,
    typeGetter: llvm.Type.getInt8Ty,
  },
  uint16_t: {
    isSigned: false,
    typeGetter: llvm.Type.getInt16Ty,
  },
  uint32_t: {
    isSigned: false,
    typeGetter: llvm.Type.getInt32Ty,
  },
  uint64_t: {
    isSigned: false,
    typeGetter: llvm.Type.getInt64Ty,
  },
};
/* tslint:enable:object-literal-sort-keys */

export function adjustValue(value: llvm.Value, typename: string, generator: LLVMGenerator): llvm.Value {
  if (isCppIntegralType(typename)) {
    const loaded = generator.createLoadIfNecessary(value);
    if (!loaded.type.isIntegerTy()) {
      const adjustParameters = integralAdjust[typename];
      // use the widest integral type to control overflow during initialization
      const singed = generator.builder.createFPToSI(loaded, llvm.Type.getInt64Ty(generator.context));
      value = generator.builder.createIntCast(
        singed,
        adjustParameters.typeGetter(generator.context),
        adjustParameters.isSigned
      );

      // @todo: how to avoid extra allocation?
      const allocated = generator.gc.allocate(value.type);
      value = makeAssignment(allocated, value, generator);
    }
  }
  return value;
}

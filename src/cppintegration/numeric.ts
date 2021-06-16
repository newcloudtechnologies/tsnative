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

import { LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";
import * as ts from "typescript";

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
    default:
      return false;
  }
}

export function isSigned(expression: ts.Expression, generator: LLVMGenerator): boolean {
  const type = generator.ts.checker.getTypeAtLocation(expression);
  if (!type.isCppIntegralType()) {
    return false;
  }

  return isSignedType(type.toString());
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

export function getIntegralLLVMTypeTypename(type: LLVMType) {
  if (type.isIntegerType(8)) {
    return "int8_t";
  }

  if (type.isIntegerType(16)) {
    return "int16_t";
  }

  if (type.isIntegerType(32)) {
    return "int32_t";
  }

  return "";
}

/* tslint:disable:object-literal-sort-keys */
const integralAdjust: {
  [type: string]: {
    isSigned: boolean;
    typeGetter: (_: LLVMGenerator) => LLVMType;
  };
} = {
  int8_t: {
    isSigned: true,
    typeGetter: LLVMType.getInt8Type,
  },
  int16_t: {
    isSigned: true,
    typeGetter: LLVMType.getInt16Type,
  },
  int32_t: {
    isSigned: true,
    typeGetter: LLVMType.getInt32Type,
  },
  int64_t: {
    isSigned: true,
    typeGetter: LLVMType.getInt64Type,
  },
  uint8_t: {
    isSigned: false,
    typeGetter: LLVMType.getInt8Type,
  },
  uint16_t: {
    isSigned: false,
    typeGetter: LLVMType.getInt16Type,
  },
  uint32_t: {
    isSigned: false,
    typeGetter: LLVMType.getInt32Type,
  },
  uint64_t: {
    isSigned: false,
    typeGetter: LLVMType.getInt64Type,
  },
};
/* tslint:enable:object-literal-sort-keys */

export function adjustValue(value: LLVMValue, typename: string, generator: LLVMGenerator): LLVMValue {
  const loaded = generator.createLoadIfNecessary(value);
  if (!loaded.type.isIntegerType()) {
    const adjustParameters = integralAdjust[typename];
    const typeGetter = adjustParameters.typeGetter(generator);

    value = adjustParameters.isSigned
      ? generator.builder.createFPToSI(loaded, typeGetter)
      : generator.builder.createFPToUI(loaded, typeGetter);

    // @todo: how to avoid extra allocation?
    const allocated = generator.gc.allocate(value.type);
    value = makeAssignment(allocated, value, generator);
  }

  return value;
}

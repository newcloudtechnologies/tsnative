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
import { error } from "@utils";
import { LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";

export function getSyntheticBody(size: number, generator: LLVMGenerator): LLVMType[] {
  const syntheticBody = [];
  while (size > 8) {
    // Consider int64_t is the widest available inttype.
    syntheticBody.push(LLVMType.getIntNType(8 * 8, generator));
    size -= 8;
  }

  if (size > 0) {
    console.assert((size & (size - 1)) === 0, `Expected 'size' reminder to be a power of two, got ${size}`);
    syntheticBody.push(LLVMType.getIntNType(size * 8, generator));
  }

  return syntheticBody;
}

export function storeActualArguments(
  args: LLVMValue[],
  closureFunctionData: LLVMValue,
  generator: LLVMGenerator,
  fixedArgsCount?: number
) {
  // Closure data consists of null-valued arguments. Replace dummy arguments with actual ones.
  for (let i = 0; i < args.length; ++i) {
    const elementPtrPtr = generator.builder.createSafeInBoundsGEP(closureFunctionData, [0, i + (fixedArgsCount || 0)]);

    const elementPtrType = elementPtrPtr.type.getPointerElementType();
    let argument = args[i];

    if (!argument.type.equals(elementPtrType)) {
      argument = argument.adjustToType(elementPtrType);
    }

    generator.builder.createSafeStore(argument, elementPtrPtr);
  }
}

export function createHeapAllocatedFromValue(value: LLVMValue, generator: LLVMGenerator) {
  if (value.type.isPointer()) {
    error("Expected value to be not of PointerType");
  }

  const allocated = generator.gc.allocate(value.type);
  generator.builder.createSafeStore(value, allocated);
  return allocated;
}

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
import { error, InternalNames } from "@utils";
import * as llvm from "llvm-node";
import { isConvertible } from "@handlers";

export function checkIfLLVMString(type: llvm.Type) {
  const nakedType = unwrapPointerType(type);
  return nakedType.isStructTy() && nakedType.name === "string";
}

export function checkIfLLVMArray(type: llvm.Type) {
  const nakedType = unwrapPointerType(type);
  return Boolean(nakedType.isStructTy() && nakedType.name?.startsWith("Array__"));
}

export function getTypeSize(type: llvm.Type, generator: LLVMGenerator): number {
  const size = generator.sizeOf.getByLLVMType(type);
  if (size) {
    return size;
  }
  return generator.module.dataLayout.getTypeStoreSize(type);
}

export function getLLVMTypename(type: llvm.Type) {
  return type.toString().replace(/%|\*/g, "");
}

export function getSyntheticBody(size: number, context: llvm.LLVMContext): llvm.IntegerType[] {
  const syntheticBody = [];
  while (size > 8) {
    // Consider int64_t is the widest available inttype.
    syntheticBody.push(llvm.Type.getIntNTy(context, 8 * 8));
    size -= 8;
  }

  if (size > 0) {
    console.assert((size & (size - 1)) === 0, `Expected 'size' reminder to be a power of two, got ${size}`);
    syntheticBody.push(llvm.Type.getIntNTy(context, size * 8));
  }

  return syntheticBody;
}

export function getEnvironmentType(types: llvm.Type[], generator: LLVMGenerator) {
  if (types.some((type) => !type.isPointerTy())) {
    error(
      `Expected all the types to be of PointerType, got:\n${types.map((type) => "  " + type.toString()).join(",\n")}`
    );
  }

  const environmentName =
    "env__(" +
    types.reduce((acc, curr) => {
      return acc + "_" + curr.toString().replace(/\"/g, "");
    }, "") +
    ")";

  let envType = generator.module.getTypeByName(environmentName);
  if (!envType) {
    envType = llvm.StructType.create(generator.context, environmentName);
    envType.setBody(types);
  }

  return envType;
}

export function isCppPrimitiveType(type: llvm.Type) {
  return type.isIntegerTy() || type.isDoubleTy();
}

export function correctCppPrimitiveType(type: llvm.Type) {
  if (type.isPointerTy() && isCppPrimitiveType(type.elementType)) {
    type = type.elementType;
  }

  return type;
}

export function adjustLLVMValueToType(value: llvm.Value, type: llvm.Type, generator: LLVMGenerator): llvm.Value {
  if (value.type.equals(type) || isConvertible(value.type, type)) {
    return value;
  } else {
    if (shouldLoad(value.type, type)) {
      value = generator.builder.createLoad(value);
      return adjustLLVMValueToType(value, type, generator);
    } else if (isSamePointerLevel(value.type, type)) {
      if (!value.type.equals(type)) {
        if (value.type.isPointerTy() && value.type.elementType.isIntegerTy(8)) {
          value = generator.builder.createBitCast(value, type);
        } else if (isSimilarStructs(value.type, type)) {
          if (!value.type.isPointerTy() && !type.isPointerTy()) {
            // allocate -> cast -> load
            const allocated = generator.gc.allocate(value.type);
            generator.xbuilder.createSafeStore(value, allocated);
            value = generator.builder.createBitCast(allocated, type.getPointerTo());
            value = generator.builder.createLoad(value);
          } else {
            value = generator.builder.createBitCast(value, type);
          }
        } else if (generator.types.union.isLLVMUnion(type)) {
          value = generator.types.union.initialize(type as llvm.PointerType, value);
        } else if (generator.types.intersection.isLLVMIntersection(type)) {
          value = generator.types.intersection.initialize(type as llvm.PointerType, value);
        } else if (generator.types.union.isLLVMUnion(value.type)) {
          value = generator.types.union.extract(value, type as llvm.PointerType);
        } else if (generator.types.intersection.isLLVMIntersection(value.type)) {
          value = generator.types.intersection.extract(value, type as llvm.PointerType);
        }

        if (value.type.equals(type)) {
          return value;
        }
      }

      error(`Cannot adjust '${value.type.toString()}' to '${type.toString()}'`);
    } else {
      const allocated = generator.gc.allocate(value.type);
      generator.xbuilder.createSafeStore(value, allocated);
      return adjustLLVMValueToType(allocated, type, generator);
    }
  }
}

export function getPointerLevel(type: llvm.Type) {
  let level = 0;
  while (type.isPointerTy()) {
    type = type.elementType;
    ++level;
  }
  return level;
}

function isSamePointerLevel(lhs: llvm.Type, rhs: llvm.Type) {
  return getPointerLevel(lhs) === getPointerLevel(rhs);
}

function shouldLoad(parameterType: llvm.Type, destinationType: llvm.Type) {
  return getPointerLevel(parameterType) > getPointerLevel(destinationType);
}

export function getLLVMValue(value: llvm.Value, generator: LLVMGenerator) {
  while (value.type.isPointerTy() && !checkIfLLVMString(value.type)) {
    value = generator.builder.createLoad(value);
  }
  return value;
}

export function unwrapPointerType(type: llvm.Type) {
  while (type.isPointerTy()) {
    type = type.elementType;
  }
  return type;
}

export function storeActualArguments(
  args: llvm.Value[],
  closureFunctionData: llvm.Value,
  generator: LLVMGenerator,
  fixedArgsCount?: number
) {
  // Closure data consists of null-valued arguments. Replace dummy arguments with actual ones.
  for (let i = 0; i < args.length; ++i) {
    const elementPtrPtr = generator.xbuilder.createSafeInBoundsGEP(closureFunctionData, [0, i + (fixedArgsCount || 0)]);

    const elementPtrType = (elementPtrPtr.type as llvm.PointerType).elementType as llvm.PointerType;
    let argument = args[i];

    if (!argument.type.equals(elementPtrType)) {
      argument = adjustLLVMValueToType(argument, elementPtrType, generator);
    }

    generator.xbuilder.createSafeStore(argument, elementPtrPtr);
  }
}

export function isPointerToStruct(value: llvm.Value) {
  return value.type.isPointerTy() && value.type.elementType.isStructTy();
}

export function createHeapAllocatedFromValue(value: llvm.Value, generator: LLVMGenerator) {
  if (value.type.isPointerTy()) {
    error("Expected value to be not of PointerType");
  }

  const allocated = generator.gc.allocate(value.type);
  generator.xbuilder.createSafeStore(value, allocated);
  return allocated;
}

export function getTSObjectPropsFromName(name: string) {
  const props = name.split(InternalNames.Object)[1]?.split(".");
  if (!props || props.length === 0) {
    error(`No object prop names found in '${name}'`);
  }
  return props;
}

export function isSimilarStructs(lhs: llvm.Type, rhs: llvm.Type) {
  lhs = unwrapPointerType(lhs);
  rhs = unwrapPointerType(rhs);

  if (!lhs.isStructTy() || !rhs.isStructTy()) {
    return false;
  }

  if (lhs.numElements !== rhs.numElements) {
    return false;
  }

  for (let i = 0; i < lhs.numElements; ++i) {
    if (!lhs.getElementType(i).equals(rhs.getElementType(i))) {
      return false;
    }
  }

  return true;
}

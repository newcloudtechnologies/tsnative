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
import * as llvm from "llvm-node";

export class XBuilder {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  checkInsert(aggregate: llvm.Value, value: llvm.Value, idxList: number[]) {
    if (!aggregate.type.isStructTy()) {
      error(`Expected aggregate to be of StructType, got ${aggregate.type.toString()}`);
    }
    const aggregateStructType = aggregate.type as llvm.StructType;
    if (!aggregateStructType.getElementType(idxList[0]).equals(value.type)) {
      error(
        `Types mismatch, trying to insert '${value.type.toString()}'
                 into '${aggregateStructType.getElementType(idxList[0]).toString()}'`
      );
    }
  }

  createSafeInsert(aggregate: llvm.Value, value: llvm.Value, idxList: number[]) {
    this.checkInsert(aggregate, value, idxList);
    return this.generator.builder.createInsertValue(aggregate, value, idxList);
  }

  checkStore(value: llvm.Value, ptr: llvm.Value) {
    if (!value.type.equals((ptr.type as llvm.PointerType).elementType)) {
      error(
        `Types mismatch: value '${value.type.toString()}', pointer element type '${(ptr.type as llvm.PointerType).elementType.toString()}'`
      );
    }
  }

  createSafeStore(value: llvm.Value, ptr: llvm.Value, isVolatile?: boolean) {
    this.checkStore(value, ptr);
    return this.generator.builder.createStore(value, ptr, isVolatile);
  }

  checkExtractValue(aggregate: llvm.Value, idxList: number[]) {
    if (!aggregate.type.isStructTy()) {
      error(`Expected aggregate to be of StructType, got ${aggregate.type.toString()}`);
    }
    const aggregateStructType = aggregate.type as llvm.StructType;
    if (idxList.some((idx) => idx >= aggregateStructType.numElements || idx < 0)) {
      error(`Index out of bounds for ${aggregateStructType.toString()}, ${idxList}`);
    }
  }

  createSafeExtractValue(aggregate: llvm.Value, idxList: number[], name?: string) {
    this.checkExtractValue(aggregate, idxList);
    return this.generator.builder.createExtractValue(aggregate, idxList, name);
  }

  checkInBoundsGEP(ptr: llvm.Value, idxList: number[]) {
    if (!ptr.type.isPointerTy()) {
      error(`Expected ptr to be of PointerType, got '${ptr.type.toString()}'`);
    }
    if (!ptr.type.elementType.isStructTy()) {
      error(`Expected ptr element to be of StructType, got '${ptr.type.elementType.toString()}'`);
    }

    if (ptr.type.elementType.numElements === 0) {
      error(`Invalid GEP from empty struct`);
    }

    for (const idx of idxList) {
      if (idx > ptr.type.elementType.numElements - 1) {
        error(`GEP index out of bounds: ${idx}, upper bound: ${ptr.type.elementType.numElements - 1}`);
      }

      if (idx < 0) {
        error(`Invalid GEP index: -1`);
      }
    }
  }

  createSafeInBoundsGEP(ptr: llvm.Value, idxList: number[], name?: string): llvm.Value {
    this.checkInBoundsGEP(ptr, idxList);
    const idxValues = idxList.map((idx) => llvm.ConstantInt.get(this.generator.context, idx));
    return this.generator.builder.createInBoundsGEP(ptr, idxValues, name);
  }

  checkCall(callee: llvm.Value, args: llvm.Value[]) {
    if (!(callee instanceof llvm.Function)) {
      // Giving up.
      return;
    }

    const calleeArgs = callee.getArguments();
    if (calleeArgs.length !== args.length) {
      error(`Arguments length mismatch, expected ${calleeArgs.length}, got ${args.length}`);
    }

    for (let i = 0; i < calleeArgs.length; ++i) {
      const calleeArg = calleeArgs[i];
      const arg = args[i];
      if (!calleeArg.type.equals(arg.type)) {
        error(`Types mismatch: '${calleeArg.type.toString()}' - '${arg.type.toString()}' at index: ${i}`);
      }
    }
  }

  createSafeCall(callee: llvm.Value, args: llvm.Value[], name?: string) {
    this.checkCall(callee, args);
    return this.generator.builder.createCall(callee, args, name);
  }

  checkRet(value: llvm.Value) {
    const currentFnReturnType = this.generator.currentFunction.type.elementType.returnType;
    if (!currentFnReturnType.equals(value.type)) {
      error(`Expected return value to be of '${currentFnReturnType.toString()}', got '${value.type.toString()}'`);
    }
  }

  createSafeRet(value: llvm.Value) {
    this.checkRet(value);
    return this.generator.builder.createRet(value);
  }

  asVoidStar(value: llvm.Value) {
    // It might looks strange, but void* in LLVM is i8*.
    return this.generator.builder.createBitCast(value, llvm.Type.getInt8PtrTy(this.generator.context));
  }

  asVoidStarStar(value: llvm.Value) {
    // It might looks strange, but void* in LLVM is i8*.
    return this.generator.builder.createBitCast(value, llvm.Type.getInt8PtrTy(this.generator.context).getPointerTo());
  }
}

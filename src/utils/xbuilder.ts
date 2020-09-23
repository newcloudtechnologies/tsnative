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

import { error } from "@utils";

export class XBuilder {
  private readonly builder: llvm.IRBuilder;

  constructor(builder: llvm.IRBuilder) {
    this.builder = builder;
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
    return this.builder.createInsertValue(aggregate, value, idxList);
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
    return this.builder.createStore(value, ptr, isVolatile);
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
    return this.builder.createExtractValue(aggregate, idxList, name);
  }
}

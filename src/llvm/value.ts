/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
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
import { LLVMStructType, LLVMType } from "./type";

export class LLVMValue {
  protected readonly value: llvm.Value;
  private readonly generator: LLVMGenerator;

  constructor(value: llvm.Value, generator: LLVMGenerator) {
    this.value = value;
    this.generator = generator;
  }

  static create(value: llvm.Value, generator: LLVMGenerator) {
    return new LLVMValue(value, generator);
  }

  get type() {
    return LLVMType.make(this.value.type, this.generator);
  }

  get name() {
    return this.value.name;
  }

  set name(name: string) {
    this.value.name = name;
  }

  getTSObjectPropsFromName() {
    const props = this.value.name.split(InternalNames.Object)[1]?.split(".");
    if (!props || props.length === 0) {
      error(`No object prop names found in '${this.value.name}'`);
    }
    return props;
  }

  getValue() {
    let value = this as LLVMValue;
    while (value.type.isPointer() && !value.type.isString()) {
      value = this.generator.builder.createLoad(value);
    }
    return value;
  }

  adjustToType(type: LLVMType): LLVMValue {
    let value = this as LLVMValue;
    if (value.type.equals(type) || value.type.isConvertibleTo(type)) {
      return value;
    } else {
      if (value.type.isDeeperPointerLevel(type)) {
        value = this.generator.builder.createLoad(value);
        return value.adjustToType(type);
      } else if (value.type.isSamePointerLevel(type)) {
        if (!value.type.equals(type)) {
          if (value.type.isPointer() && value.type.getPointerElementType().isIntegerType(8)) {
            value = this.generator.builder.createBitCast(value, type);
          } else if (
            value.type.unwrapPointer().isStructType() &&
            (value.type.unwrapPointer() as LLVMStructType).isSameStructs(type)
          ) {
            if (!value.type.isPointer() && !type.isPointer()) {
              // allocate -> cast -> load
              const allocated = this.generator.gc.allocate(value.type);
              this.generator.builder.createSafeStore(value, allocated);

              value = this.generator.builder.createBitCast(allocated, type.getPointer());
              value = this.generator.builder.createLoad(value);
            } else {
              value = this.generator.builder.createBitCast(value, type);
            }
          } else if (this.generator.types.union.isLLVMUnion(type)) {
            value = this.generator.types.union.initialize(type, value);
          } else if (this.generator.types.intersection.isLLVMIntersection(type)) {
            value = this.generator.types.intersection.initialize(type, value);
          } else if (this.generator.types.union.isLLVMUnion(value.type)) {
            value = this.generator.types.union.extract(value, type);
          } else if (this.generator.types.intersection.isLLVMIntersection(value.type)) {
            value = this.generator.types.intersection.extract(value, type);
          }

          if (value.type.equals(type)) {
            return value;
          }
        }

        error(`Cannot adjust '${value.type.toString()}' to '${type.toString()}'`);
      } else {
        const allocated = this.generator.gc.allocate(value.type);
        this.generator.builder.createSafeStore(value, allocated);
        return allocated.adjustToType(type);
      }
    }
  }

  get unwrapped() {
    return this.value;
  }
}

export class LLVMConstant extends LLVMValue {
  protected constructor(value: llvm.Constant, generator: LLVMGenerator) {
    super(value, generator);
  }

  static createNullValue(type: LLVMType, generator: LLVMGenerator) {
    const nullValue = llvm.Constant.getNullValue(type.unwrapped);
    return LLVMValue.create(nullValue, generator) as LLVMConstant;
  }
}

export class LLVMConstantInt extends LLVMConstant {
  protected constructor(value: llvm.ConstantInt, generator: LLVMGenerator) {
    super(value, generator);
  }

  static get(generator: LLVMGenerator, value: number | string, numBits: number = 32, signed: boolean = true) {
    const llvmValue = llvm.ConstantInt.get(generator.context, value, numBits, signed);
    return LLVMValue.create(llvmValue, generator) as LLVMConstantInt;
  }

  static getFalse(generator: LLVMGenerator) {
    const llvmValue = llvm.ConstantInt.getFalse(generator.context);
    return LLVMValue.create(llvmValue, generator) as LLVMConstantInt;
  }

  static getTrue(generator: LLVMGenerator) {
    const llvmValue = llvm.ConstantInt.getTrue(generator.context);
    return LLVMValue.create(llvmValue, generator) as LLVMConstantInt;
  }
}

export class LLVMConstantFP extends LLVMConstant {
  protected constructor(value: llvm.ConstantFP, generator: LLVMGenerator) {
    super(value, generator);
  }

  static get(generator: LLVMGenerator, value: number) {
    const llvmValue = llvm.ConstantFP.get(generator.context, value);
    return LLVMValue.create(llvmValue, generator) as LLVMConstantFP;
  }
}

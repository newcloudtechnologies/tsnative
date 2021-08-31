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

import * as llvm from "llvm-node";
import { LLVMGenerator } from "../generator";

export class LLVMType {
  type: llvm.Type;
  generator: LLVMGenerator;

  constructor(type: llvm.Type, generator: LLVMGenerator) {
    this.type = type;
    this.generator = generator;
  }

  static make(type: llvm.Type, generator: LLVMGenerator): LLVMType | LLVMStructType {
    if (type.isStructTy()) {
      return new LLVMStructType(type, generator);
    }
    return new LLVMType(type, generator);
  }

  static getVoidType(generator: LLVMGenerator) {
    const type = llvm.Type.getVoidTy(generator.context);
    return LLVMType.make(type, generator);
  }

  static getInt8Type(generator: LLVMGenerator) {
    const type = llvm.Type.getInt8Ty(generator.context);
    return LLVMType.make(type, generator);
  }

  static getInt16Type(generator: LLVMGenerator) {
    const type = llvm.Type.getInt16Ty(generator.context);
    return LLVMType.make(type, generator);
  }

  static getInt32Type(generator: LLVMGenerator) {
    const type = llvm.Type.getInt32Ty(generator.context);
    return LLVMType.make(type, generator);
  }

  static getInt64Type(generator: LLVMGenerator) {
    const type = llvm.Type.getInt64Ty(generator.context);
    return LLVMType.make(type, generator);
  }

  static getIntNType(numBits: number, generator: LLVMGenerator) {
    const type = llvm.Type.getIntNTy(generator.context, numBits);
    return LLVMType.make(type, generator);
  }

  static getDoubleType(generator: LLVMGenerator) {
    const type = llvm.Type.getDoubleTy(generator.context);
    return LLVMType.make(type, generator);
  }

  get typeID() {
    return this.type.typeID;
  }

  getPointer(addressSpace?: number) {
    // @todo: isn't it possible to forward optional parameter to inner function call as is?
    const type = addressSpace ? this.type.getPointerTo(addressSpace) : this.type.getPointerTo();
    return LLVMType.make(type, this.generator);
  }

  isIntegerType(bitWidth?: number) {
    // @todo: isn't it possible to forward optional parameter to inner function call as is?
    return bitWidth ? this.type.isIntegerTy(bitWidth) : this.type.isIntegerTy();
  }

  isDoubleType() {
    return this.type.isDoubleTy();
  }

  isVoid() {
    return this.type.isVoidTy();
  }

  isFunction() {
    return this.type.isFunctionTy();
  }

  isString() {
    const nakedType = this.unwrapPointer();
    return nakedType.type.isStructTy() && nakedType.type.name === "string";
  }

  isArray() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.type.isStructTy() && nakedType.type.name?.startsWith("Array__"));
  }

  isMap() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.type.isStructTy() && nakedType.type.name?.startsWith("Map__"));
  }

  isSet() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.type.isStructTy() && nakedType.type.name?.startsWith("Set__"));
  }

  isCppPrimitiveType() {
    return this.type.isIntegerTy() || this.type.isDoubleTy();
  }

  isPointer() {
    return this.type.isPointerTy();
  }

  isStructType(): this is LLVMStructType {
    return this.type.isStructTy();
  }

  isPointerToStruct() {
    return this.type.isPointerTy() && this.getPointerElementType().isStructType();
  }

  isIntersection() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.name?.endsWith(".intersection"));
  }

  isUnion() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.name?.endsWith(".union"));
  }

  isUnionWithUndefined(): boolean {
    const nakedType = this.unwrapPointer();
    return Boolean(
      nakedType.isStructType() && nakedType.name?.startsWith("undefined.") && nakedType.name?.endsWith(".union")
    );
  }

  isUnionWithNull(): boolean {
    const nakedType = this.unwrapPointer();
    return Boolean(
      nakedType.isStructType() && nakedType.name?.startsWith("null.") && nakedType.name?.endsWith(".union")
    );
  }

  isClosure() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.name?.startsWith("TSClosure__class"));
  }

  getTypeSize() {
    const size = this.generator.sizeOf.getByLLVMType(this);
    if (size) {
      return size;
    }
    return this.generator.module.dataLayout.getTypeStoreSize(this.type);
  }

  getTypename() {
    return this.toString().replace(/%|\*/g, "");
  }

  getSubtypesNames() {
    return this.type
      .toString()
      .split(".")
      .slice(0, -1)
      .map((typeName) => typeName.replace(/%|\*/g, ""));
  }

  getIntegralLLVMTypeTypename() {
    if (this.isIntegerType(8)) {
      return "int8_t";
    }

    if (this.isIntegerType(16)) {
      return "int16_t";
    }

    if (this.isIntegerType(32)) {
      return "int32_t";
    }

    return "";
  }

  getPointerElementType() {
    if (!this.type.isPointerTy()) {
      throw new Error(`Expected pointer type, got '${this.toString()}'`);
    }

    return LLVMType.make(this.type.elementType, this.generator);
  }

  unwrapPointer() {
    let type = this.type;
    while (type.isPointerTy()) {
      type = type.elementType;
    }

    return LLVMType.make(type, this.generator);
  }

  getPointerLevel() {
    let level = 0;
    let type = this.type;
    while (type.isPointerTy()) {
      type = type.elementType;
      ++level;
    }
    return level;
  }

  isSamePointerLevel(other: LLVMType) {
    return this.getPointerLevel() === other.getPointerLevel();
  }

  isDeeperPointerLevel(other: LLVMType) {
    return this.getPointerLevel() > other.getPointerLevel();
  }

  correctCppPrimitiveType(): LLVMType | LLVMStructType {
    if (this.type.isPointerTy() && this.getPointerElementType().isCppPrimitiveType()) {
      return LLVMType.make(this.type.elementType, this.generator);
    }

    return this;
  }

  isConvertibleTo(destination: LLVMType) {
    if (this.type.isIntegerTy() && destination.type.isDoubleTy()) {
      return true;
    }

    if (this.type.isDoubleTy() && destination.type.isIntegerTy()) {
      return true;
    }

    return false;
  }

  ensurePointer(): LLVMType {
    return this.isPointer() ? this : this.getPointer();
  }

  equals(other: LLVMType) {
    return this.type.equals(other.unwrapped);
  }

  toString() {
    return this.type.toString();
  }

  get unwrapped() {
    return this.type;
  }
}

export class LLVMStructType extends LLVMType {
  constructor(type: llvm.StructType, generator: LLVMGenerator) {
    super(type, generator);
  }

  static create(generator: LLVMGenerator, name?: string) {
    const type = llvm.StructType.create(generator.context, name);
    return LLVMType.make(type, generator) as LLVMStructType;
  }

  static get(generator: LLVMGenerator, elements: LLVMType[], isPacked?: boolean) {
    const type = llvm.StructType.get(
      generator.context,
      elements.map((element) => element.unwrapped),
      isPacked || false
    );
    return LLVMType.make(type, generator) as LLVMStructType;
  }

  getSyntheticBody(size: number) {
    const syntheticBody = [];
    while (size > 8) {
      // Consider int64_t is the widest available inttype.
      syntheticBody.push(LLVMType.getIntNType(8 * 8, this.generator));
      size -= 8;
    }

    if (size > 0) {
      console.assert((size & (size - 1)) === 0, `Expected 'size' reminder to be a power of two, got ${size}`);
      syntheticBody.push(LLVMType.getIntNType(size * 8, this.generator));
    }

    return syntheticBody;
  }

  setBody(elements: LLVMType[], packed?: boolean) {
    if (!this.type.isStructTy()) {
      throw new Error("Expected struct type");
    }

    const types = elements.map((element) => element.unwrapped);
    this.type.setBody(types, packed || false);
  }

  isSameStructs(other: LLVMType) {
    const lhs = this.unwrapPointer();
    const rhs = other.unwrapPointer();

    if (!lhs.isStructType() || !rhs.isStructType()) {
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

  getElementType(index: number) {
    if (!this.type.isStructTy()) {
      throw new Error("Expected StructType");
    }
    return LLVMType.make(this.type.getElementType(index), this.generator);
  }

  get numElements() {
    if (!this.type.isStructTy()) {
      throw new Error("Expected StructType");
    }
    return this.type.numElements;
  }

  get name() {
    if (!this.type.isStructTy()) {
      throw new Error("Expected StructType");
    }
    return this.type.name;
  }
}

/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
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

  static getVPtrType(generator: LLVMGenerator) {
    const type = llvm.FunctionType.get(llvm.Type.getInt32Ty(generator.context), true);
    return LLVMType.make(type, generator).getPointer().getPointer();
  }

  static getVirtualFunctionType(generator: LLVMGenerator) {
    const type = llvm.FunctionType.get(llvm.Type.getInt32Ty(generator.context), true);
    return LLVMType.make(type, generator).getPointer();
  }

  get typeID() {
    return this.type.typeID;
  }

  get typeIDName() {
    const typeID = this.typeID;
    for (const [name, id] of Object.entries(llvm.Type.TypeID)) {
      if (id === typeID) {
        return name;
      }
    }

    throw new Error(`TypeID '${typeID}' is not a member of '${llvm.Type.TypeID}'`);
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

  isTSNumber() {
    const nakedType = this.unwrapPointer();
    return nakedType.type.isStructTy() && nakedType.type.name === "number";
  }

  isTSBoolean() {
    const nakedType = this.unwrapPointer();
    return nakedType.type.isStructTy() && nakedType.type.name === "boolean";
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

  isLLVMArray() {
    const nakedType = this.unwrapPointer();
    return nakedType.type.isArrayTy();
  }

  isMap() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.type.isStructTy() && nakedType.type.name?.startsWith("Map__"));
  }

  isSet() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.type.isStructTy() && nakedType.type.name?.startsWith("Set__"));
  }

  isTuple() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.type.isStructTy() && nakedType.type.name?.startsWith("Tuple__"));
  }

  isTSClass() {
    const nakedType = this.unwrapPointer().type;
    return Boolean(nakedType.isStructTy() && nakedType.name?.includes("__class__"));
  }

  isTSInterface() {
    const nakedType = this.unwrapPointer().type;
    return Boolean(nakedType.isStructTy() && nakedType.name?.includes("__interface__"));
  }

  isTSObject() {
    const nakedType = this.unwrapPointer().type;
    return Boolean(nakedType.isStructTy() && nakedType.name?.includes(this.generator.internalNames.Object));
  }

  isObject() {
    const nakedType = this.unwrapPointer().type;
    return Boolean(nakedType.isStructTy() && nakedType.name === "object");
  }

  isTSTypeLiteral() {
    const nakedType = this.unwrapPointer().type;
    return Boolean(nakedType.isStructTy() && nakedType.name?.includes(this.generator.internalNames.TypeLiteral));
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

  isPointerToArray() {
    return this.type.isPointerTy() && this.getPointerElementType().isLLVMArray();
  }

  isUnion() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.name === "union");
  }

  isUndefined() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.name === "undefined");
  }

  isNull() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.name === "null");
  }

  isClosure() {
    const nakedType = this.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.name === "closure");
  }

  getTypeSize() {
    const size = this.generator.sizeOf.getByLLVMType(this);
    if (size) {
      return size;
    }
    return this.generator.module.dataLayout.getTypeStoreSize(this.type);
  }

  get returnType() {
    return LLVMType.make((this.type as llvm.FunctionType).returnType, this.generator);
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

  static create(generator: LLVMGenerator, name?: string, types?: LLVMType[]) {
    const type = llvm.StructType.create(generator.context, name);

    if (types) {
      type.setBody(types.map((t) => t.unwrapped))
    }

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
      const lhsElementType = lhs.getElementType(i);
      const rhsElementType = rhs.getElementType(i);
      if (
        !lhsElementType.equals(rhsElementType) &&
        !(
          lhsElementType.isPointerToStruct() &&
          (lhsElementType.unwrapPointer() as LLVMStructType).isSameStructs(rhsElementType)
        )
      ) {
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

export class LLVMArrayType extends LLVMType {
  constructor(type: llvm.ArrayType, generator: LLVMGenerator) {
    super(type, generator);
  }

  static get(generator: LLVMGenerator, elementType: LLVMType, numElements: number) {
    const type = llvm.ArrayType.get(elementType.unwrapped, numElements);
    return LLVMType.make(type, generator) as LLVMArrayType;
  }

  get numElements() {
    if (!this.type.isArrayTy()) {
      throw new Error("Expected ArrayType");
    }
    return (this.type as llvm.ArrayType).numElements;
  }
}

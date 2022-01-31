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

import { LLVMGenerator } from "../generator";
import * as llvm from "llvm-node";
import { LLVMArrayType, LLVMStructType, LLVMType } from "./type";
import { Prototype } from "../scope";
import { OperationFlags } from "../tsbuiltins";

export enum MathFlags {
  Inplace = 1,
}

export class LLVMValue {
  protected readonly value: llvm.Value;
  protected readonly generator: LLVMGenerator;
  protected prototype: Prototype | undefined;

  protected constructor(value: llvm.Value, generator: LLVMGenerator) {
    this.value = value;
    this.generator = generator;
  }

  static create(value: llvm.Value, generator: LLVMGenerator) {
    const type = LLVMType.make(value.type, generator);
    if (type.isIntersection()) {
      return new LLVMIntersection(value, generator);
    } else if (type.isUnion()) {
      return new LLVMUnion(value, generator);
    }

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

  attachPrototype(prototype: Prototype) {
    this.prototype = prototype;
  }

  hasPrototype() {
    return Boolean(this.prototype);
  }

  getPrototype() {
    if (!this.hasPrototype()) {
      throw new Error("LLVMValue: prototype non found. Consider call 'LLVMValue.hasPrototype' before 'getPrototype'");
    }

    return this.prototype!;
  }

  getTSObjectPropsFromName() {
    const props = this.value.name.split(this.generator.internalNames.Object)[1]?.split(".");
    if (!props || props.length === 0) {
      throw new Error(`No object prop names found in '${this.value.name}'`);
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
    if (value.type.equals(type)) {
      return value;
    }

    if (value.type.isTSNumber() && type.isIntegerType()) {
      return value.asLLVMInteger();
    }

    if (value.isUnion() && value.containsType(type)) {
      value = value.extract(type);
      return value.adjustToType(type);
    }

    if (value.isIntersection()) {
      value = value.extract(type);
      return value.adjustToType(type);
    }

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
        } else if (type.isUnion()) {
          const nullUnion = LLVMUnion.createNullValue(type, this.generator);
          value = nullUnion.initialize(value);
        } else if (type.isIntersection()) {
          const nullIntersection = LLVMIntersection.createNullValue(type, this.generator);
          value = nullIntersection.initialize(value);
        }

        if (value.type.equals(type)) {
          return value;
        }
      }

      console.log(this.generator.module.print());

      throw new Error(`Cannot adjust '${value.type.toString()}' to '${type.toString()}'`);
    }

    const allocated = this.generator.gc.allocate(value.type);
    this.generator.builder.createSafeStore(value, allocated);
    return allocated.adjustToType(type);
  }

  isTSPrimitivePtr() {
    const type = this.type;
    if (!type.isPointer()) {
      return false;
    }

    const pointerElementType = this.type.getPointerElementType();
    return pointerElementType.isString() || pointerElementType.isTSNumber() || pointerElementType.isTSBoolean();
  }

  isIntersection(): this is LLVMIntersection {
    return this.type.isIntersection();
  }

  isUnion(): this is LLVMUnion {
    return this.type.isUnion();
  }

  isOptionalUnion(): this is LLVMUnion {
    return this.type.isOptionalUnion();
  }

  isOptionalClosure(): boolean {
    const isOptionalUnion = this.type.isUnionWithNull() || this.type.isUnionWithUndefined();

    if (!isOptionalUnion) {
      return false;
    }

    let structType: LLVMStructType;
    if (this.type.isPointer()) {
      structType = this.type.getPointerElementType() as LLVMStructType;
    } else if (this.type.isStructType()) {
      structType = this.type;
    } else {
      throw new Error("Unreachable");
    }

    // Optional functions expected to be unions of exactly two elements: marker and one closure pointer
    const isPair = structType.numElements === 2;
    const secondPairPtr = this.type.isPointer()
      ? this.generator.builder.createSafeInBoundsGEP(this, [0, 1])
      : this.generator.builder.createSafeExtractValue(this, [1]);

    return isPair && secondPairPtr.type.isClosure();
  }

  makeBoolean(): LLVMValue {
    if (this.type.isTSBoolean()) {
      return this;
    }

    if (this.type.isTSNumber()) {
      const toBoolFn = this.generator.builtinNumber.createBooleanFn("toBool", OperationFlags.Unary);
      return this.generator.builder.createSafeCall(toBoolFn, [this.generator.builder.asVoidStar(this)]);
    }

    if (this.type.isString()) {
      const lengthGetter = this.generator.builtinString.getLLVMLength();
      const length = this.generator.builder.createSafeCall(lengthGetter, [this.generator.builder.asVoidStar(this)]);

      const toBoolFn = this.generator.builtinNumber.createBooleanFn("toBool", OperationFlags.Unary);
      return this.generator.builder.createSafeCall(toBoolFn, [this.generator.builder.asVoidStar(length)]);
    }

    if (this.isUnion()) {
      if (this.type.isOptionalUnion()) {
        const marker = this.generator.builder.createSafeInBoundsGEP(this, [0, 0]);
        return this.generator.builder.createLoad(marker);
      }

      return this.generator.builtinBoolean.create(LLVMConstantInt.getTrue(this.generator));
    }

    if (this.type.isUndefined()) {
      return this.generator.builtinBoolean.create(LLVMConstantInt.getFalse(this.generator));
    }

    if (this.type.isClosure()) {
      return this.generator.builtinBoolean.create(LLVMConstantInt.getTrue(this.generator));
    }

    if (this.type.isPointer()) {
      return this.generator.builtinBoolean.create(LLVMConstantInt.getTrue(this.generator));
    }

    throw new Error(`Unable to convert operand of type ${this.type.toString()} to boolean value`);
  }

  makeAssignment(other: LLVMValue): LLVMValue {
    const value = this as LLVMValue;

    if (!value.type.isPointer()) {
      throw new Error(`Assignment destination expected to be of PointerType, got '${value.type.toString()}'`);
    }

    if (value.isUnion()) {
      let unionValue = value.initialize(other);
      if (!value.type.getPointerElementType().equals(unionValue.type)) {
        unionValue = unionValue.adjustToType(value.type.getPointerElementType());
      }
      this.generator.builder.createSafeStore(unionValue, value);
      return value;
    }

    other = other.adjustToType(value.type.getPointerElementType());

    this.generator.builder.createSafeStore(other, value);
    return value;
  }

  createHeapAllocated(): LLVMValue {
    if (this.type.isPointer()) {
      throw new Error("Expected value to be not of PointerType");
    }

    const allocated = this.generator.gc.allocate(this.type);
    this.generator.builder.createSafeStore(this, allocated);
    return allocated;
  }

  // @todo: terminology mess
  createNegate(): LLVMValue {
    if (this.type.isTSNumber()) {
      const fn = this.generator.builtinNumber.createMathFn("negate", OperationFlags.Unary);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped]);
    } else if (this.type.isTSBoolean()) {
      const fn = this.generator.builtinBoolean.createNegateFn();
      return this.generator.builder.createSafeCall(fn, [this]);
    }

    throw new Error(`Unhandled type '${this.type.toString()}' in LLVMValue.createNegate`);
  }

  createPrefixIncrement(): LLVMValue {
    // @todo: check type
    const fn = this.generator.builtinNumber.createMathFn("prefixIncrement", OperationFlags.Unary);
    const thisUntyped = this.generator.builder.asVoidStar(this);
    return this.generator.builder.createSafeCall(fn, [thisUntyped]);
  }

  createPostfixIncrement(): LLVMValue {
    // @todo: check type
    const fn = this.generator.builtinNumber.createMathFn("postfixIncrement", OperationFlags.Unary);
    const thisUntyped = this.generator.builder.asVoidStar(this);
    return this.generator.builder.createSafeCall(fn, [thisUntyped]);
  }

  createPrefixDecrement(): LLVMValue {
    // @todo: check type
    const fn = this.generator.builtinNumber.createMathFn("prefixDecrement", OperationFlags.Unary);
    const thisUntyped = this.generator.builder.asVoidStar(this);
    return this.generator.builder.createSafeCall(fn, [thisUntyped]);
  }

  createPostfixDecrement(): LLVMValue {
    // @todo: check type
    const fn = this.generator.builtinNumber.createMathFn("postfixDecrement", OperationFlags.Unary);
    const thisUntyped = this.generator.builder.asVoidStar(this);
    return this.generator.builder.createSafeCall(fn, [thisUntyped]);
  }

  createAdd(other: LLVMValue, flags?: MathFlags): LLVMValue {
    // operand type is intentionally not checked
    if (this.type.isString()) {
      // mkrv @todo: handle inPlace flag correcty
      const concat = this.generator.builtinString.getLLVMConcat();
      const untypedThis = this.generator.builder.asVoidStar(this);

      const result = this.generator.builder.createSafeCall(concat, [untypedThis, other]);
      if (flags === MathFlags.Inplace) {
        return this.makeAssignment(result);
      }

      return result;
    } else if (this.type.isTSNumber()) {
      const fnName = `add${flags === MathFlags.Inplace ? "Inplace" : ""}`;
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to binary plus: '${this.type.toString()}' '${other.type.toString()}'`);
  }

  createSub(other: LLVMValue, flags?: MathFlags): LLVMValue {
    // operand type is intentionally not checked
    if (this.type.isTSNumber()) {
      const fnName = `sub${flags === MathFlags.Inplace ? "Inplace" : ""}`;
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to binary minus: '${this.type.toString()}' '${other.type.toString()}'`);
  }

  createMul(other: LLVMValue, flags?: MathFlags): LLVMValue {
    // operand type is intentionally not checked
    if (this.type.isTSNumber()) {
      const fnName = `mul${flags === MathFlags.Inplace ? "Inplace" : ""}`;
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to binary multiply: '${this.type.toString()}' '${other.type.toString()}'`);
  }

  createDiv(other: LLVMValue, flags?: MathFlags): LLVMValue {
    // operand type is intentionally not checked
    if (this.type.isTSNumber()) {
      const fnName = `div${flags === MathFlags.Inplace ? "Inplace" : ""}`;
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to binary division: '${this.type.toString()}' '${other.type.toString()}'`);
  }

  createMod(other: LLVMValue, flags?: MathFlags): LLVMValue {
    // operand type is intentionally not checked
    if (this.type.isTSNumber()) {
      const fnName = `mod${flags === MathFlags.Inplace ? "Inplace" : ""}`;
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to binary modulo: '${this.type.toString()}' '${other.type.toString()}'`);
  }

  createBitwiseAnd(other: LLVMValue, flags?: MathFlags): LLVMValue {
    if (this.type.isTSNumber() && other.type.isTSNumber()) {
      const fnName = `bitwiseAnd${flags === MathFlags.Inplace ? "Inplace" : ""}`;
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to bitwise and: '${this.type.toString()}' '${other.type.toString()}'`);
  }

  createBitwiseOr(other: LLVMValue, flags?: MathFlags): LLVMValue {
    if (this.type.isTSNumber() && other.type.isTSNumber()) {
      const fnName = `bitwiseOr${flags === MathFlags.Inplace ? "Inplace" : ""}`;
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to bitwise or: '${this.type.toString()}' '${other.type.toString()}'`);
  }

  createBitwiseXor(other: LLVMValue, flags?: MathFlags): LLVMValue {
    if (this.type.isTSNumber() && other.type.isTSNumber()) {
      const fnName = `bitwiseXor${flags === MathFlags.Inplace ? "Inplace" : ""}`;
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to bitwise xor: '${this.type.toString()}' '${other.type.toString()}'`);
  }

  createBitwiseLeftShift(other: LLVMValue, flags?: MathFlags): LLVMValue {
    if (this.type.isTSNumber() && other.type.isTSNumber()) {
      const fnName = `bitwiseLeftShift${flags === MathFlags.Inplace ? "Inplace" : ""}`;
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(
      `Invalid operand types to bitwise left shift: '${this.type.toString()}' '${other.type.toString()}'`
    );
  }

  createBitwiseRightShift(other: LLVMValue, flags?: MathFlags): LLVMValue {
    if (this.type.isTSNumber() && other.type.isTSNumber()) {
      const fnName = `bitwiseRightShift${flags === MathFlags.Inplace ? "Inplace" : ""}`;
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(
      `Invalid operand types to bitwise right shift: '${this.type.toString()}' '${other.type.toString()}'`
    );
  }

  createEquals(other: LLVMValue): LLVMValue {
    const leftType = this.type;
    const rightType = other.type;

    if (leftType.isTSNumber() && rightType.isTSNumber()) {
      const fn = this.generator.builtinNumber.createBooleanFn("equals");
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    } else if (leftType.isString() && rightType.isString()) {
      const equals = this.generator.builtinString.getLLVMEquals();
      return this.generator.builder.createSafeCall(equals, [this, other]);
    } else if (leftType.isTSBoolean() && rightType.isTSBoolean()) {
      const equals = this.generator.builtinBoolean.getLLVMEquals();
      return this.generator.builder.createSafeCall(equals, [this, other]);
    } else if (this.isUnion()) {
      const extracted = this.extract(rightType.ensurePointer());
      return extracted.createEquals(other);
    } else if (!this.isIntersection() && other.isIntersection()) {
      if (!leftType.isPointer()) {
        throw new Error(`Expected left hand side operand to be of PointerType, got ${leftType.toString()}`);
      }

      const extracted = other.extract(leftType);
      return this.createEquals(extracted);
    } else if (leftType.isPointerToStruct() && rightType.isPointerToStruct()) {
      const lhsAddress = this.generator.builder.createPtrToInt(this, LLVMType.getInt32Type(this.generator));
      const rhsAddress = this.generator.builder.createPtrToInt(other, LLVMType.getInt32Type(this.generator));

      const raw = this.generator.builder.createICmpEQ(lhsAddress, rhsAddress);

      return this.generator.builtinBoolean.create(raw);
    }

    throw new Error(`Invalid operand types to strict equals: 
                            lhs: ${leftType.toString()} ${leftType.typeIDName}
                            rhs: ${rightType.toString()} ${rightType.typeIDName}`);
  }

  createNotEquals(other: LLVMValue): LLVMValue {
    return this.createEquals(other).createNegate();
  }

  createLessThan(other: LLVMValue): LLVMValue {
    // operand type is intentionally not checked
    if (this.type.isTSNumber()) {
      const fn = this.generator.builtinNumber.createBooleanFn("lessThan");
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to less than: 
                            lhs: ${this.type.toString()} ${this.type.typeIDName}
                            rhs: ${other.type.toString()} ${other.type.typeIDName}`);
  }

  createLessThanEquals(other: LLVMValue): LLVMValue {
    // operand type is intentionally not checked
    if (this.type.isTSNumber()) {
      const fn = this.generator.builtinNumber.createBooleanFn("lessEqualsThan");
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to less equals than: 
                            lhs: ${this.type.toString()} ${this.type.typeIDName}
                            rhs: ${other.type.toString()} ${other.type.typeIDName}`);
  }

  createGreaterThan(other: LLVMValue): LLVMValue {
    // operand type is intentionally not checked
    if (this.type.isTSNumber()) {
      const fn = this.generator.builtinNumber.createBooleanFn("greaterThan");
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to greater than: 
                            lhs: ${this.type.toString()} ${this.type.typeIDName}
                            rhs: ${other.type.toString()} ${other.type.typeIDName}`);
  }

  createGreaterThanEquals(other: LLVMValue): LLVMValue {
    // operand type is intentionally not checked
    if (this.type.isTSNumber()) {
      const fn = this.generator.builtinNumber.createBooleanFn("greaterEqualsThan");
      const thisUntyped = this.generator.builder.asVoidStar(this);
      return this.generator.builder.createSafeCall(fn, [thisUntyped, other]);
    }

    throw new Error(`Invalid operand types to greater equals than: 
                            lhs: ${this.type.toString()} ${this.type.typeIDName}
                            rhs: ${other.type.toString()} ${other.type.typeIDName}`);
  }

  clone(): LLVMValue {
    if (this.type.isTSNumber()) {
      return this.generator.builtinNumber.clone(this);
    } else if (this.type.isString()) {
      return this.generator.builtinString.clone(this);
    } else if (this.type.isTSBoolean()) {
      return this.generator.builtinBoolean.clone(this);
    }

    throw new Error(`Expected TS primitive at LLVMValue.clone, got '${this.type.toString()}'`);
  }

  asLLVMInteger(): LLVMValue {
    if (!this.type.isTSNumber()) {
      throw new Error(
        `Expected LLVMValue.asLLVMInteger to be called on Number type, called on '${this.type.toString()}'`
      );
    }

    const llvmDouble = this.generator.builtinNumber.getUnboxed(this);
    return this.generator.builder.createFPToSI(llvmDouble, LLVMType.getInt32Type(this.generator));
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

export class LLVMIntersection extends LLVMValue {
  static createNullValue(type: LLVMType, generator: LLVMGenerator) {
    const value = LLVMConstant.createNullValue(type, generator);
    return new LLVMIntersection(value.unwrapped, generator);
  }

  private findIndexOfSubarray<T>(arr: T[], subarr: T[], equalityChecker: (lhs: T, rhs: T) => boolean): number {
    position_loop: for (let i = 0; i <= arr.length - subarr.length; ++i) {
      for (let j = 0; j < subarr.length; ++j) {
        if (!equalityChecker(arr[i + j], subarr[j])) {
          continue position_loop;
        }
      }
      return i;
    }
    return -1;
  }

  initialize(initializer: LLVMValue) {
    if (!this.type.isPointer()) {
      throw new Error(`Expected pointer type, got '${this.type.toString()}'`);
    }

    if (this.type.equals(initializer.type)) {
      return initializer;
    }

    if (!this.type.getPointerElementType().isStructType()) {
      throw new Error(`Expected destination to be of StructType, got ${this.type.getPointerElementType().toString()}`);
    }

    if (!initializer.type.isPointerToStruct()) {
      throw new Error(`Expected initializer to be a pointer to struct, got ${initializer.type.toString()}`);
    }

    if (initializer.type.isIntersection()) {
      return (initializer as LLVMIntersection).extract(this.type);
    }

    initializer = this.generator.builder.createLoad(initializer);
    const initializerStructType = initializer.type as LLVMStructType;

    if (initializerStructType.numElements !== (this.type.getPointerElementType() as LLVMStructType).numElements) {
      throw new Error(
        `Types mismatch: destination type: '${this.type
          .getPointerElementType()
          .toString()}', initializer: '${initializer.type.toString()}'`
      );
    }

    let intersection = LLVMIntersection.createNullValue(this.type.getPointerElementType(), this.generator);

    for (let i = 0; i < initializerStructType.numElements; ++i) {
      const value = this.generator.builder.createSafeExtractValue(initializer, [i]);
      intersection = this.generator.builder.createSafeInsert(intersection, value, [i]) as LLVMIntersection;
    }

    const allocated = this.generator.gc.allocate(intersection.type);
    this.generator.builder.createSafeStore(intersection, allocated);
    return allocated;
  }

  extract(destinationType: LLVMType) {
    if (!this.type.isPointer()) {
      throw new Error(`Expected intersection to be of PointerType, got '${this.type.toString()}'`);
    }

    if (!this.type.getPointerElementType().isStructType()) {
      throw new Error(
        `Expected intersection element to be of StructType, got '${this.type.getPointerElementType().toString()}'`
      );
    }

    const intersectionStructType = this.type.unwrapPointer() as LLVMStructType;
    const intersectionElementTypes = [];

    for (let i = 0; i < intersectionStructType.numElements; ++i) {
      intersectionElementTypes.push(intersectionStructType.getElementType(i));
    }

    const destinationElementTypes = [];
    const destinationStructType = destinationType.getPointerElementType() as LLVMStructType;

    for (let i = 0; i < destinationStructType.numElements; ++i) {
      let type = destinationStructType.getElementType(i);
      if (!type.isString()) {
        if (type.isPointerToStruct()) {
          const elementTypes = [];
          const structType = type.getPointerElementType() as LLVMStructType;
          for (let k = 0; k < structType.numElements; ++k) {
            elementTypes.push(structType.getElementType(k));
          }
          type = LLVMStructType.get(this.generator, elementTypes).getPointer();
        }
      }
      destinationElementTypes.push(type);
    }

    let startIndex = this.findIndexOfSubarray(
      intersectionElementTypes,
      destinationElementTypes,
      (lhs: LLVMType, rhs: LLVMType) => lhs.equals(rhs)
    );

    if (startIndex === -1) {
      const getLLVMTypename = (type: LLVMType) => type.toString().replace(/%|\*/g, "");

      const intersectionTypeNames = this.type.getSubtypesNames();
      const dest = getLLVMTypename(destinationType);
      startIndex = intersectionTypeNames.indexOf(dest);

      if (startIndex === -1) {
        throw new Error(
          `Cannot find types intersection '${intersectionStructType.toString()}' '${destinationType.toString()}'`
        );
      }
    }

    let result = LLVMConstant.createNullValue(destinationStructType, this.generator);

    const intersectionValue = this.getValue();
    for (let i = startIndex, k = 0; i < startIndex + destinationStructType.numElements; ++i, ++k) {
      const value = this.generator.builder.createSafeExtractValue(intersectionValue, [i]);
      result = this.generator.builder.createSafeInsert(result, value, [k]) as LLVMConstant;
    }

    const allocation = this.generator.gc.allocate(destinationStructType);
    this.generator.builder.createSafeStore(result, allocation);

    return allocation;
  }
}

export class LLVMUnion extends LLVMValue {
  static createNullValue(type: LLVMType, generator: LLVMGenerator) {
    const value = LLVMConstant.createNullValue(type, generator);
    return new LLVMUnion(value.unwrapped, generator);
  }

  private indexOfType(type: LLVMType) {
    const elementTypes = [];

    const unionStructType = this.type.unwrapPointer();
    if (!unionStructType.isStructType()) {
      throw new Error("Union expected to be of StructType");
    }

    for (let i = 0; i < unionStructType.numElements; ++i) {
      elementTypes.push(unionStructType.getElementType(i));
    }

    for (let i = 0; i < elementTypes.length; ++i) {
      const elementType = elementTypes[i];
      const nakedElementType = elementType.unwrapPointer();
      const isSameStructs = nakedElementType.isStructType() && nakedElementType.isSameStructs(type); // mkrv @todo: potential pitfall, will fail if there are same-typed elements in union, should be refactored
      if (elementType.equals(type) || isSameStructs) {
        return i;
      }
    }

    return -1;
  }

  containsType(type: LLVMType) {
    return this.indexOfType(type) !== -1;
  }

  initializeNullOptional() {
    const markerPtr = this.generator.builder.createSafeInBoundsGEP(this, [0, 0]);
    // 'T | null' or 'T | undefined'
    // this kind of types is represented as LLVM's { boolean*, T* }
    // first element is considered as a marker. value of 'false' in it signals that T is not stored in this union
    // '8' is for the bitwidth
    const markerValue = this.generator.builtinBoolean.create(LLVMConstantInt.getFalse(this.generator));
    this.generator.builder.createSafeStore(markerValue, markerPtr);
  }

  initialize(initializer: LLVMValue, runtimeIndex?: LLVMValue) {
    if (!this.type.isPointer()) {
      throw new Error(`Expected pointer type, got '${this.type.toString()}'`);
    }

    if (this.type.equals(initializer.type)) {
      return initializer;
    }

    const unionStructType = this.type.unwrapPointer();
    if (!unionStructType.isStructType()) {
      throw new Error("Union expected to be of StructType");
    }

    const unionValue = LLVMConstant.createNullValue(unionStructType, this.generator);
    const allocated = this.generator.gc.allocate(unionStructType);
    this.generator.builder.createSafeStore(unionValue, allocated);

    const unionElements = [];
    for (let i = 0; i < unionStructType.numElements; ++i) {
      unionElements.push(unionStructType.getElementType(i));
    }
    // mkrv @todo: there is a mess with ooo initialization, should be refactored
    const optionalWithClassOrTypeLiteral =
      unionStructType.isOptionalUnion() && unionElements.some((type) => type.isTSClass() || type.isTSTypeLiteral());

    if (
      !optionalWithClassOrTypeLiteral &&
      !initializer.type.isString() &&
      !initializer.type.isTSNumber() &&
      !initializer.type.isTSBoolean() &&
      !initializer.type.isTSClass() &&
      !unionValue.isOptionalClosure() &&
      initializer.type.unwrapPointer().isStructType()
    ) {
      const propNames = [];

      // @todo: can initializer be an intersection?
      if (initializer.type.isUnion()) {
        // Try to handle initializer as union. Its props names are available through meta storage.
        const typename = initializer.type.getTypename();
        const unionMeta = this.generator.meta.getUnionMeta(typename);
        if (!unionMeta) {
          throw new Error(`Cannot find union meta for '${typename}'`);
        }
        propNames.push(...unionMeta.props);
      } else if (initializer.name) {
        // Try to handle initializer as a plain TS object. Its name is in format: %random__object__prop1.prop2.propN
        const objectProps = initializer.getTSObjectPropsFromName();
        propNames.push(...objectProps);
      } else {
        // Try to handle initializer as class/interface. Its props names are available through meta storage.
        const typename = initializer.type.getTypename();
        const structMeta = this.generator.meta.getStructMeta(typename);
        if (!structMeta) {
          throw new Error(`Cannot find struct meta for '${typename}'`);
        }

        propNames.push(...structMeta.props);
      }

      const unionName = unionStructType.name;
      if (!unionName) {
        throw new Error("Name required for UnionStruct");
      }

      const unionMeta = this.generator.meta.getUnionMeta(unionName);

      const initializerValue = initializer.getValue();

      propNames.forEach((name, index) => {
        let destinationIndex = unionMeta.propsMap.get(name);
        if (name === "primitive") {
          destinationIndex = this.indexOfType(
            (initializer.type.unwrapPointer() as LLVMStructType).getElementType(index)
          );

          if (destinationIndex === -1) {
            return;
          }
        }

        if (typeof destinationIndex === "undefined") {
          throw new Error(`Mapping not found for property ${name}`);
        }

        const elementPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, destinationIndex]);
        this.generator.builder.createSafeStore(
          this.generator.builder.createSafeExtractValue(initializerValue, [index]),
          elementPtr
        );
      });
    } else {
      if (runtimeIndex) {
        if (!runtimeIndex.type.isTSNumber()) {
          throw new Error(`Expected runtime index to be of Number type, got '${runtimeIndex.type.toString()}'`);
        }

        runtimeIndex = runtimeIndex.asLLVMInteger();

        const nullIndex = LLVMConstantInt.get(this.generator, 0);
        const arrayType = LLVMArrayType.get(
          this.generator,
          LLVMType.getInt8Type(this.generator).getPointer(),
          unionStructType.numElements
        );

        // Runtime indexes are invalid for GEP for structs since element type must be known.
        // Apply some dark magic here, treat struct as array of void* pointers since its a contract for struct types to consist only of pointers.
        const allocatedAsArray = this.generator.builder.createBitCast(allocated, arrayType.getPointer());

        const elementPtr = this.generator.builder.createInBoundsGEP(allocatedAsArray, [nullIndex, runtimeIndex]);

        if (!initializer.type.isPointer()) {
          throw new Error(`Expected initializer to be of pointer type, got '${initializer.type.toString()}'`);
        }

        // If initializer is not casted to void* previously, do it right here.
        if (!initializer.type.getPointerElementType().isIntegerType(8)) {
          initializer = this.generator.builder.createBitCast(
            initializer,
            LLVMType.getInt8Type(this.generator).getPointer()
          );
        }

        this.generator.builder.createSafeStore(initializer, elementPtr);
      } else {
        const activeIndex = this.indexOfType(initializer.type);
        if (activeIndex === -1) {
          throw new Error(`Cannot find type '${initializer.type.toString()}' in union type '${this.type.toString()}'`);
        }

        if (this.type.isOptionalUnion()) {
          const isNullOrUndefinedNow = activeIndex === 0;
          const markerIntValue = isNullOrUndefinedNow
            ? LLVMConstantInt.getFalse(this.generator)
            : LLVMConstantInt.getTrue(this.generator);
          const markerValue = this.generator.builtinBoolean.create(markerIntValue);

          if (isNullOrUndefinedNow) {
            initializer = markerValue;
          } else {
            const markerPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, 0]);
            this.generator.builder.createSafeStore(markerValue, markerPtr);
          }
        }

        const elementPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, activeIndex]);
        this.generator.builder.createSafeStore(initializer, elementPtr);
      }
    }

    return allocated;
  }

  extract(type: LLVMType) {
    const unionStructType = this.type.unwrapPointer() as LLVMStructType;
    const destinationValueType = type.unwrapPointer();

    if (unionStructType.isSameStructs(destinationValueType)) {
      return this;
    }

    if (
      destinationValueType.isStructType() &&
      !type.isTSClass() &&
      !type.isString() &&
      !type.isTSNumber() &&
      !type.isTSBoolean()
    ) {
      const unionMeta = this.generator.meta.getUnionMeta(unionStructType.name!);
      const objectMeta = this.generator.meta.getObjectMeta((destinationValueType as LLVMStructType).name!);

      const allocated = this.generator.gc.allocate(destinationValueType);

      for (let i = 0; i < objectMeta.props.length; ++i) {
        const sourceIndex = unionMeta.propsMap.get(objectMeta.props[i]);
        if (!sourceIndex) {
          throw new Error(`Mapping not found for '${objectMeta.props[i]}'`);
        }

        const destinationPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, i]);
        const valuePtr = this.generator.builder.createSafeInBoundsGEP(this, [0, sourceIndex]);

        this.generator.builder.createSafeStore(this.generator.builder.createLoad(valuePtr), destinationPtr);
      }

      return allocated;
    }

    const index = this.indexOfType(type);

    if (index === -1) {
      throw new Error(`Cannot find type '${type.toString()}' in union type '${unionStructType.toString()}'`);
    }

    return this.generator.builder.createLoad(this.generator.builder.createSafeInBoundsGEP(this, [0, index]));
  }
}

export class LLVMGlobalVariable extends LLVMValue {
  protected constructor(
    generator: LLVMGenerator,
    type: LLVMType,
    constant: boolean,
    initializer?: LLVMValue,
    name?: string
  ) {
    const value = new llvm.GlobalVariable(
      generator.module,
      type.unwrapped,
      constant,
      llvm.LinkageTypes.ExternalLinkage,
      initializer?.unwrapped as llvm.Constant,
      name
    );

    super(value, generator);
  }

  static make(generator: LLVMGenerator, type: LLVMType, constant: boolean, initializer?: LLVMValue, name?: string) {
    return new LLVMGlobalVariable(generator, type, constant, initializer, name);
  }
}

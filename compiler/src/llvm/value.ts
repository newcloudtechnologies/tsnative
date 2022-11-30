/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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
import { LLVMStructType, LLVMType } from "./type";
import { OperationFlags } from "../tsbuiltins";

export enum MathFlags {
  Inplace = 1,
}

export class LLVMValue {
  protected value: llvm.Value;
  readonly generator: LLVMGenerator;

  protected constructor(value: llvm.Value, generator: LLVMGenerator) {
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

  get address() {
    return this.value.address();
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

    if (value.type.isPointer() && type.isPointer() && this.isInt8PtrType(type)) {
      value = this.generator.builder.createBitCast(value, type);
    }

    if (value.type.equals(type)) {
      return value;
    }

    if (value.type.isTSNumber() && type.isIntegerType()) {
      return value.asLLVMInteger();
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
          value = this.generator.ts.union.create(value);
        }

        if (value.type.equals(type)) {
          return value;
        }
      }

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

    const pointerElementType = this.derefToPtrLevel1().type.getPointerElementType();
    return pointerElementType.isString() || pointerElementType.isTSNumber() || pointerElementType.isTSBoolean();
  }

  makeBoolean(): LLVMValue {
    if (this.type.isTSBoolean()) {
      return this;
    }

    const thisPtr = this.derefToPtrLevel1();
    if (this.type.isTSNumber()) {
      const toBoolFn = this.generator.builtinNumber.createBooleanFn("toBool", OperationFlags.Unary);
      return this.generator.builder.createSafeCall(toBoolFn, [this.generator.builder.asVoidStar(thisPtr)]);
    }

    if (this.type.isString()) {
      const lengthGetter = this.generator.ts.str.getLLVMLength();
      const length = this.generator.builder.createSafeCall(lengthGetter, [this.generator.builder.asVoidStar(thisPtr)]);

      const toBoolFn = this.generator.builtinNumber.createBooleanFn("toBool", OperationFlags.Unary);
      return this.generator.builder.createSafeCall(toBoolFn, [this.generator.builder.asVoidStar(length)]);
    }

    if (this.type.isUnion()) {
      return this.generator.ts.union.toBool(thisPtr);
    }

    if (this.type.isUndefined() || this.type.isNull()) {
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
    let value = this as LLVMValue;

    if (!value.type.isPointer()) {
      throw new Error(`Assignment destination expected to be of PointerType, got '${value.type.toString()}'`);
    }
    if (!other.type.isPointer()) {
      throw new Error(`Source value expected to be of PointerType, got '${other.type.toString()}'`);
    }

    // mkrv @todo: what if 'value' includes 'other' union type huh?
    if (value.type.isUnion() && !other.type.isUnion()) {
      this.generator.ts.union.set(value, other);
      return value;
    }
    const isSame = value.type.getPointerElementType() === other.type.getPointerElementType();
    const int8PtrTy = LLVMType.getInt8Type(this.generator).getPointer();

    if (!isSame) {
      if (other.type.equals(int8PtrTy)) {
        other = this.generator.builder.createBitCast(other, value.type);
      } else if (value.type.equals(int8PtrTy)) {
        value = this.generator.builder.createBitCast(value, other.type);
      }
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
      return this.createUnaryNumberOperation("negate");
    } else if (this.type.isTSBoolean()) {
      const thisPtr = this.derefToPtrLevel1();
      const fn = this.generator.builtinBoolean.getNegateFn();
      return this.generator.builder.createSafeCall(fn, [thisPtr]);
    } else if (this.type.isUndefined() || this.type.isNull()) {
      return this.generator.builtinBoolean.create(LLVMConstantInt.getTrue(this.generator));
    }

    throw new Error(`Unhandled type '${this.type.toString()}' in LLVMValue.createNegate`);
  }

  createPrefixIncrement(): LLVMValue {
    return this.createUnaryNumberOperation("prefixIncrement");
  }

  createPostfixIncrement(): LLVMValue {
    return this.createUnaryNumberOperation("postfixIncrement");
  }

  createPrefixDecrement(): LLVMValue {
    return this.createUnaryNumberOperation("prefixDecrement");
  }

  createPostfixDecrement(): LLVMValue {
    return this.createUnaryNumberOperation("postfixDecrement");
  }

  private createUnaryNumberOperation(name: string) {
      // @todo: check type
      const thisPtr = this.derefToPtrLevel1();
      const fn = this.generator.builtinNumber.createMathFn(name, OperationFlags.Unary);
      const thisUntyped = this.generator.builder.asVoidStar(thisPtr);
      return this.generator.builder.createSafeCall(fn, [thisUntyped]);
  }

  createAdd(other: LLVMValue, flags?: MathFlags): LLVMValue {
    // operand type is intentionally not checked
    if (this.type.isString()) {
      // mkrv @todo: handle inPlace flag correcty
      const concat = this.generator.ts.str.getLLVMConcat();

      const operand1 = this.derefToPtrLevel1();
      const operand2 = other.derefToPtrLevel1();
      const untypedOp1 = this.generator.builder.asVoidStar(operand1);
      const untypedOp2 = this.generator.builder.asVoidStar(operand2);

      const result = this.generator.builder.createSafeCall(concat, [untypedOp1, untypedOp2]);
      if (flags === MathFlags.Inplace) {
        return this.makeAssignment(result);
      }

      return result;
    }
    else if (this.type.isTSNumber()) {
      return this.createNumberArithmeticOperation(other, "add", flags);
    }

    throw new Error(`Invalid operand types to binary plus: '${this.type.toString()}' '${other.type.toString()}'`);
  }

  createSub(other: LLVMValue, flags?: MathFlags): LLVMValue {
    return this.createNumberArithmeticOperation(other, "sub", flags);
  }

  createMul(other: LLVMValue, flags?: MathFlags): LLVMValue {
    return this.createNumberArithmeticOperation(other, "mul", flags);
  }

  createDiv(other: LLVMValue, flags?: MathFlags): LLVMValue {
    return this.createNumberArithmeticOperation(other, "div", flags);
  }

  createMod(other: LLVMValue, flags?: MathFlags): LLVMValue {
    return this.createNumberArithmeticOperation(other, "mod", flags);
  }

  createBitwiseAnd(other: LLVMValue, flags?: MathFlags): LLVMValue {
    return this.createNumberArithmeticOperation(other, "bitwiseAnd", flags);
  }

  createBitwiseOr(other: LLVMValue, flags?: MathFlags): LLVMValue {
    return this.createNumberArithmeticOperation(other, "bitwiseOr", flags);
  }

  createBitwiseXor(other: LLVMValue, flags?: MathFlags): LLVMValue {
    return this.createNumberArithmeticOperation(other, "bitwiseXor", flags);
  }

  createBitwiseLeftShift(other: LLVMValue, flags?: MathFlags): LLVMValue {
    return this.createNumberArithmeticOperation(other, "bitwiseLeftShift", flags);
  }

  createBitwiseRightShift(other: LLVMValue, flags?: MathFlags): LLVMValue {
    return this.createNumberArithmeticOperation(other, "bitwiseRightShift", flags);
  }

  private createNumberArithmeticOperation(other: LLVMValue, name: string, flags?: MathFlags) : LLVMValue {
    if (this.type.isTSNumber() && other.type.isTSNumber()) {
      const lhs = this.derefToPtrLevel1();
      const rhs = other.derefToPtrLevel1();

      const fnName = name + (flags === MathFlags.Inplace ? "Inplace" : "");
      const fn = this.generator.builtinNumber.createMathFn(fnName);
      const lhsUntyped = this.generator.builder.asVoidStar(lhs);
      return this.generator.builder.createSafeCall(fn, [lhsUntyped, rhs]);
    }

    throw new Error(
      `Invalid operand types to ${name}: '${this.type.toString()}' '${other.type.toString()}'`
    );
  }

  createEquals(other: LLVMValue): LLVMValue {
    const thisPtr = this.derefToPtrLevel1();
    const otherPtr = other.derefToPtrLevel1();
    const thisType = thisPtr.type;
    const otherType = otherPtr.type;

    if (thisType.isUnion()) {
      let extracted = this.generator.ts.union.get(thisPtr);
      extracted = this.generator.builder.createBitCast(extracted, otherType);
      return extracted.createEquals(otherPtr);
    } else if (otherType.isUnion()) {
      let extracted = this.generator.ts.union.get(otherPtr);
      extracted = this.generator.builder.createBitCast(extracted, thisType);
      return this.createEquals(extracted);
    }

    return this.generator.ts.obj.equals(thisPtr, otherPtr);
  }

  createNotEquals(other: LLVMValue): LLVMValue {
    return this.createEquals(other).createNegate();
  }

  createLessThan(other: LLVMValue): LLVMValue {
    return this.createComparisonOperation(other, "lessThan");
  }

  createLessThanEquals(other: LLVMValue): LLVMValue {
    return this.createComparisonOperation(other, "lessEqualsThan");
  }

  createGreaterThan(other: LLVMValue): LLVMValue {
    return this.createComparisonOperation(other, "greaterThan");
  }

  createGreaterThanEquals(other: LLVMValue): LLVMValue {
    return this.createComparisonOperation(other, "greaterEqualsThan");
  }

  private createComparisonOperation(other: LLVMValue, name: string): LLVMValue {
      // operand type is intentionally not checked
      if (this.type.isTSNumber()) {
        const lhs = this.derefToPtrLevel1();
        const rhs = other.derefToPtrLevel1();
        const fn = this.generator.builtinNumber.createBooleanFn(name);
        const lhsUntyped = this.generator.builder.asVoidStar(lhs);
        return this.generator.builder.createSafeCall(fn, [lhsUntyped, rhs]);
      }
  
      throw new Error(`Invalid operand types to ${name} than: 
                              lhs: ${this.type.toString()} ${this.type.typeIDName}
                              rhs: ${other.type.toString()} ${other.type.typeIDName}`);
  }

  clone(): LLVMValue {
    if (this.type.isTSNumber()) {
      return this.generator.builtinNumber.clone(this);
    } else if (this.type.isString()) {
      return this.generator.ts.str.clone(this);
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

  private isInt8PtrType(type: LLVMType) {
    while(type.getPointerLevel() != 1) {
      type = type.getPointerElementType();
    }

    return type.getPointerElementType().isIntegerType(8);
  }

  derefToPtrLevelN(n: number) {
    if (this.type.getPointerLevel() <= n) {
      return this;
    }

    let result = this.generator.builder.createLoad(this);
    while(result.type.getPointerLevel() !== n) {
      result = this.generator.builder.createLoad(result);
    }
    return result;
  }

  derefToPtrLevel1() {
    return this.derefToPtrLevelN(1);
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

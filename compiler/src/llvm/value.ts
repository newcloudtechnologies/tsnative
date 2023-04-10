/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
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

    return this.generator.ts.obj.toBool(this);
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

    if (other.type.getPointerLevel() !== 1) {
      throw new Error(`Assignment source expected to be of pointer type, got: '${value.type.toString()}'`);
    }

    if (value.type.getPointerLevel() !== 2) {
      throw new Error(`Assignment destination expected to be of pointer-to-pointer type, got: '${value.type.toString()}'`);
    }

    if (other.isTSPrimitivePtr()) {
      other = other.clone();
    }
    else if (other.type.isUnion() && !value.type.getPointerElementType().isUnion()) {
      other = this.generator.ts.union.get(other);
      other = this.generator.builder.createBitCast(other, value.type.getPointerElementType());
    }

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
      return this.generator.builtinBoolean.createHeap(LLVMConstantInt.getTrue(this.generator));
    }
    else if (this.type.isString()) {
      return this.generator.ts.str.createNegate(this);
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
    if (this.type.isString() || other.type.isString()) {
      // mkrv @todo: handle inPlace flag correcty

      let operand1 = this.derefToPtrLevel1();
      let operand2 = other.derefToPtrLevel1();

      // coerse types to string
      if (!operand1.type.isString()) {
        operand1 = this.generator.ts.obj.objectToString(operand1);
      }
      else if (!operand2.type.isString()) {
        operand2 = this.generator.ts.obj.objectToString(operand2);
      }

      const untypedOp1 = this.generator.builder.asVoidStar(operand1);
      const untypedOp2 = this.generator.builder.asVoidStar(operand2);

      const result = this.generator.ts.str.createConcat(untypedOp1, untypedOp2);
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
    let thisPtr = this.derefToPtrLevel1();
    let otherPtr = other.derefToPtrLevel1();

    if (thisPtr.type.isUnion()) {
      thisPtr = this.generator.ts.union.get(thisPtr);
    }

    if (otherPtr.type.isUnion()) {
      otherPtr = this.generator.ts.union.get(otherPtr);
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

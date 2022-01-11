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
import * as ts from "typescript";
import { LLVMArrayType, LLVMStructType, LLVMType } from "./type";
import { Prototype } from "../scope";

export enum Conversion {
  Narrowing,
  Promotion,
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
    if (value.type.equals(type) || value.type.isConvertibleTo(type)) {
      return value;
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
    return pointerElementType.isString() || pointerElementType.isCppPrimitiveType();
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
    const value = this.getValue();

    if (value.type.isDoubleType()) {
      return this.generator.builder.createFCmpONE(value, LLVMConstant.createNullValue(value.type, this.generator));
    }

    if (value.type.isIntegerType()) {
      return this.generator.builder.createICmpNE(value, LLVMConstant.createNullValue(value.type, this.generator));
    }

    if (value.type.isString()) {
      const lengthGetter = this.generator.builtinString.getLLVMLength();
      const length = this.generator.builder.createSafeCall(lengthGetter, [this.generator.builder.asVoidStar(value)]);
      return this.generator.builder.createFCmpONE(length, LLVMConstant.createNullValue(length.type, this.generator));
    }

    if (value.isUnion()) {
      if (value.type.isOptionalUnion()) {
        let marker = this.generator.builder.createSafeExtractValue(value, [0]);
        marker = this.generator.builder.createLoad(marker);
        return this.generator.builder.createICmpNE(marker, LLVMConstantInt.get(this.generator, -1, 8));
      }

      return LLVMConstantInt.getTrue(this.generator);
    }

    if (value.type.isClosure()) {
      return LLVMConstantInt.getTrue(this.generator);
    }

    if (value.type.isPointer()) {
      return LLVMConstantInt.getTrue(this.generator);
    }

    throw new Error(`Unable to convert operand of type ${value.type.toString()} to boolean value`);
  }

  castFPToIntegralType(target: LLVMType, signed: boolean): LLVMValue {
    return signed
      ? this.generator.builder.createFPToSI(this, target)
      : this.generator.builder.createFPToUI(this, target);
  }

  promoteIntegralToFP(target: LLVMType, signed: boolean): LLVMValue {
    if (this.type.isDoubleType()) {
      return this;
    }

    return signed
      ? this.generator.builder.createSIToFP(this, target)
      : this.generator.builder.createUIToFP(this, target);
  }

  canPerformNumericOperation() {
    return this.type.isIntegerType() || this.type.isDoubleType();
  }

  makeAssignment(other: LLVMValue): LLVMValue {
    const value = this as LLVMValue;

    if (!value.type.isPointer()) {
      throw new Error(`Assignment destination expected to be of PointerType, got '${value.type.toString()}'`);
    }

    const typename = value.type.unwrapPointer().getIntegralLLVMTypeTypename();
    if (typename) {
      other = other.adjustToIntegralType(typename);
    } else if (value.isUnion()) {
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

  /* tslint:disable:object-literal-sort-keys */
  private readonly integralAdjust: {
    [type: string]: {
      isSigned: boolean;
      typeGetter: (_: LLVMGenerator) => LLVMType;
    };
  } = {
    int8_t: {
      isSigned: true,
      typeGetter: LLVMType.getInt8Type,
    },
    int16_t: {
      isSigned: true,
      typeGetter: LLVMType.getInt16Type,
    },
    int32_t: {
      isSigned: true,
      typeGetter: LLVMType.getInt32Type,
    },
    int64_t: {
      isSigned: true,
      typeGetter: LLVMType.getInt64Type,
    },
    uint8_t: {
      isSigned: false,
      typeGetter: LLVMType.getInt8Type,
    },
    uint16_t: {
      isSigned: false,
      typeGetter: LLVMType.getInt16Type,
    },
    uint32_t: {
      isSigned: false,
      typeGetter: LLVMType.getInt32Type,
    },
    uint64_t: {
      isSigned: false,
      typeGetter: LLVMType.getInt64Type,
    },
  };
  /* tslint:enable:object-literal-sort-keys */

  adjustToIntegralType(typename: string): LLVMValue {
    let value = this as LLVMValue;
    const loaded = this.generator.createLoadIfNecessary(this);
    if (!loaded.type.isIntegerType()) {
      const adjustParameters = this.integralAdjust[typename];
      const typeGetter = adjustParameters.typeGetter(this.generator);

      value = adjustParameters.isSigned
        ? this.generator.builder.createFPToSI(loaded, typeGetter)
        : this.generator.builder.createFPToUI(loaded, typeGetter);

      // @todo: how to avoid extra allocation?
      const allocated = this.generator.gc.allocate(value.type);
      value = allocated.makeAssignment(value);
    }

    return value;
  }

  // @todo: refactor this
  handleBinaryWithConversion(
    lhsExpression: ts.Expression,
    rhsExpression: ts.Expression,
    rhsValue: LLVMValue,
    conversion: Conversion,
    handler: (l: LLVMValue, r: LLVMValue) => LLVMValue
  ): LLVMValue {
    const convertor =
      conversion === Conversion.Narrowing
        ? LLVMValue.prototype.castFPToIntegralType
        : LLVMValue.prototype.promoteIntegralToFP;

    if (this.type.isIntegerType() && rhsValue.type.isDoubleType()) {
      const lhsTsType = this.generator.ts.checker.getTypeAtLocation(lhsExpression);
      const signed = lhsTsType.isSigned();
      const destinationType = conversion === Conversion.Narrowing ? this.type : rhsValue.type;
      let convertedArg = conversion === Conversion.Narrowing ? rhsValue : this;
      const untouchedArg = conversion === Conversion.Narrowing ? this : rhsValue;
      convertedArg = convertor.call(convertedArg, destinationType, signed);
      const args: [LLVMValue, LLVMValue] =
        conversion === Conversion.Narrowing ? [untouchedArg, convertedArg] : [convertedArg, untouchedArg];
      return handler.apply(this.generator.builder, args);
    }

    if (this.type.isDoubleType() && rhsValue.type.isIntegerType()) {
      const rhsTsType = this.generator.ts.checker.getTypeAtLocation(rhsExpression);
      const signed = rhsTsType.isSigned();
      const destinationType = conversion === Conversion.Narrowing ? rhsValue.type : this.type;
      let convertedArg = conversion === Conversion.Narrowing ? this : rhsValue;
      const untouchedArg = conversion === Conversion.Narrowing ? rhsValue : this;
      convertedArg = convertor.call(convertedArg, destinationType, signed);
      const args: [LLVMValue, LLVMValue] =
        conversion === Conversion.Narrowing ? [convertedArg, untouchedArg] : [untouchedArg, convertedArg];
      return handler.apply(this.generator.builder, args);
    }

    throw new Error("Invalid types to handle with conversion");
  }

  createHeapAllocated(): LLVMValue {
    if (this.type.isPointer()) {
      throw new Error("Expected value to be not of PointerType");
    }

    const allocated = this.generator.gc.allocate(this.type);
    this.generator.builder.createSafeStore(this, allocated);
    return allocated;
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
    if (type.isCppPrimitiveType()) {
      type = type.getPointer();
    }

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
    // this kind of types is represented as LLVM's { i8*, T* }
    // first element is considered as a marker. value of '-1' in it signals that T is not stored in this union
    // '8' is for the bitwidth
    const markerValue = LLVMConstantInt.get(this.generator, -1, 8);
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
        if (runtimeIndex.type.isDoubleType()) {
          runtimeIndex = this.generator.builder.createFPToSI(runtimeIndex, LLVMType.getInt32Type(this.generator));
        }

        if (!runtimeIndex.type.isIntegerType(32)) {
          throw new Error(`Expected runtime index to be of int32/double type, got '${runtimeIndex.type.toString()}'`);
        }

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
          const allocatedMarker = this.generator.gc.allocate(LLVMType.getInt8Type(this.generator));
          const markerNumericValue = isNullOrUndefinedNow ? -1 : 0;
          const markerValue = LLVMConstantInt.get(this.generator, markerNumericValue, 8);
          this.generator.builder.createSafeStore(markerValue, allocatedMarker);

          if (isNullOrUndefinedNow) {
            initializer = allocatedMarker;
          } else {
            const markerPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, 0]);
            this.generator.builder.createSafeStore(allocatedMarker, markerPtr);
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

    if (destinationValueType.isStructType() && !type.isTSClass() && !type.isString()) {
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

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

import * as ts from "typescript";

import { LLVMGenerator } from "@generator";
import { error } from "@utils";
import { Type } from "../ts/type";
import { flatten } from "lodash";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMConstant, LLVMValue } from "../llvm/value";

export class Intersection {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  private getLLVMTypename(type: LLVMType) {
    return type.toString().replace(/%|\*/g, "");
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

  isTSIntersection(type: ts.Type): type is ts.IntersectionType {
    return type.isIntersection();
  }

  isLLVMIntersection(type: LLVMType): boolean {
    const nakedType = type.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.getName()?.endsWith(".intersection"));
  }

  getSubtypesNames(type: LLVMType) {
    return type
      .toString()
      .split(".")
      .slice(0, -1)
      .map((typeName) => typeName.replace(/%|\*/g, ""));
  }

  private getTypeProperties(type: Type): { type: LLVMType; name: string }[] {
    return flatten(
      type.types.map((t) => {
        if (t.isIntersection()) {
          return this.getTypeProperties(t);
        }

        return t.getProperties().map((property) => {
          const declaration = property.declarations[0];
          const tsType = this.generator.ts.checker.getTypeAtLocation(declaration);
          const llvmType = tsType.getLLVMType();
          const valueType = declaration.decorators?.some((decorator) => decorator.getText() === "@ValueType");
          return { type: valueType ? llvmType.unwrapPointer() : llvmType, name: property.name };
        });
      })
    );
  }

  getStructType(type: Type) {
    const intersectionName = type.toString();
    const existing = this.generator.module.getTypeByName(intersectionName);
    if (existing) {
      return LLVMType.make(existing, this.generator);
    }

    const elements = this.getTypeProperties(type);

    if (elements.length === 0) {
      // So unlikely but have to be checked.
      error(`Intersection '${intersectionName}' has no elements.`);
    }

    const intersection = LLVMStructType.create(this.generator, intersectionName);
    intersection.setBody(elements.map((element) => element.type));

    this.generator.meta.registerIntersectionMeta(
      intersectionName,
      intersection,
      elements.map((element) => element.name.toString())
    );

    return intersection;
  }

  initialize(destinationType: LLVMType, initializer: LLVMValue) {
    if (!destinationType.isPointer()) {
      error(`Expected pointer type, got '${destinationType.toString()}'`);
    }

    if (destinationType.equals(initializer.type)) {
      return initializer;
    }

    if (!destinationType.getPointerElementType().isStructType()) {
      error(`Expected destination to be of StructType, got ${destinationType.getPointerElementType().toString()}`);
    }

    if (!initializer.type.isPointerToStruct()) {
      error(`Expected initializer to be a pointer to struct, got ${initializer.type.toString()}`);
    }

    if (this.isLLVMIntersection(initializer.type)) {
      return this.extract(initializer, destinationType);
    }

    initializer = this.generator.builder.createLoad(initializer);
    const initializerStructType = initializer.type as LLVMStructType;

    if (initializerStructType.numElements !== (destinationType.getPointerElementType() as LLVMStructType).numElements) {
      error(
        `Types mismatch: destination type: '${destinationType
          .getPointerElementType()
          .toString()}', initializer: '${initializer.type.toString()}'`
      );
    }

    let intersection = LLVMConstant.createNullValue(destinationType.getPointerElementType(), this.generator);

    for (let i = 0; i < initializerStructType.numElements; ++i) {
      const value = this.generator.builder.createSafeExtractValue(initializer, [i]);
      intersection = this.generator.builder.createSafeInsert(intersection, value, [i]) as LLVMConstant;
    }

    const allocated = this.generator.gc.allocate(intersection.type);
    this.generator.builder.createSafeStore(intersection, allocated);
    return allocated;
  }

  extract(intersection: LLVMValue, destinationType: LLVMType) {
    if (!intersection.type.isPointer()) {
      error(`Expected intersection to be of PointerType, got '${intersection.type.toString()}'`);
    }

    if (!intersection.type.getPointerElementType().isStructType()) {
      error(
        `Expected intersection element to be of StructType, got '${intersection.type
          .getPointerElementType()
          .toString()}'`
      );
    }

    const intersectionStructType = intersection.type.unwrapPointer() as LLVMStructType;
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
      const intersectionTypeNames = this.getSubtypesNames(intersectionStructType);
      const dest = this.getLLVMTypename(destinationType);
      startIndex = intersectionTypeNames.indexOf(dest);

      if (startIndex === -1) {
        error(`Cannot find types intersection '${intersectionStructType.toString()}' '${destinationType.toString()}'`);
      }
    }

    let result = LLVMConstant.createNullValue(destinationStructType, this.generator);

    const intersectionValue = intersection.getValue();
    for (let i = startIndex, k = 0; i < startIndex + destinationStructType.numElements; ++i, ++k) {
      const value = this.generator.builder.createSafeExtractValue(intersectionValue, [i]);
      result = this.generator.builder.createSafeInsert(result, value, [k]) as LLVMConstant;
    }

    const allocation = this.generator.gc.allocate(destinationStructType);
    this.generator.builder.createSafeStore(result, allocation);

    return allocation;
  }
}

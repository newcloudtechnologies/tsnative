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
import * as ts from "typescript";

import { LLVMGenerator } from "@generator";
import { checkIfLLVMString, error, flatten, getLLVMValue, unwrapPointerType } from "@utils";
import { Type } from "../ts/type";

export class Intersection {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  private getLLVMTypename(type: llvm.Type) {
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

  isLLVMIntersection(type: llvm.Type): boolean {
    const nakedType = unwrapPointerType(type);
    return Boolean(nakedType.isStructTy() && nakedType.name?.endsWith(".intersection"));
  }

  getSubtypesNames(type: llvm.Type) {
    return type
      .toString()
      .split(".")
      .slice(0, -1)
      .map((typeName) => typeName.replace(/%|\*/g, ""));
  }

  private getTypeProperties(type: Type): { type: llvm.Type; name: string }[] {
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
          return { type: valueType ? unwrapPointerType(llvmType) : llvmType, name: property.name };
        });
      })
    );
  }

  getStructType(type: Type) {
    const { context, module } = this.generator;

    const intersectionName = type.toString();
    let intersection = module.getTypeByName(intersectionName);
    if (intersection) {
      return intersection;
    }

    const elements = this.getTypeProperties(type);

    if (elements.length === 0) {
      // So unlikely but have to be checked.
      error(`Intersection '${intersectionName}' has no elements.`);
    }

    intersection = llvm.StructType.create(context, intersectionName);
    intersection.setBody(elements.map((element) => element.type));

    this.generator.meta.registerIntersectionMeta(
      intersectionName,
      intersection,
      elements.map((element) => element.name.toString())
    );

    return intersection;
  }

  initialize(destinationType: llvm.PointerType, initializer: llvm.Value) {
    if (destinationType.equals(initializer.type)) {
      return initializer;
    }

    if (!destinationType.elementType.isStructTy()) {
      error(`Expected destination to be of StructType, got ${destinationType.elementType.toString()}`);
    }

    if (!initializer.type.isPointerTy()) {
      error(`Expected initializer to be of PointerType, got ${initializer.type.toString()}`);
    }

    if (!initializer.type.elementType.isStructTy()) {
      error(`Expected initializer value to be of StructType, got ${initializer.type.elementType.toString()}`);
    }

    if (this.isLLVMIntersection(initializer.type)) {
      return this.extract(initializer, destinationType);
    }

    initializer = this.generator.builder.createLoad(initializer);
    const initializerStructType = initializer.type as llvm.StructType;

    if (initializerStructType.numElements !== destinationType.elementType.numElements) {
      error(
        `Types mismatch: destination type: '${destinationType.elementType.toString()}', initializer: '${initializer.type.toString()}'`
      );
    }

    let intersection = llvm.Constant.getNullValue(destinationType.elementType);

    for (let i = 0; i < initializerStructType.numElements; ++i) {
      const value = this.generator.xbuilder.createSafeExtractValue(initializer, [i]);
      intersection = this.generator.xbuilder.createSafeInsert(intersection, value, [i]) as llvm.Constant;
    }

    const allocated = this.generator.gc.allocate(intersection.type);
    this.generator.xbuilder.createSafeStore(intersection, allocated);
    return allocated;
  }

  extract(intersection: llvm.Value, destinationType: llvm.PointerType): llvm.Constant {
    if (!intersection.type.isPointerTy()) {
      error(`Expected intersection to be of PointerType, got '${intersection.type.toString()}'`);
    }

    if (!intersection.type.elementType.isStructTy()) {
      error(`Expected intersection element to be of StructType, got '${intersection.type.elementType.toString()}'`);
    }

    const intersectionStructType = unwrapPointerType(intersection.type) as llvm.StructType;
    const intersectionElementTypes = [];

    for (let i = 0; i < intersectionStructType.numElements; ++i) {
      intersectionElementTypes.push(intersectionStructType.getElementType(i));
    }

    const destinationElementTypes = [];
    const destinationStructType = destinationType.elementType as llvm.StructType;

    for (let i = 0; i < destinationStructType.numElements; ++i) {
      let type = destinationStructType.getElementType(i);
      if (!checkIfLLVMString(type)) {
        if (type.isPointerTy() && type.elementType.isStructTy()) {
          const elementTypes = [];
          for (let k = 0; k < type.elementType.numElements; ++k) {
            elementTypes.push(type.elementType.getElementType(k));
          }
          type = llvm.StructType.get(this.generator.context, elementTypes).getPointerTo();
        }
      }
      destinationElementTypes.push(type);
    }

    let startIndex = this.findIndexOfSubarray(
      intersectionElementTypes,
      destinationElementTypes,
      (lhs: llvm.Type, rhs: llvm.Type) => lhs.equals(rhs)
    );

    if (startIndex === -1) {
      const intersectionTypeNames = this.getSubtypesNames(intersectionStructType);
      const dest = this.getLLVMTypename(destinationType);
      startIndex = intersectionTypeNames.indexOf(dest);

      if (startIndex === -1) {
        error(`Cannot find types intersection '${intersectionStructType.toString()}' '${destinationType.toString()}'`);
      }
    }

    let result = llvm.Constant.getNullValue(destinationStructType);

    const intersectionValue = getLLVMValue(intersection, this.generator);
    for (let i = startIndex, k = 0; i < startIndex + destinationStructType.numElements; ++i, ++k) {
      const value = this.generator.xbuilder.createSafeExtractValue(intersectionValue, [i]);
      result = this.generator.xbuilder.createSafeInsert(result, value, [k]) as llvm.Constant;
    }

    const allocation = this.generator.gc.allocate(destinationStructType);
    this.generator.xbuilder.createSafeStore(result, allocation);

    return allocation as llvm.Constant;
  }
}

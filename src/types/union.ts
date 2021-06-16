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
import { LLVMConstant, LLVMConstantInt, LLVMValue } from "../llvm/value";

export class Union {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  private findIndexOfType(types: LLVMType[], type: LLVMType) {
    for (let i = 0; i < types.length; ++i) {
      if (types[i].equals(type)) {
        return i;
      }
    }
    return -1;
  }

  private getLLVMTypename(type: LLVMType) {
    return type.toString().replace(/%|\*/g, "");
  }

  private getTypeProperties(type: Type): ts.Symbol[] {
    return flatten(
      type.types.map((t) => {
        if (t.isUnion()) {
          return this.getTypeProperties(t);
        }
        return t.getProperties();
      })
    );
  }

  private getElementTypes(type: Type): LLVMType[] {
    return flatten(
      type.types.map((subtype) => {
        if (!subtype.isSymbolless() && ts.isInterfaceDeclaration(subtype.getSymbol().declarations[0])) {
          return subtype.getObjectPropsLLVMTypesNames().map((value) => value.type);
        }

        if (subtype.isUnion()) {
          return this.getElementTypes(subtype);
        }

        return [subtype.getLLVMType()];
      })
    );
  }

  isTSUnion(type: ts.Type): type is ts.UnionType {
    return type.isUnion() && (type.flags & ts.TypeFlags.BooleanLike) === 0;
  }

  isLLVMUnion(type: LLVMType): boolean {
    const nakedType = type.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.getName()?.endsWith(".union"));
  }

  isUnionWithUndefined(type: LLVMType): boolean {
    const nakedType = type.unwrapPointer();
    return Boolean(
      nakedType.isStructType() &&
        nakedType.getName()?.startsWith("undefined.") &&
        nakedType.getName()?.endsWith(".union")
    );
  }

  isUnionWithNull(type: LLVMType): boolean {
    const nakedType = type.unwrapPointer();
    return Boolean(
      nakedType.isStructType() && nakedType.getName()?.startsWith("null.") && nakedType.getName()?.endsWith(".union")
    );
  }

  getStructType(type: Type) {
    const unionName = type.toString();
    const knownUnionType = this.generator.module.getTypeByName(unionName);
    if (knownUnionType) {
      return LLVMType.make(knownUnionType, this.generator) as LLVMStructType;
    }

    const elements = this.getElementTypes(type);

    const unionType = LLVMStructType.create(this.generator, unionName);
    unionType.setBody(elements);

    const allProperties = this.getTypeProperties(type);
    const props = allProperties.map((property) => property.name);
    const propsMap = allProperties.reduce((acc, symbol, index) => {
      return acc.set(symbol.name, index);
    }, new Map<string, number>());

    this.generator.meta.registerUnionMeta(unionName, unionType, props, propsMap);
    return unionType;
  }

  initialize(type: LLVMType, initializer: LLVMValue) {
    if (!type.isPointer()) {
      error(`Expected pointer type, got '${type.toString()}'`);
    }

    if (type.equals(initializer.type)) {
      return initializer;
    }

    const unionStructType = type.unwrapPointer();
    if (!unionStructType.isStructType()) {
      error("Union expected to be of StructType");
    }

    const unionValue = LLVMConstant.createNullValue(unionStructType, this.generator);
    const allocated = this.generator.gc.allocate(unionStructType);
    this.generator.builder.createSafeStore(unionValue, allocated);

    if (
      !initializer.type.isString() &&
      !this.generator.types.closure.isOptionalTSClosure(unionValue) &&
      initializer.type.unwrapPointer().isStructType()
    ) {
      const propNames = [];

      // @todo: can initializer be an intersection?
      if (this.isLLVMUnion(initializer.type)) {
        // Try to handle initializer as union. Its props names are available through meta storage.
        const typename = this.getLLVMTypename(initializer.type);
        const unionMeta = this.generator.meta.getUnionMeta(typename);
        if (!unionMeta) {
          error(`Cannot find union meta for '${typename}'`);
        }
        propNames.push(...unionMeta.props);
      } else if (initializer.name) {
        // Try to handle initializer as a plain TS object. Its name is in format: %random__object__prop1.prop2.propN
        const objectProps = initializer.getTSObjectPropsFromName();
        propNames.push(...objectProps);
      } else {
        // Try to handle initializer as class/interface. Its props names are available through meta storage.
        const typename = this.getLLVMTypename(initializer.type);
        const structMeta = this.generator.meta.getStructMeta(typename);
        if (!structMeta) {
          error(`Cannot find struct meta for '${typename}'`);
        }
        propNames.push(...structMeta.props);
      }

      const unionName = unionStructType.getName();
      if (!unionName) {
        error("Name required for UnionStruct");
      }

      const unionMeta = this.generator.meta.getUnionMeta(unionName);

      const initializerValue = initializer.getValue();
      propNames.forEach((name, index) => {
        const destinationIndex = unionMeta.propsMap.get(name);
        if (typeof destinationIndex === "undefined") {
          error(`Mapping not found for property ${name}`);
        }

        const elementPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, destinationIndex]);
        this.generator.builder.createSafeStore(
          this.generator.builder.createSafeExtractValue(initializerValue, [index]),
          elementPtr
        );
      });
    } else {
      const elementTypes = [];

      for (let i = 0; i < unionStructType.numElements; ++i) {
        elementTypes.push(unionStructType.getElementType(i));
      }

      const activeIndex = this.findIndexOfType(elementTypes, initializer.type);
      if (activeIndex === -1) {
        error(`Cannot find type '${initializer.type.toString()}' in union type '${type.toString()}'`);
      }

      if ((this.isUnionWithUndefined(type) || this.isUnionWithNull(type)) && activeIndex === 0) {
        initializer = LLVMConstantInt.get(this.generator, -1, 8);
      }

      const elementPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, activeIndex]);
      this.generator.builder.createSafeStore(initializer, elementPtr);
    }

    return allocated;
  }

  extract(union: LLVMValue, type: LLVMType) {
    const unionStructType = union.type.unwrapPointer() as LLVMStructType;
    const destinationValueType = type.unwrapPointer();

    if (destinationValueType.isStructType() && !type.isString()) {
      const unionMeta = this.generator.meta.getUnionMeta(unionStructType.getName()!);
      const objectMeta = this.generator.meta.getObjectMeta((destinationValueType as LLVMStructType).getName()!);

      const allocated = this.generator.gc.allocate(destinationValueType);

      for (let i = 0; i < objectMeta.props.length; ++i) {
        const sourceIndex = unionMeta.propsMap.get(objectMeta.props[i]);
        if (!sourceIndex) {
          error(`Mapping not found for '${objectMeta.props[i]}'`);
        }

        const destinationPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, i]);
        const valuePtr = this.generator.builder.createSafeInBoundsGEP(union, [0, sourceIndex]);

        this.generator.builder.createSafeStore(this.generator.builder.createLoad(valuePtr), destinationPtr);
      }

      return allocated;
    }

    const elementTypes = [];
    for (let i = 0; i < unionStructType.numElements; ++i) {
      elementTypes.push(unionStructType.getElementType(i));
    }

    const activeIndex = this.findIndexOfType(elementTypes, type);

    if (activeIndex === -1) {
      error(`Cannot find type '${type.toString()}' in union type '${unionStructType.toString()}'`);
    }

    return this.generator.builder.createLoad(this.generator.builder.createSafeInBoundsGEP(union, [0, activeIndex]));
  }
}

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
import { checkIfLLVMString, error, flatten, getLLVMValue, getTSObjectPropsFromName, unwrapPointerType } from "@utils";
import { Type } from "../ts/type";

export class Union {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  private findIndexOfType(types: llvm.Type[], type: llvm.Type) {
    for (let i = 0; i < types.length; ++i) {
      if (types[i].equals(type)) {
        return i;
      }
    }
    return -1;
  }

  private getLLVMTypename(type: llvm.Type) {
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

  private getElementTypes(type: Type): llvm.Type[] {
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

  isLLVMUnion(type: llvm.Type): boolean {
    const nakedType = unwrapPointerType(type);
    return Boolean(nakedType.isStructTy() && nakedType.name?.endsWith(".union"));
  }

  isUnionWithUndefined(type: llvm.Type): boolean {
    const nakedType = unwrapPointerType(type);
    return Boolean(
      nakedType.isStructTy() && nakedType.name?.startsWith("undefined.") && nakedType.name?.endsWith(".union")
    );
  }

  isUnionWithNull(type: llvm.Type): boolean {
    const nakedType = unwrapPointerType(type);
    return Boolean(nakedType.isStructTy() && nakedType.name?.startsWith("null.") && nakedType.name?.endsWith(".union"));
  }

  getStructType(type: Type) {
    const unionName = type.toString();
    let unionType = this.generator.module.getTypeByName(unionName);
    if (unionType) {
      return unionType;
    }

    const elements = this.getElementTypes(type);

    unionType = llvm.StructType.create(this.generator.context, unionName);
    unionType.setBody(elements);

    const allProperties = this.getTypeProperties(type);
    const props = allProperties.map((property) => property.name);
    const propsMap = allProperties.reduce((acc, symbol, index) => {
      return acc.set(symbol.name, index);
    }, new Map<string, number>());

    this.generator.meta.registerUnionMeta(unionName, unionType, props, propsMap);
    return unionType;
  }

  initialize(type: llvm.PointerType, initializer: llvm.Value): llvm.Value {
    if (type.equals(initializer.type)) {
      return initializer;
    }

    const unionStructType = unwrapPointerType(type);
    if (!unionStructType.isStructTy()) {
      error("Union expected to be of StructType");
    }

    const unionValue = llvm.Constant.getNullValue(unionStructType);
    const allocated = this.generator.gc.allocate(unionStructType);
    this.generator.xbuilder.createSafeStore(unionValue, allocated);

    if (
      !checkIfLLVMString(initializer.type) &&
      !this.generator.types.closure.isOptionalTSClosure(unionValue) &&
      unwrapPointerType(initializer.type).isStructTy()
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
        const objectProps = getTSObjectPropsFromName(initializer.name);
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

      const unionName = unionStructType.name;
      if (!unionName) {
        error("Name required for UnionStruct");
      }

      const unionMeta = this.generator.meta.getUnionMeta(unionName);

      const initializerValue = getLLVMValue(initializer, this.generator);
      propNames.forEach((name, index) => {
        const destinationIndex = unionMeta.propsMap.get(name);
        if (typeof destinationIndex === "undefined") {
          error(`Mapping not found for property ${name}`);
        }

        const elementPtr = this.generator.xbuilder.createSafeInBoundsGEP(allocated, [0, destinationIndex]);
        this.generator.xbuilder.createSafeStore(
          this.generator.xbuilder.createSafeExtractValue(initializerValue, [index]),
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
        initializer = llvm.ConstantInt.get(this.generator.context, -1, 8);
      }

      const elementPtr = this.generator.xbuilder.createSafeInBoundsGEP(allocated, [0, activeIndex]);
      this.generator.xbuilder.createSafeStore(initializer, elementPtr);
    }

    return allocated;
  }

  extract(union: llvm.Value, type: llvm.PointerType): llvm.Constant {
    const unionStructType = unwrapPointerType(union.type) as llvm.StructType;
    const destinationValueType = unwrapPointerType(type);

    if (destinationValueType.isStructTy() && !checkIfLLVMString(type)) {
      const unionMeta = this.generator.meta.getUnionMeta(unionStructType.name!);
      const objectMeta = this.generator.meta.getObjectMeta((destinationValueType as llvm.StructType).name!);

      const allocated = this.generator.gc.allocate(destinationValueType);

      for (let i = 0; i < objectMeta.props.length; ++i) {
        const sourceIndex = unionMeta.propsMap.get(objectMeta.props[i]);
        if (!sourceIndex) {
          error(`Mapping not found for '${objectMeta.props[i]}'`);
        }

        const destinationPtr = this.generator.xbuilder.createSafeInBoundsGEP(allocated, [0, i]);
        const valuePtr = this.generator.xbuilder.createSafeInBoundsGEP(union, [0, sourceIndex]);

        this.generator.xbuilder.createSafeStore(this.generator.builder.createLoad(valuePtr), destinationPtr);
      }

      return allocated as llvm.Constant;
    }

    const elementTypes = [];
    for (let i = 0; i < unionStructType.numElements; ++i) {
      elementTypes.push(unionStructType.getElementType(i));
    }

    const activeIndex = this.findIndexOfType(elementTypes, type);

    if (activeIndex === -1) {
      error(`Cannot find type '${type.toString()}' in union type '${unionStructType.toString()}'`);
    }

    return this.generator.builder.createLoad(
      this.generator.xbuilder.createSafeInBoundsGEP(union, [0, activeIndex])
    ) as llvm.Constant;
  }
}

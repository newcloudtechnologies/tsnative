/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { getIntegralType, isCppIntegralType, SizeOf } from "@cpp";
import { LLVMGenerator } from "@generator";
import { TypeMangler } from "@mangling";
import {
  error,
  flatten,
  getProperties,
  checkIfFunction,
  checkIfObject,
  checkIfString,
  checkIfBoolean,
  checkIfNumber,
  checkIfVoid,
  checkIfUnion,
  findIndexOfSubarray,
  tryResolveGenericTypeIfNecessary,
  getAliasedSymbolIfNecessary,
  checkIfUndefined,
  checkIfNull,
  checkIfArray,
  InternalNames,
  checkIfHasVTable,
  checkIfUnaligned,
  checkIfNonPod,
  checkIfHasConstructor,
  checkIfHasInheritance,
  canCreateLazyClosure,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { isConvertible } from "@handlers";

export function createLLVMFunction(
  returnType: llvm.Type,
  parameterTypes: llvm.Type[],
  name: string,
  module: llvm.Module,
  linkage: llvm.LinkageTypes = llvm.LinkageTypes.ExternalLinkage
): { fn: llvm.Function; existing: boolean } {
  const fn = module.getFunction(name);
  if (fn) {
    if (!fn.type.elementType.returnType.equals(returnType)) {
      error(
        `Function '${name}' already exists with different return type: existing - '${fn.type.elementType.returnType.toString()}, requested - '${returnType.toString()}'`
      );
    }

    if (
      fn.getArguments().length !== parameterTypes.length ||
      fn.getArguments().some((arg, index) => !arg.type.equals(parameterTypes[index]))
    ) {
      error(
        `Function '${name}' already exists with different parameter types: existing - '${fn
          .getArguments()
          .map((arg) => arg.type.toString())
          .join(" ")}', requested - '${parameterTypes.map((type) => type.toString()).join(" ")}'`
      );
    }

    return { fn, existing: true };
  }

  const type = llvm.FunctionType.get(returnType, parameterTypes, false);
  return { fn: llvm.Function.create(type, linkage, name, module), existing: false };
}

export function checkIfLLVMString(type: llvm.Type) {
  const nakedType = unwrapPointerType(type);
  return nakedType.isStructTy() && nakedType.name === "string";
}

export function checkIfLLVMArray(type: llvm.Type) {
  const nakedType = unwrapPointerType(type);
  return Boolean(nakedType.isStructTy() && nakedType.name?.startsWith("Array__"));
}

export function getTypeSize(type: llvm.Type, module: llvm.Module): number {
  const size = SizeOf.getByLLVMType(type);
  if (size) {
    return size;
  }
  return module.dataLayout.getTypeStoreSize(type);
}

export function callerShouldAllocateSpace(llvmType: llvm.Type, tsType: ts.Type, generator: LLVMGenerator) {
  const FOUR_EIGHTBYTES = 32; // @todo: write platform-specific logic if this fails on win (use EIGHT_EIGHTBYTES = 64)
  const typeValueDeclaration = tsType.symbol?.valueDeclaration as ts.ClassDeclaration;
  return (
    getTypeSize(unwrapPointerType(llvmType), generator.module) >= FOUR_EIGHTBYTES ||
    (typeValueDeclaration &&
      (checkIfUnaligned(typeValueDeclaration) ||
        checkIfHasVTable(typeValueDeclaration) ||
        checkIfNonPod(typeValueDeclaration) ||
        (process.platform === "win32" &&
          (checkIfHasConstructor(typeValueDeclaration) || checkIfHasInheritance(typeValueDeclaration)))))
  );
}

export function isTypeDeclared(thisType: ts.Type, declaration: ts.Declaration, generator: LLVMGenerator): boolean {
  const mangledTypename: string = TypeMangler.mangle(thisType, generator.checker, declaration);
  return Boolean(generator.module.getTypeByName(mangledTypename));
}

export function isTypeSupported(type: ts.Type, checker: ts.TypeChecker): boolean {
  return (
    checkIfArray(type) ||
    checkIfBoolean(type) ||
    checkIfNumber(type) ||
    checkIfString(type, checker) ||
    checkIfObject(type) ||
    checkIfFunction(type) ||
    checkIfVoid(type) ||
    checkIfUndefined(type, checker) ||
    checkIfNull(type, checker) ||
    isCppIntegralType(checker.typeToString(type))
  );
}

export function getLLVMType(type: ts.Type, node: ts.Node, generator: LLVMGenerator): llvm.Type {
  const { context, checker } = generator;

  if (type.isIntersection()) {
    return getIntersectionStructType(type, node, generator).getPointerTo();
  }

  if (checkIfUnion(type)) {
    return getUnionStructType(type, node, generator).getPointerTo();
  }

  if (isCppIntegralType(checker.typeToString(type))) {
    return getIntegralType(type, generator)!;
  }

  if (Boolean(type.flags & ts.TypeFlags.Enum)) {
    return llvm.Type.getInt32PtrTy(context);
  }

  if (checkIfBoolean(type)) {
    return llvm.Type.getInt1PtrTy(context);
  }

  if (checkIfNumber(type)) {
    return llvm.Type.getDoublePtrTy(context);
  }

  if (checkIfString(type, generator.checker)) {
    return generator.builtinString.getLLVMType();
  }

  if (checkIfVoid(type)) {
    return llvm.Type.getVoidTy(context);
  }

  if (checkIfFunction(type)) {
    const symbol = type.symbol;
    if (!symbol) {
      error("Function symbol not found");
    }
    const declaration = symbol.declarations[0];
    if (!declaration) {
      error("Function declaration not found");
    }

    if (canCreateLazyClosure(declaration, generator)) {
      const signature = generator.checker.getSignatureFromDeclaration(declaration as ts.SignatureDeclaration);
      if (!signature) {
        error("Function signature not found");
      }

      const withFunargs = signature.parameters.some((parameter) => {
        const symbolType = generator.checker.getTypeOfSymbolAtLocation(parameter, declaration);
        return checkIfFunction(symbolType);
      });

      if (withFunargs) {
        return generator.lazyClosure.type;
      }
    }

    return generator.builtinTSClosure.getLLVMType();
  }

  if (checkIfUndefined(type, checker)) {
    return llvm.Type.getInt8Ty(context);
  }

  if (checkIfObject(type)) {
    return getStructType(type, node, generator).getPointerTo();
  }

  if (checkIfNull(type, checker)) {
    return llvm.Type.getInt8Ty(context);
  }

  error(`Unhandled type: '${checker.typeToString(type)}'`);
}

function getTypeName(type: ts.Type, checker: ts.TypeChecker): string {
  if (type.isUnionOrIntersection()) {
    return type.types.map((t) => getTypeName(t, checker)).join(".");
  }
  return checker.typeToString(type);
}

export function getUnionOrIntersectionName(type: ts.UnionOrIntersectionType, generator: LLVMGenerator) {
  return type.types
    .map((t) => tryResolveGenericTypeIfNecessary(t, generator))
    .map((t) => getTypeName(t, generator.checker))
    .join(".");
}

export function getIntersectionSubtypesNames(intersectionType: llvm.Type) {
  return intersectionType
    .toString()
    .split(".")
    .slice(0, -1)
    .map((typeName) => typeName.replace(/%|\*/g, ""));
}

export function getLLVMTypename(type: llvm.Type) {
  return type.toString().replace(/%|\*/g, "");
}

function getIntersectionTypeProperties(
  type: ts.IntersectionType,
  node: ts.Node,
  generator: LLVMGenerator
): { type: llvm.Type; name: string }[] {
  return flatten(
    type.types
      .map((t) => tryResolveGenericTypeIfNecessary(t, generator))
      .map((t) => {
        if (t.isIntersection()) {
          return getIntersectionTypeProperties(t, node, generator);
        }
        return getProperties(t, generator.checker).map((property) => {
          const tsType = generator.checker.getTypeOfSymbolAtLocation(property, node);
          const llvmType = getLLVMType(tsType, node, generator);
          const valueType = property.valueDeclaration.decorators?.some(
            (decorator) => decorator.getText() === "@ValueType"
          );
          return { type: valueType ? unwrapPointerType(llvmType) : llvmType, name: property.name };
        });
      })
  );
}

export function getIntersectionStructType(type: ts.IntersectionType, node: ts.Node, generator: LLVMGenerator) {
  const { context, module } = generator;

  const intersectionName = getUnionOrIntersectionName(type, generator).concat(".intersection");
  let intersection = module.getTypeByName(intersectionName);
  if (intersection) {
    return intersection;
  }

  const elements = getIntersectionTypeProperties(type, node, generator);

  if (elements.length === 0) {
    // So unlikely but have to be checked.
    error(`Intersection '${intersectionName}' has no elements.`);
  }

  intersection = llvm.StructType.create(context, intersectionName);
  intersection.setBody(elements.map((element) => element.type));

  generator.meta.registerIntersectionMeta(
    intersectionName,
    intersection,
    elements.map((element) => element.name.toString())
  );

  return intersection;
}

function getUnionTypeProperties(type: ts.UnionType, generator: LLVMGenerator): ts.Symbol[] {
  return flatten(
    type.types
      .map((t) => tryResolveGenericTypeIfNecessary(t, generator))
      .map((t) => {
        if (t.isUnion()) {
          return getUnionTypeProperties(t, generator);
        }
        return generator.checker.getPropertiesOfType(t);
      })
  );
}

function getUnionElementTypes(type: ts.UnionType, node: ts.Node, generator: LLVMGenerator): llvm.Type[] {
  return flatten(
    type.types
      .map((subtype) => tryResolveGenericTypeIfNecessary(subtype, generator))
      .map((subtype) => {
        if (subtype.getSymbol() && ts.isInterfaceDeclaration(subtype.symbol.declarations[0])) {
          return getObjectPropsLLVMTypesNames(subtype, node, generator).map((value) => value.type);
        }

        if (subtype.isUnion()) {
          return getUnionElementTypes(subtype, node, generator);
        }

        return [getLLVMType(subtype, node, generator)];
      })
  );
}

export function getUnionStructType(type: ts.UnionType, node: ts.Node, generator: LLVMGenerator) {
  const { context, module } = generator;

  const unionName = getUnionOrIntersectionName(type, generator).concat(".union");
  let unionType = module.getTypeByName(unionName);
  if (unionType) {
    return unionType;
  }

  const elements = getUnionElementTypes(type, node, generator);

  unionType = llvm.StructType.create(context, unionName);
  unionType.setBody(elements);

  const allProperties = getUnionTypeProperties(type, generator);
  const props = allProperties.map((property) => property.name);
  const propsMap = allProperties.reduce((acc, symbol, index) => {
    return acc.set(symbol.name, index);
  }, new Map<string, number>());

  generator.meta.registerUnionMeta(unionName, unionType, props, propsMap);
  return unionType;
}

export function getSyntheticBody(size: number, context: llvm.LLVMContext): llvm.IntegerType[] {
  const syntheticBody = [];
  while (size > 8) {
    // Consider int64_t is the widest available inttype.
    syntheticBody.push(llvm.Type.getIntNTy(context, 8 * 8));
    size -= 8;
  }

  if (size > 0) {
    console.assert((size & (size - 1)) === 0, `Expected 'size' reminder to be a power of two, got ${size}`);
    syntheticBody.push(llvm.Type.getIntNTy(context, size * 8));
  }

  return syntheticBody;
}

export function getEnvironmentType(types: llvm.Type[], generator: LLVMGenerator) {
  if (types.some((type) => !type.isPointerTy())) {
    error(
      `Expected all the types to be of PointerType, got:\n${types.map((type) => "  " + type.toString()).join(",\n")}`
    );
  }

  const environmentName =
    "env__(" +
    types.reduce((acc, curr) => {
      return acc + "_" + curr.toString().replace(/\"/g, "");
    }, "") +
    ")";

  let envType = generator.module.getTypeByName(environmentName);
  if (!envType) {
    envType = llvm.StructType.create(generator.context, environmentName);
    envType.setBody(types);
  }

  return envType;
}

export function isTSClosure(value: llvm.Value) {
  return isTSClosureType(value.type);
}

export function isOptionalTSClosure(value: llvm.Value, generator: LLVMGenerator) {
  const isOptionalUnion = isUnionWithNullLLVMValue(value) || isUnionWithUndefinedLLVMValue(value);
  if (!isOptionalUnion) {
    return false;
  }

  let structType: llvm.StructType;
  if (value.type.isPointerTy()) {
    structType = value.type.elementType as llvm.StructType;
  } else if (value.type.isStructTy()) {
    structType = value.type;
  } else {
    error("Unreachable");
  }

  // Optional functions expected to be unions of exactly two elements: marker and one closure pointer
  const isPair = structType.numElements === 2;
  const secondPairPtr = value.type.isPointerTy()
    ? generator.xbuilder.createSafeInBoundsGEP(value, [0, 1])
    : generator.xbuilder.createSafeExtractValue(value, [1]);
  return isPair && isTSClosureType(secondPairPtr.type);
}

export function isTSClosureType(type: llvm.Type) {
  const nakedType = unwrapPointerType(type);
  return Boolean(nakedType.isStructTy() && nakedType.name?.startsWith("TSClosure__class"));
}

export function getObjectPropsLLVMTypesNames(
  type: ts.Type,
  node: ts.Node,
  generator: LLVMGenerator
): { type: llvm.Type; name: string }[] {
  if (!type.symbol) {
    error("No symbol found");
  }

  if (type.isUnionOrIntersection()) {
    return flatten(
      type.types.map((subtype) => {
        return getObjectPropsLLVMTypesNames(subtype, node, generator);
      })
    ).filter((value, index, array) => array.findIndex((v) => v.name === value.name) === index);
  }

  const getTypeAndNameFromProperty = (property: ts.Symbol): { type: llvm.Type; name: string } => {
    const tsType = generator.checker.getTypeOfSymbolAtLocation(
      getAliasedSymbolIfNecessary(property, generator.checker),
      node
    );

    const llvmType = getLLVMType(tsType, node, generator);
    const valueType = property.valueDeclaration?.decorators?.some((decorator) => decorator.getText() === "@ValueType");

    return { type: valueType ? unwrapPointerType(llvmType) : llvmType, name: property.name };
  };

  const symbol = getAliasedSymbolIfNecessary(type.symbol, generator.checker);

  const properties: { type: llvm.Type; name: string }[] = [];
  if (
    symbol.valueDeclaration &&
    ts.isClassDeclaration(symbol.valueDeclaration) &&
    symbol.valueDeclaration.heritageClauses
  ) {
    const inheritedProps = flatten(
      symbol.valueDeclaration.heritageClauses.map((clause) => {
        const clauseProps = clause.types.map((expressionWithTypeArgs) => {
          return getProperties(generator.checker.getTypeAtLocation(expressionWithTypeArgs), generator.checker).map(
            getTypeAndNameFromProperty
          );
        });

        return flatten(clauseProps);
      })
    );

    properties.push(...inheritedProps);
  }

  properties.push(
    ...getProperties(type, generator.checker)
      .map(getTypeAndNameFromProperty)
      .filter((property) => !properties.find((p) => property.name === p.name))
  );

  return properties;
}

export function getStructType(type: ts.Type, node: ts.Node, generator: LLVMGenerator) {
  const { context, module, checker } = generator;

  const elements = getObjectPropsLLVMTypesNames(type, node, generator);

  let structType: llvm.StructType | null;
  const declaration =
    type.getSymbol()?.declarations.find(ts.isClassDeclaration) ||
    type.getSymbol()?.declarations.find(ts.isInterfaceDeclaration);

  if (declaration && (ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration))) {
    const name = ts.isClassDeclaration(declaration)
      ? TypeMangler.mangle(type, checker, declaration)
      : checker.typeToString(type);
    structType = module.getTypeByName(name);
    if (!structType) {
      structType = llvm.StructType.create(context, name);
      const props = getProperties(type, generator.checker).map((symbol) => symbol.name);
      generator.meta.registerObjectMeta(name, structType, props);

      const knownSize = SizeOf.getByName(name);
      if (knownSize) {
        const syntheticBody = getSyntheticBody(knownSize, context);
        structType.setBody(syntheticBody);
      } else {
        const structElements = elements.map((element) => element.type);
        if (ts.isClassDeclaration(declaration) && checkIfHasVTable(declaration)) {
          // vptr
          structElements.unshift(llvm.Type.getInt32Ty(generator.context).getPointerTo());
        }
        structType.setBody(structElements);
      }

      generator.meta.registerStructMeta(
        name,
        structType,
        elements.map((element) => element.name)
      );
    }
  } else {
    structType = llvm.StructType.get(
      context,
      elements.map((element) => element.type)
    );
  }

  return structType;
}

export function isIntersectionLLVMType(type: llvm.Type): boolean {
  const nakedType = unwrapPointerType(type);
  return Boolean(nakedType.isStructTy() && nakedType.name?.endsWith(".intersection"));
}

export function isUnionLLVMType(type: llvm.Type): boolean {
  const nakedType = unwrapPointerType(type);
  return Boolean(nakedType.isStructTy() && nakedType.name?.endsWith(".union"));
}

export function isUnionWithUndefinedLLVMType(type: llvm.Type): boolean {
  const nakedType = unwrapPointerType(type);
  return Boolean(
    nakedType.isStructTy() && nakedType.name?.startsWith("undefined.") && nakedType.name?.endsWith(".union")
  );
}

export function isUnionWithNullLLVMType(type: llvm.Type): boolean {
  const nakedType = unwrapPointerType(type);
  return Boolean(nakedType.isStructTy() && nakedType.name?.startsWith("null.") && nakedType.name?.endsWith(".union"));
}

export function isUnionLLVMValue(value: llvm.Value): boolean {
  return isUnionLLVMType(value.type);
}

export function isUnionWithUndefinedLLVMValue(value: llvm.Value): boolean {
  return isUnionWithUndefinedLLVMType(value.type);
}

export function isUnionWithNullLLVMValue(value: llvm.Value): boolean {
  return isUnionWithNullLLVMType(value.type);
}

export function isCppPrimitiveType(type: llvm.Type) {
  return type.isIntegerTy() || type.isDoubleTy();
}

export function correctCppPrimitiveType(type: llvm.Type) {
  if (type.isPointerTy() && isCppPrimitiveType(type.elementType)) {
    type = type.elementType;
  }

  return type;
}

export function adjustLLVMValueToType(value: llvm.Value, type: llvm.Type, generator: LLVMGenerator): llvm.Value {
  if (value.type.equals(type) || isConvertible(value.type, type)) {
    return value;
  } else {
    if (shouldLoad(value.type, type)) {
      value = generator.builder.createLoad(value);
      return adjustLLVMValueToType(value, type, generator);
    } else if (isSamePointerLevel(value.type, type)) {
      if (!value.type.equals(type)) {
        if (value.type.isPointerTy() && value.type.elementType.isIntegerTy(8)) {
          value = generator.builder.createBitCast(value, type);
        } else if (isSimilarStructs(value.type, type)) {
          if (!value.type.isPointerTy() && !type.isPointerTy()) {
            // allocate -> cast -> load
            const allocated = generator.gc.allocate(value.type);
            generator.xbuilder.createSafeStore(value, allocated);
            value = generator.builder.createBitCast(allocated, type.getPointerTo());
            value = generator.builder.createLoad(value);
          } else {
            value = generator.builder.createBitCast(value, type);
          }
        } else if (isUnionLLVMType(type)) {
          value = initializeUnion(type as llvm.PointerType, value, generator);
        } else if (isIntersectionLLVMType(type)) {
          value = initializeIntersection(type as llvm.PointerType, value, generator);
        } else if (isUnionLLVMType(value.type)) {
          value = extractFromUnion(value, type as llvm.PointerType, generator);
        } else if (isIntersectionLLVMType(value.type)) {
          value = extractFromIntersection(value, type as llvm.PointerType, generator);
        }

        if (value.type.equals(type)) {
          return value;
        }
      }

      error(`Cannot adjust '${value.type.toString()}' to '${type.toString()}'`);
    } else {
      const allocated = generator.gc.allocate(value.type);
      generator.xbuilder.createSafeStore(value, allocated);
      return adjustLLVMValueToType(allocated, type, generator);
    }
  }
}

export function getPointerLevel(type: llvm.Type) {
  let level = 0;
  while (type.isPointerTy()) {
    type = type.elementType;
    ++level;
  }
  return level;
}

function isSamePointerLevel(lhs: llvm.Type, rhs: llvm.Type) {
  return getPointerLevel(lhs) === getPointerLevel(rhs);
}

function shouldLoad(parameterType: llvm.Type, destinationType: llvm.Type) {
  return getPointerLevel(parameterType) > getPointerLevel(destinationType);
}

export function getLLVMValue(value: llvm.Value, generator: LLVMGenerator) {
  while (value.type.isPointerTy() && !checkIfLLVMString(value.type)) {
    value = generator.builder.createLoad(value);
  }
  return value;
}

export function getLLVMValueType(value: llvm.Value) {
  let type = value.type;
  while (type.isPointerTy()) {
    type = type.elementType;
  }
  return type;
}

export function unwrapPointerType(type: llvm.Type) {
  while (type.isPointerTy()) {
    type = type.elementType;
  }
  return type;
}

function findIndexOfType(types: llvm.Type[], initializerType: llvm.Type) {
  for (let i = 0; i < types.length; ++i) {
    if (types[i].equals(initializerType)) {
      return i;
    }
  }
  return -1;
}

export function initializeIntersection(
  destinationType: llvm.PointerType,
  initializer: llvm.Value,
  generator: LLVMGenerator
) {
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

  if (isIntersectionLLVMType(initializer.type)) {
    return extractFromIntersection(initializer, destinationType, generator);
  }

  initializer = generator.builder.createLoad(initializer);
  const initializerStructType = initializer.type as llvm.StructType;

  if (initializerStructType.numElements !== destinationType.elementType.numElements) {
    error(
      `Types mismatch: destination type: '${destinationType.elementType.toString()}', initializer: '${initializer.type.toString()}'`
    );
  }

  let intersection = llvm.Constant.getNullValue(destinationType.elementType);

  for (let i = 0; i < initializerStructType.numElements; ++i) {
    const value = generator.xbuilder.createSafeExtractValue(initializer, [i]);
    intersection = generator.xbuilder.createSafeInsert(intersection, value, [i]) as llvm.Constant;
  }

  const allocated = generator.gc.allocate(intersection.type);
  generator.xbuilder.createSafeStore(intersection, allocated);
  return allocated;
}

export function initializeUnion(
  unionType: llvm.PointerType,
  initializer: llvm.Value,
  generator: LLVMGenerator
): llvm.Value {
  if (unionType.equals(initializer.type)) {
    return initializer;
  }

  const unionStructType = unwrapPointerType(unionType);
  if (!unionStructType.isStructTy()) {
    error("Union expected to be of StructType");
  }

  const unionValue = llvm.Constant.getNullValue(unionStructType);
  const allocated = generator.gc.allocate(unionStructType);
  generator.xbuilder.createSafeStore(unionValue, allocated);

  if (
    !checkIfLLVMString(initializer.type) &&
    !isOptionalTSClosure(unionValue, generator) &&
    unwrapPointerType(initializer.type).isStructTy()
  ) {
    const propNames = [];

    // @todo: can initializer be an intersection?
    if (isUnionLLVMType(initializer.type)) {
      // Try to handle initializer as union. Its props names are available through meta storage.
      const typename = getLLVMTypename(initializer.type);
      const unionMeta = generator.meta.getUnionMeta(typename);
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
      const typename = getLLVMTypename(initializer.type);
      const structMeta = generator.meta.getStructMeta(typename);
      if (!structMeta) {
        error(`Cannot find struct meta for '${typename}'`);
      }
      propNames.push(...structMeta.props);
    }

    const unionName = unionStructType.name;
    if (!unionName) {
      error("Name required for UnionStruct");
    }

    const unionMeta = generator.meta.getUnionMeta(unionName);

    const initializerValue = getLLVMValue(initializer, generator);
    propNames.forEach((name, index) => {
      const destinationIndex = unionMeta.propsMap.get(name);
      if (typeof destinationIndex === "undefined") {
        error(`Mapping not found for property ${name}`);
      }

      const elementPtr = generator.xbuilder.createSafeInBoundsGEP(allocated, [0, destinationIndex]);
      generator.xbuilder.createSafeStore(
        generator.xbuilder.createSafeExtractValue(initializerValue, [index]),
        elementPtr
      );
    });
  } else {
    const elementTypes = [];
    for (let i = 0; i < unionStructType.numElements; ++i) {
      elementTypes.push(unionStructType.getElementType(i));
    }

    const activeIndex = findIndexOfType(elementTypes, initializer.type);
    if (activeIndex === -1) {
      error(`Cannot find type '${initializer.type.toString()}' in union type '${unionType.toString()}'`);
    }

    if ((isUnionWithUndefinedLLVMType(unionType) || isUnionWithNullLLVMType(unionType)) && activeIndex === 0) {
      initializer = llvm.ConstantInt.get(generator.context, -1, 8);
    }

    const elementPtr = generator.xbuilder.createSafeInBoundsGEP(allocated, [0, activeIndex]);
    generator.xbuilder.createSafeStore(initializer, elementPtr);
  }

  return allocated;
}

export function extractFromIntersection(
  intersection: llvm.Value,
  destinationType: llvm.PointerType,
  generator: LLVMGenerator
): llvm.Constant {
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
        type = llvm.StructType.get(generator.context, elementTypes).getPointerTo();
      }
    }
    destinationElementTypes.push(type);
  }

  let startIndex = findIndexOfSubarray(
    intersectionElementTypes,
    destinationElementTypes,
    (lhs: llvm.Type, rhs: llvm.Type) => lhs.equals(rhs)
  );

  if (startIndex === -1) {
    const intersectionTypeNames = getIntersectionSubtypesNames(intersectionStructType);
    const dest = getLLVMTypename(destinationType);
    startIndex = intersectionTypeNames.indexOf(dest);

    if (startIndex === -1) {
      error(`Cannot find types intersection '${intersectionStructType.toString()}' '${destinationType.toString()}'`);
    }
  }

  let result = llvm.Constant.getNullValue(destinationStructType);

  const intersectionValue = getLLVMValue(intersection, generator);
  for (let i = startIndex, k = 0; i < startIndex + destinationStructType.numElements; ++i, ++k) {
    const value = generator.xbuilder.createSafeExtractValue(intersectionValue, [i]);
    result = generator.xbuilder.createSafeInsert(result, value, [k]) as llvm.Constant;
  }

  const allocation = generator.gc.allocate(destinationStructType);
  generator.xbuilder.createSafeStore(result, allocation);

  return allocation as llvm.Constant;
}

export function extractFromUnion(
  union: llvm.Value,
  destinationType: llvm.PointerType,
  generator: LLVMGenerator
): llvm.Constant {
  const unionStructType = unwrapPointerType(union.type) as llvm.StructType;
  const destinationValueType = unwrapPointerType(destinationType);

  if (destinationValueType.isStructTy() && !checkIfLLVMString(destinationType)) {
    const unionMeta = generator.meta.getUnionMeta(unionStructType.name!);
    const objectMeta = generator.meta.getObjectMeta((destinationValueType as llvm.StructType).name!);

    const allocated = generator.gc.allocate(destinationValueType);

    for (let i = 0; i < objectMeta.props.length; ++i) {
      const sourceIndex = unionMeta.propsMap.get(objectMeta.props[i]);
      if (!sourceIndex) {
        error(`Mapping not found for '${objectMeta.props[i]}'`);
      }

      const destinationPtr = generator.xbuilder.createSafeInBoundsGEP(allocated, [0, i]);
      const valuePtr = generator.xbuilder.createSafeInBoundsGEP(union, [0, sourceIndex]);

      generator.xbuilder.createSafeStore(generator.builder.createLoad(valuePtr), destinationPtr);
    }

    return allocated as llvm.Constant;
  }

  const elementTypes = [];
  for (let i = 0; i < unionStructType.numElements; ++i) {
    elementTypes.push(unionStructType.getElementType(i));
  }

  const activeIndex = findIndexOfType(elementTypes, destinationType);

  if (activeIndex === -1) {
    error(`Cannot find type '${destinationType.toString()}' in union type '${unionStructType.toString()}'`);
  }

  return generator.builder.createLoad(
    generator.xbuilder.createSafeInBoundsGEP(union, [0, activeIndex])
  ) as llvm.Constant;
}

export function storeActualArguments(
  args: llvm.Value[],
  closureFunctionData: llvm.Value,
  generator: LLVMGenerator,
  fixedArgsCount?: number
) {
  // Closure data consists of null-valued arguments. Replace dummy arguments with actual ones.
  for (let i = 0; i < args.length; ++i) {
    const elementPtrPtr = generator.xbuilder.createSafeInBoundsGEP(closureFunctionData, [0, i + (fixedArgsCount || 0)]);

    const elementPtrType = (elementPtrPtr.type as llvm.PointerType).elementType as llvm.PointerType;
    let argument = args[i];

    if (!argument.type.equals(elementPtrType)) {
      argument = adjustLLVMValueToType(argument, elementPtrType, generator);
    }

    generator.xbuilder.createSafeStore(argument, elementPtrPtr);
  }
}

export function isPointerToStruct(value: llvm.Value) {
  return value.type.isPointerTy() && value.type.elementType.isStructTy();
}

export function createHeapAllocatedFromValue(value: llvm.Value, generator: LLVMGenerator) {
  if (value.type.isPointerTy()) {
    error("Expected value to be not of PointerType");
  }

  const allocated = generator.gc.allocate(value.type);
  generator.xbuilder.createSafeStore(value, allocated);
  return allocated;
}

export function inTSClassConstructor(generator: LLVMGenerator) {
  return Boolean(generator.currentFunction.name?.endsWith("__constructor"));
}

export function getTSObjectPropsFromName(name: string) {
  const props = name.split(InternalNames.Object)[1]?.split(".");
  if (!props || props.length === 0) {
    error(`No object prop names found in '${name}'`);
  }
  return props;
}

export function isSimilarStructs(lhs: llvm.Type, rhs: llvm.Type) {
  lhs = unwrapPointerType(lhs);
  rhs = unwrapPointerType(rhs);

  if (!lhs.isStructTy() || !rhs.isStructTy()) {
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

export class LazyClosure {
  private readonly tag = "__lazy_closure";

  private readonly generator: LLVMGenerator;
  private readonly llvmType: llvm.PointerType;

  constructor(generator: LLVMGenerator) {
    const structType = llvm.StructType.create(generator.context, this.tag);
    structType.setBody([]);
    this.generator = generator;
    this.llvmType = structType.getPointerTo();
  }

  get type() {
    return this.llvmType;
  }

  get create() {
    return this.generator.gc.allocate(this.llvmType.elementType);
  }

  isLazyClosure(value: llvm.Value) {
    const nakedType = unwrapPointerType(value.type);
    return Boolean(nakedType.isStructTy() && nakedType.name?.startsWith(this.tag));
  }
}

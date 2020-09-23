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

import { getNumericType, isCppNumericType, SizeOf } from "@cpp";
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
  checkIfUndefined,
  checkIfArray,
  getAliasedSymbolIfNecessary,
  InternalNames,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { Environment } from "@scope";
import { isConvertible } from "@handlers";

export function createLLVMFunction(
  returnType: llvm.Type,
  parameterTypes: llvm.Type[],
  name: string,
  module: llvm.Module,
  linkage: llvm.LinkageTypes = llvm.LinkageTypes.ExternalLinkage
): { fn: llvm.Function; existing: boolean } {
  const existing = module.getFunction(name);
  if (existing) {
    return { fn: existing, existing: true };
  }

  const type = llvm.FunctionType.get(returnType, parameterTypes, false);
  return { fn: llvm.Function.create(type, linkage, name, module), existing: false };
}

export function checkIfLLVMString(type: llvm.Type) {
  return (
    (type.isPointerTy() && type.elementType.isStructTy() && type.elementType.name === "string") ||
    (type.isStructTy() && type.name === "string")
  );
}

export function checkIfLLVMArray(type: llvm.Type) {
  return (
    (type.isPointerTy() && type.elementType.isStructTy() && type.elementType.name?.startsWith("Array__")) ||
    (type.isStructTy() && type.name?.startsWith("Array__"))
  );
}

export function isValueTy(type: llvm.Type) {
  return type.isDoubleTy() || type.isIntegerTy() || type.isPointerTy();
}

export function getTypeSize(type: llvm.Type, module: llvm.Module): number {
  const size = SizeOf.getByLLVMType(type);
  if (size) {
    return size;
  }
  return module.dataLayout.getTypeStoreSize(type);
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
    isCppNumericType(checker.typeToString(type))
  );
}

export function getLLVMType(
  type: ts.Type,
  node: ts.Node,
  generator: LLVMGenerator,
  environmentDataType?: llvm.PointerType
): llvm.Type {
  const { context, checker } = generator;

  if (type.isIntersection()) {
    return getIntersectionStructType(type, node, generator).getPointerTo();
  }

  if (checkIfUnion(type)) {
    return getUnionStructType(type as ts.UnionType, node, generator).getPointerTo();
  }

  if (isCppNumericType(checker.typeToString(type))) {
    return getNumericType(type, generator)!;
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
    const signature = checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0];
    let tsReturnType = checker.getReturnTypeOfSignature(signature);
    tsReturnType = tryResolveGenericTypeIfNecessary(tsReturnType, generator);

    const tsParameterTypes = signature.getParameters().map((parameter) => {
      let tsType = checker.getTypeOfSymbolAtLocation(parameter, node);
      tsType = tryResolveGenericTypeIfNecessary(tsType, generator);
      return tsType;
    });

    const llvmReturnType = getLLVMType(tsReturnType, node, generator, environmentDataType);
    const llvmParameters = [];
    if (environmentDataType) {
      llvmParameters.push(environmentDataType);
    } else {
      llvmParameters.push(
        ...tsParameterTypes.map((parameterType) => {
          return getLLVMType(parameterType, node, generator);
        })
      );
    }

    const functionType = llvm.FunctionType.get(llvmReturnType, llvmParameters, false);
    return functionType.getPointerTo();
  }

  if (checkIfUndefined(type, checker)) {
    return llvm.Type.getInt8Ty(context);
  }

  if (checkIfObject(type)) {
    return getStructType(type as ts.ObjectType, node, generator).getPointerTo();
  }

  if (checker.typeToString(type) === "null") {
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

export function getUnionOrIntersectionName(type: ts.UnionOrIntersectionType, checker: ts.TypeChecker) {
  return type.types.map((t) => getTypeName(t, checker)).join(".");
}

function getIntersectionStructType(type: ts.IntersectionType, node: ts.Node, generator: LLVMGenerator) {
  const { context, checker, module } = generator;

  const intersectionName = getUnionOrIntersectionName(type, checker).concat(".intersection");
  let intersection = module.getTypeByName(intersectionName);
  if (intersection) {
    return intersection;
  }

  const elements = flatten(
    type.types.map((t) => {
      return getProperties(t, checker).map((property) => {
        const tsType = checker.getTypeOfSymbolAtLocation(property, node);
        let llvmType;
        if (tsType.symbol && ts.isInterfaceDeclaration(tsType.symbol.declarations[0])) {
          // Unbox interface types since semantically they are live on TS level only.
          const interfaceElements = getObjectPropsLLVMTypes(tsType as ts.ObjectType, node, generator);
          llvmType = llvm.StructType.get(context, interfaceElements).getPointerTo();
        } else {
          llvmType = getLLVMType(tsType, node, generator);
        }

        const valueType = property.valueDeclaration.decorators?.some(
          (decorator) => decorator.getText() === "@ValueType"
        );
        return valueType ? (llvmType as llvm.PointerType).elementType : llvmType;
      });
    })
  );

  intersection = llvm.StructType.create(context, intersectionName);
  intersection.setBody(elements);

  return intersection;
}

function getUnionTypeProperties(type: ts.UnionType, checker: ts.TypeChecker): ts.Symbol[] {
  return flatten(
    type.types.map((t) => {
      if (t.isUnion()) {
        return getUnionTypeProperties(t, checker);
      }
      return checker.getPropertiesOfType(t);
    })
  );
}

function getUnionElementTypes(type: ts.UnionType, node: ts.Node, generator: LLVMGenerator): llvm.Type[] {
  return flatten(
    type.types.map((t) => {
      if (t.getSymbol() && ts.isInterfaceDeclaration(t.getSymbol()!.declarations[0])) {
        return getObjectPropsLLVMTypes(t as ts.ObjectType, node, generator);
      }

      if (t.isUnion()) {
        return getUnionElementTypes(t, node, generator);
      }

      return [getLLVMType(t, node, generator)];
    })
  );
}

export function getUnionStructType(type: ts.UnionType, node: ts.Node, generator: LLVMGenerator) {
  const { context, checker, module } = generator;

  const unionName = getUnionOrIntersectionName(type, checker).concat(".union");
  let unionType = module.getTypeByName(unionName);
  if (unionType) {
    return unionType;
  }

  const elements = getUnionElementTypes(type, node, generator);

  unionType = llvm.StructType.create(context, unionName);
  unionType.setBody(elements);

  const allProperties = getUnionTypeProperties(type, checker);
  const propsMap = allProperties.reduce((acc, symbol, index) => {
    return acc.set(symbol.name, index);
  }, new Map<string, number>());

  generator.meta.registerUnionMeta(unionName, unionType, propsMap);
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

export function getClosureType(types: llvm.Type[], generator: LLVMGenerator, dirty: boolean) {
  if (types.some((type) => !type.isPointerTy())) {
    error(
      `Expected all the types to be of PointerType, got:\n${types.map((type) => "  " + type.toString()).join(",\n")}'`
    );
  }

  const closureName =
    (dirty ? "dirty__" : "") +
    "cls__(" +
    types.reduce((acc, curr) => {
      return acc + "_" + curr.toString().replace(/\"/g, "");
    }, "") +
    ")";

  let closureType = generator.module.getTypeByName(closureName);
  if (!closureType) {
    closureType = llvm.StructType.create(generator.context, closureName);
    closureType.setBody(types);
  }

  return closureType;
}

export function isDirtyClosure(value: llvm.Value) {
  return Boolean(
    (value.type as llvm.StructType).name?.startsWith("dirty__cls__") ||
      ((value.type as llvm.PointerType).elementType as llvm.StructType).name?.startsWith("dirty__cls__")
  );
}

export function getObjectPropsLLVMTypes(type: ts.ObjectType, node: ts.Node, generator: LLVMGenerator) {
  return getProperties(type, generator.checker).map((property) => {
    const tsType = generator.checker.getTypeOfSymbolAtLocation(property, node);
    const llvmType = getLLVMType(tsType, node, generator);
    const valueType = property.valueDeclaration.decorators?.some((decorator) => decorator.getText() === "@ValueType");
    return valueType ? (llvmType as llvm.PointerType).elementType : llvmType;
  });
}

export function getStructType(type: ts.ObjectType, node: ts.Node, generator: LLVMGenerator) {
  const { context, module, checker } = generator;

  const elements = getObjectPropsLLVMTypes(type, node, generator);

  let structType: llvm.StructType | null;
  const declaration = type.getSymbol()?.declarations[0];

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
        structType.setBody(elements);
      }
    }
  } else {
    structType = llvm.StructType.get(context, elements);
  }

  return structType;
}

export function isIntersectionLLVMType(type: llvm.Type): boolean {
  return (
    (type.isPointerTy() && (type.elementType as llvm.StructType).name?.endsWith(".intersection")) ||
    !!(type as llvm.StructType).name?.endsWith(".intersection")
  );
}

export function isUnionLLVMType(type: llvm.Type): boolean {
  return (
    (type.isPointerTy() && (type.elementType as llvm.StructType).name?.endsWith(".union")) ||
    !!(type as llvm.StructType).name?.endsWith(".union")
  );
}

export function isUnionWithUndefinedLLVMType(type: llvm.Type): boolean {
  return (
    (type.isPointerTy() &&
      (type.elementType as llvm.StructType).name?.endsWith(".union") &&
      (type.elementType as llvm.StructType).name?.startsWith("undefined.")) ||
    !!((type as llvm.StructType).name?.endsWith(".union") && (type as llvm.StructType).name?.startsWith("undefined."))
  );
}

export function isUnionWithNullLLVMType(type: llvm.Type): boolean {
  return (
    (type.isPointerTy() &&
      (type.elementType as llvm.StructType).name?.endsWith(".union") &&
      (type.elementType as llvm.StructType).name?.startsWith("null.")) ||
    !!((type as llvm.StructType).name?.endsWith(".union") && (type as llvm.StructType).name?.startsWith("null."))
  );
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

export function handleFunctionArgument(
  argument: ts.Expression,
  argumentIndex: number,
  generator: LLVMGenerator,
  env?: Environment
): llvm.Value {
  const arg = generator.handleExpression(argument, env);

  if (arg.name.startsWith(InternalNames.Closure)) {
    // This argument is a closure.
    // It has null values in its environment that have to be substituted by actual arguments.
    // At this point just store metainformation about this argument: its parent function name and argument name.
    const parentFunctionExpression = (argument.parent as ts.CallExpression).expression;
    let symbol = generator.checker.getTypeAtLocation(parentFunctionExpression).symbol;
    symbol = getAliasedSymbolIfNecessary(symbol, generator.checker);
    const declaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;
    const signature = generator.checker.getSignatureFromDeclaration(declaration)!;

    generator.symbolTable.addClosureParameter(
      parentFunctionExpression.getText(),
      signature.getParameters()[argumentIndex].escapedName.toString()
    );
  }

  return arg;
}

export function isCppPrimitiveType(type: llvm.Type) {
  return type.isIntegerTy() || type.isDoubleTy();
}

export function adjustLLVMValueToType(value: llvm.Value, type: llvm.Type, generator: LLVMGenerator): llvm.Value {
  if (isUnionLLVMValue(value) && !unwrapPointerType(value.type).equals(type)) {
    const extracted = extractFromUnion(value, type.isPointerTy() ? type : type.getPointerTo(), generator);
    return adjustLLVMValueToType(extracted, type, generator);
  }
  if (value.type.equals(type) || isConvertible(value.type, type)) {
    return value;
  } else {
    if (shouldLoad(value.type, type)) {
      value = generator.builder.createLoad(value);
      return adjustLLVMValueToType(value, type, generator);
    } else {
      const allocated = generator.gc.allocate(value.type);
      generator.xbuilder.createSafeStore(value, allocated);
      return adjustLLVMValueToType(allocated, type, generator);
    }
  }
}

export function shouldLoad(parameterType: llvm.Type, destinationType: llvm.Type) {
  let parameterPointerLevel = 0;
  let destinationTypePointerLevel = 0;

  while (parameterType.isPointerTy()) {
    parameterType = parameterType.elementType;
    ++parameterPointerLevel;
  }

  while (destinationType.isPointerTy()) {
    destinationType = destinationType.elementType;
    ++destinationTypePointerLevel;
  }

  return parameterPointerLevel > destinationTypePointerLevel;
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

export function makeClosureWithEffectiveArguments(
  source: llvm.Value,
  effectiveArguments: llvm.Value[],
  environmentType: llvm.Type,
  generator: LLVMGenerator
) {
  const newEnv = effectiveArguments.reduce((acc, value, index) => {
    const elementType = (acc.type as llvm.StructType).getElementType(index);
    if (isUnionLLVMType(elementType)) {
      value = initializeUnion(elementType as llvm.PointerType, value, generator);
    }
    return generator.xbuilder.createSafeInsert(acc, value, [index]);
  }, llvm.Constant.getNullValue(environmentType));
  const allocatedNewEnv = generator.gc.allocate(newEnv.type);
  generator.xbuilder.createSafeStore(newEnv, allocatedNewEnv);

  let newClosure = llvm.Constant.getNullValue(unwrapPointerType(source.type));
  const closureFn = generator.xbuilder.createSafeExtractValue(getLLVMValue(source, generator), [0]);
  newClosure = generator.xbuilder.createSafeInsert(newClosure, closureFn, [0]) as llvm.Constant;
  newClosure = generator.xbuilder.createSafeInsert(newClosure, allocatedNewEnv, [1]) as llvm.Constant;
  const allocatedNewClosure = generator.gc.allocate(newClosure.type);
  generator.xbuilder.createSafeStore(newClosure, allocatedNewClosure);
  return allocatedNewClosure;
}

function findIndexOfType(types: llvm.Type[], initializerType: llvm.Type) {
  for (let i = 0; i < types.length; ++i) {
    if (types[i].equals(initializerType)) {
      return i;
    }
  }
  return -1;
}

function initializeIntersection(destinationType: llvm.PointerType, initializer: llvm.Value, generator: LLVMGenerator) {
  if (!destinationType.elementType.isStructTy()) {
    error(`Expected destination to be of StructType, got ${destinationType.elementType.toString()}`);
  }

  if (!initializer.type.isPointerTy()) {
    error(`Expected initializer to be of PointerType, got ${initializer.type.toString()}`);
  }

  if (!initializer.type.elementType.isStructTy()) {
    error(`Expected initializer value to be of StructType, got ${initializer.type.elementType.toString()}`);
  }

  initializer = generator.builder.createLoad(initializer);
  const initializerStructType = initializer.type as llvm.StructType;

  if (initializerStructType.numElements !== destinationType.elementType.numElements) {
    error("Types mismatch");
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
  const unionStructType = unionType.elementType as llvm.StructType;
  const elementTypes = [];
  for (let i = 0; i < unionStructType.numElements; ++i) {
    elementTypes.push(unionStructType.getElementType(i));
  }

  const unionValue = llvm.Constant.getNullValue(unionStructType);
  const allocated = generator.gc.allocate(unionStructType);
  generator.xbuilder.createSafeStore(unionValue, allocated);

  if (!checkIfLLVMString(initializer.type) && unwrapPointerType(initializer.type).isStructTy()) {
    const propNames = initializer.name ? initializer.name.split(".") : [];
    const unionName = unionStructType.name;
    if (!unionName) {
      error("Name required for UnionStruct");
    }

    const unionMeta = generator.meta.getUnionMeta(unionName);
    if (!unionMeta) {
      error(`No union meta found for ${unionName}`);
    }

    const initializerValue = getLLVMValue(initializer, generator);
    propNames.forEach((name, index) => {
      const destinationIndex = unionMeta.propsMap.get(name);
      if (typeof destinationIndex === "undefined") {
        error(`Mapping not found for property ${name}`);
      }

      const elementPtr = generator.builder.createInBoundsGEP(allocated, [
        llvm.ConstantInt.get(generator.context, 0),
        llvm.ConstantInt.get(generator.context, destinationIndex),
      ]);

      generator.xbuilder.createSafeStore(
        generator.xbuilder.createSafeExtractValue(initializerValue, [index]),
        elementPtr
      );
    });
  } else {
    const activeIndex = findIndexOfType(elementTypes, initializer.type);
    if (activeIndex === -1) {
      error(`Cannot find type '${initializer.type.toString()}' in union type '${unionType.toString()}'`);
    }

    if ((isUnionWithUndefinedLLVMType(unionType) || isUnionWithNullLLVMType(unionType)) && activeIndex === 0) {
      initializer = llvm.ConstantInt.get(generator.context, -1, 8);
    }

    const elementPtr = generator.builder.createInBoundsGEP(allocated, [
      llvm.ConstantInt.get(generator.context, 0),
      llvm.ConstantInt.get(generator.context, activeIndex),
    ]);

    generator.xbuilder.createSafeStore(initializer, elementPtr);
  }

  return allocated;
}

export function extractFromIntersection(
  intersection: llvm.Value,
  destinationType: llvm.PointerType,
  generator: LLVMGenerator
): llvm.Constant {
  const intersectionStructType = (intersection.type as llvm.PointerType).elementType as llvm.StructType;
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

  const startIndex = findIndexOfSubarray(
    intersectionElementTypes,
    destinationElementTypes,
    (lhs: llvm.Type, rhs: llvm.Type) => lhs.equals(rhs)
  );

  if (startIndex === -1) {
    error("Cannot find types intersection");
  }

  let result = llvm.Constant.getNullValue(destinationStructType);

  const intersectionValue = getLLVMValue(intersection, generator);
  for (let i = startIndex, k = 0; i < startIndex + destinationStructType.numElements; ++i, ++k) {
    let value = generator.xbuilder.createSafeExtractValue(intersectionValue, [i]);

    const aggregateStructType = result.type as llvm.StructType;
    const elementType = unwrapPointerType(aggregateStructType.getElementType(k));

    if (!elementType.equals(unwrapPointerType(value.type))) {
      if (elementType.isStructTy()) {
        if (unwrapPointerType(value.type).isStructTy()) {
          value = getLLVMValue(value, generator);
          if (!value.type.isStructTy()) {
            error("Unreachable");
          }
          if (value.type.numElements === elementType.numElements) {
            let equalTypes = true;
            for (let j = 0; j < value.type.numElements; ++j) {
              if (!value.type.getElementType(j).equals(elementType.getElementType(j))) {
                equalTypes = false;
                break;
              }
            }
            if (equalTypes) {
              let converted = llvm.Constant.getNullValue(elementType);
              for (let l = 0; l < value.type.numElements; ++l) {
                converted = generator.xbuilder.createSafeInsert(
                  converted,
                  generator.xbuilder.createSafeExtractValue(value, [l]),
                  [l]
                ) as llvm.Constant;
              }

              const allocated = generator.gc.allocate(converted.type);
              generator.xbuilder.createSafeStore(converted, allocated);
              value = allocated;
            }
          }
        }
      }
    }

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
    if (!unionMeta) {
      error(`Union meta not found for '${unionStructType.name}'`);
    }

    const objectMeta = generator.meta.getObjectMeta((destinationValueType as llvm.StructType).name!);
    if (!objectMeta) {
      error(`Object meta not found for '${(destinationValueType as llvm.StructType).name}'`);
    }

    const allocated = generator.gc.allocate(destinationValueType);

    for (let i = 0; i < objectMeta.props.length; ++i) {
      const sourceIndex = unionMeta.propsMap.get(objectMeta.props[i]);
      if (!sourceIndex) {
        error(`Mapping not found for '${objectMeta.props[i]}'`);
      }

      const destinationPtr = generator.builder.createInBoundsGEP(allocated, [
        llvm.ConstantInt.get(generator.context, 0),
        llvm.ConstantInt.get(generator.context, i),
      ]);

      const valuePtr = generator.builder.createInBoundsGEP(union, [
        llvm.ConstantInt.get(generator.context, 0),
        llvm.ConstantInt.get(generator.context, sourceIndex),
      ]);

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
    generator.builder.createInBoundsGEP(union, [
      llvm.ConstantInt.get(generator.context, 0),
      llvm.ConstantInt.get(generator.context, activeIndex),
    ])
  ) as llvm.Constant;
}

export function storeActualArguments(args: llvm.Value[], closureFunctionData: llvm.Value, generator: LLVMGenerator) {
  // Closure data consists of null-valued arguments. Replace dummy arguments with actual ones.
  for (let i = 0; i < args.length; ++i) {
    const elementPtrPtr = generator.builder.createInBoundsGEP(closureFunctionData, [
      llvm.ConstantInt.get(generator.context, 0),
      llvm.ConstantInt.get(generator.context, i),
    ]);

    const elementPtrType = (elementPtrPtr.type as llvm.PointerType).elementType as llvm.PointerType;
    let argument = args[i];

    if (!argument.type.equals(elementPtrType)) {
      if (isUnionLLVMType(elementPtrType)) {
        argument = initializeUnion(elementPtrType, argument, generator);
      } else if (isIntersectionLLVMType(elementPtrType)) {
        argument = initializeIntersection(elementPtrType, argument, generator);
      } else if (isUnionLLVMType(argument.type)) {
        argument = extractFromUnion(argument, elementPtrType, generator);
      } else if (isIntersectionLLVMType(argument.type)) {
        argument = extractFromIntersection(argument, elementPtrType, generator);
      }

      const elementType = unwrapPointerType(elementPtrType);
      if (!elementType.equals(unwrapPointerType(argument.type))) {
        if (elementType.isStructTy()) {
          if (unwrapPointerType(argument.type).isStructTy()) {
            argument = getLLVMValue(argument, generator);
            if (!argument.type.isStructTy()) {
              error("Unreachable");
            }
            if (argument.type.numElements === elementType.numElements) {
              let equalTypes = true;
              for (let j = 0; j < argument.type.numElements; ++j) {
                if (!argument.type.getElementType(j).equals(elementType.getElementType(j))) {
                  equalTypes = false;
                  break;
                }
              }
              if (equalTypes) {
                let converted = llvm.Constant.getNullValue(elementType);
                for (let l = 0; l < argument.type.numElements; ++l) {
                  converted = generator.xbuilder.createSafeInsert(
                    converted,
                    generator.xbuilder.createSafeExtractValue(argument, [l]),
                    [l]
                  ) as llvm.Constant;
                }

                const allocated = generator.gc.allocate(converted.type);
                generator.xbuilder.createSafeStore(converted, allocated);
                argument = allocated;
              }
            }
          }
        }
      }
    }

    generator.xbuilder.createSafeStore(argument, elementPtrPtr);
  }
}

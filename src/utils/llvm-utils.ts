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

function getIntersectionStructType(type: ts.IntersectionType, node: ts.Node, generator: LLVMGenerator) {
  const { context, checker } = generator;

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

  return llvm.StructType.get(context, elements);
}

export function getUnionStructType(type: ts.UnionType, node: ts.Node, generator: LLVMGenerator) {
  const { context, checker, module } = generator;

  const unionName = type.types
    .map((t) => {
      return checker.typeToString(t);
    })
    .join(".")
    .concat(".union");

  let union = module.getTypeByName(unionName);
  if (union) {
    return union;
  }

  const elements: llvm.Type[] = flatten(
    type.types.map((t) => {
      const properties = getProperties(t, checker);
      if (properties.length > 0) {
        return properties.map((property) => {
          const tsType = checker.getTypeOfSymbolAtLocation(property, node);
          const llvmType = getLLVMType(tsType, node, generator);
          const valueType = property.valueDeclaration?.decorators?.some(
            (decorator) => decorator.getText() === "@ValueType"
          );
          return valueType ? (llvmType as llvm.PointerType).elementType : llvmType;
        });
      } else {
        return [getLLVMType(t, node, generator)];
      }
    })
  );
  union = llvm.StructType.create(context, unionName);
  union.setBody(elements);
  return union;
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

function getObjectPropsLLVMTypes(type: ts.ObjectType, node: ts.Node, generator: LLVMGenerator) {
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

  let struct: llvm.StructType | null;
  const declaration = type.getSymbol()!.valueDeclaration;

  if (!declaration || ts.isClassDeclaration(declaration)) {
    // The `type` is a plain object or a class
    const name = TypeMangler.mangle(type, checker, declaration);

    struct = module.getTypeByName(name);
    if (!struct) {
      struct = llvm.StructType.create(context, name);
      const knownSize = SizeOf.getByName(name);
      if (knownSize) {
        const syntheticBody = getSyntheticBody(knownSize, context);
        struct.setBody(syntheticBody);
      } else {
        struct.setBody(elements);
      }
    }
  } else {
    struct = llvm.StructType.get(context, elements);
  }

  return struct;
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
  let arg = generator.handleExpression(argument, env);

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

  if (isUnionLLVMValue(arg)) {
    let declaredType: ts.Type;
    const symbol = generator.checker.getSymbolAtLocation(argument);
    if (symbol) {
      const declaration = symbol.declarations[0];
      declaredType = generator.checker.getTypeAtLocation(declaration!);
      declaredType = tryResolveGenericTypeIfNecessary(declaredType, generator);
    } else {
      declaredType = generator.checker.getTypeAtLocation(argument);
    }

    if (!declaredType.isUnion()) {
      error("Expected union type");
    }

    let actualType = generator.checker.getTypeAtLocation(argument);
    actualType = tryResolveGenericTypeIfNecessary(actualType, generator);
    let unionIndex = declaredType.types.indexOf(actualType);

    if (actualType.isUnionOrIntersection()) {
      const equalTypes = actualType.types.every((type, index) => type === (declaredType as ts.UnionType).types[index]);
      if (equalTypes) {
        unionIndex = 0;
      }
    }

    if (unionIndex === -1) {
      error(
        `Type ${generator.checker.typeToString(actualType)} not found in union ${generator.checker.typeToString(
          declaredType
        )}`
      );
    }

    const union = arg.type.isPointerTy() ? generator.builder.createLoad(arg, arg.name + ".load") : arg;
    arg = generator.builder.createExtractValue(union, [unionIndex]);
  }
  return arg;
}

export function initializeUnion(
  unionType: llvm.PointerType,
  initializer: llvm.Value,
  generator: LLVMGenerator
): llvm.Constant {
  const unionStructType = unionType.elementType as llvm.StructType;
  let unionValue = llvm.Constant.getNullValue(unionStructType);
  let activeIndex = -1;
  const elementTypes = [];
  for (let i = 0; i < unionStructType.numElements; ++i) {
    elementTypes.push(unionStructType.getElementType(i));
  }

  if (
    !checkIfLLVMString(initializer.type) &&
    initializer.type.isPointerTy() &&
    initializer.type.elementType.isStructTy()
  ) {
    const initializerElementTypes = [];
    const structType = initializer.type.elementType as llvm.StructType;

    for (let i = 0; i < structType.numElements; ++i) {
      initializerElementTypes.push(structType.getElementType(i));
    }

    activeIndex = findIndexOfSubarray(elementTypes, initializerElementTypes, (lhs: llvm.Type, rhs: llvm.Type) =>
      lhs.equals(rhs)
    );
    const initializerValue = generator.builder.createLoad(
      initializer,
      initializer.name + ".load"
    ) as llvm.ConstantStruct;
    for (let i = 0, k = 0; i < structType.numElements; ++i) {
      if (
        i >= activeIndex &&
        activeIndex + initializerElementTypes.length <= structType.numElements &&
        i < activeIndex + initializerElementTypes.length
      ) {
        const initializerUnionElement = generator.builder.createExtractValue(initializerValue, [k]);
        if (!(unionValue.type as llvm.StructType).getElementType(k).equals(initializerUnionElement.type)) {
          error(
            `Types mismatch, trying to insert '${initializerUnionElement.type.toString()}' into '${unionValue.type.toString()}'`
          );
        }
        unionValue = generator.builder.createInsertValue(unionValue, initializerUnionElement, [k]) as llvm.Constant;
        k++;
      }
    }
  } else {
    for (let i = 0; i < elementTypes.length; ++i) {
      if (elementTypes[i].equals(initializer.type)) {
        activeIndex = i;
        break;
      }
    }

    if (activeIndex === -1) {
      error(`Cannot find type '${initializer.type.toString()}' in union type '${unionType.toString()}'`);
    }

    if ((isUnionWithUndefinedLLVMType(unionType) || isUnionWithNullLLVMType(unionType)) && activeIndex === 0) {
      initializer = llvm.ConstantInt.get(generator.context, -1, 8);
    }

    unionValue = generator.builder.createInsertValue(unionValue, initializer, [activeIndex]) as llvm.Constant;
  }

  const allocation = generator.gc.allocate(unionStructType);
  generator.builder.createStore(unionValue, allocation);

  return allocation as llvm.Constant;
}

export function isCppPrimitiveType(type: llvm.Type) {
  return type.isIntegerTy() || type.isDoubleTy();
}

export function adjustLLVMValueToType(value: llvm.Value, type: llvm.Type, generator: LLVMGenerator): llvm.Value {
  if (value.type.equals(type) || isConvertible(value.type, type)) {
    return value;
  } else {
    if (shouldLoad(value.type, type)) {
      value = generator.builder.createLoad(value);
      return adjustLLVMValueToType(value, type, generator);
    } else {
      const allocated = generator.gc.allocate(value.type);
      generator.builder.createStore(value, allocated);
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

    if (!elementType.equals(value.type)) {
      error(`Types mismatch, trying to insert '${value.type.toString()}' into '${elementType.toString()}'`);
    }
    return generator.builder.createInsertValue(acc, value, [index]);
  }, llvm.Constant.getNullValue(environmentType));
  const allocatedNewEnv = generator.gc.allocate(newEnv.type);
  generator.builder.createStore(newEnv, allocatedNewEnv);

  let newClosure = llvm.Constant.getNullValue(unwrapPointerType(source.type));
  const closureFn = generator.builder.createExtractValue(getLLVMValue(source, generator), [0]);
  newClosure = generator.builder.createInsertValue(newClosure, closureFn, [0]) as llvm.Constant;
  newClosure = generator.builder.createInsertValue(newClosure, allocatedNewEnv, [1]) as llvm.Constant;
  const allocatedNewClosure = generator.gc.allocate(newClosure.type);
  generator.builder.createStore(newClosure, allocatedNewClosure);
  return allocatedNewClosure;
}

export function storeActualArguments(args: llvm.Value[], closureFunctionData: llvm.Value, generator: LLVMGenerator) {
  // Closure data consists of null-valued arguments. Replace dummy arguments with actual ones.
  for (let i = 0; i < args.length; ++i) {
    const elementPtrPtr = generator.builder.createInBoundsGEP(closureFunctionData, [
      llvm.ConstantInt.get(generator.context, 0),
      llvm.ConstantInt.get(generator.context, i),
    ]);

    const elementPtrType = (elementPtrPtr.type as llvm.PointerType).elementType;
    let argument = args[i];
    if (isUnionLLVMType(elementPtrType)) {
      argument = initializeUnion(elementPtrType as llvm.PointerType, argument, generator);
    }

    if (!argument.type.equals(elementPtrType)) {
      error(
        `Types mismatch: argument '${argument.type.toString()}', closure data element '${(elementPtrType as llvm.PointerType).elementType.toString()}'`
      );
    }

    generator.builder.createStore(argument, elementPtrPtr);
  }
}

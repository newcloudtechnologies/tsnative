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
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

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
    checkIfBoolean(type) ||
    checkIfNumber(type) ||
    checkIfString(type, checker) ||
    checkIfObject(type) ||
    checkIfVoid(type)
  );
}

export function getLLVMType(type: ts.Type, node: ts.Node, generator: LLVMGenerator): llvm.Type {
  const { context, checker } = generator;

  if (isCppNumericType(checker.typeToString(type))) {
    return getNumericType(type, generator)!;
  }

  if (Boolean(type.flags & ts.TypeFlags.Enum)) {
    return llvm.Type.getInt32Ty(context);
  }

  if (checkIfBoolean(type)) {
    return llvm.Type.getInt1Ty(context);
  }

  if (checkIfNumber(type)) {
    return llvm.Type.getDoubleTy(context);
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

    const llvmReturnType = getLLVMType(tsReturnType, node, generator);
    const llvmParameters = tsParameterTypes.map((parameterType) => {
      return getLLVMType(parameterType, node, generator);
    });

    const functionType = llvm.FunctionType.get(llvmReturnType, llvmParameters, false);

    return functionType.getPointerTo();
  }

  if (checkIfObject(type)) {
    return getStructType(type as ts.ObjectType, node, generator).getPointerTo();
  }

  if (type.isIntersection()) {
    return getIntersectionStructType(type, node, generator).getPointerTo();
  }

  if (checkIfUnion(type)) {
    return getUnionStructType(type as ts.UnionType, node, generator);
  }

  return error(`Unhandled type: '${checker.typeToString(type)}'`);
}

function getIntersectionStructType(type: ts.IntersectionType, node: ts.Node, generator: LLVMGenerator) {
  const { context, checker } = generator;

  const elements: llvm.Type[] = flatten(
    type.types.map((t) => {
      return getProperties(t, checker).map((property) => {
        const llvmType = getLLVMType(checker.getTypeOfSymbolAtLocation(property, node), node, generator);
        const valueType = property.valueDeclaration.decorators?.some(
          (decorator) => decorator.getText() === "@ValueType"
        );
        return valueType ? (llvmType as llvm.PointerType).elementType : llvmType;
      });
    })
  );

  return llvm.StructType.get(context, elements);
}

function getUnionStructType(type: ts.UnionType, node: ts.Node, generator: LLVMGenerator) {
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
        return getProperties(t, checker).map((property) => {
          const tsType = checker.getTypeOfSymbolAtLocation(property, node);
          const llvmType = getLLVMType(tsType, node, generator);
          const valueType = property.valueDeclaration.decorators?.some(
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

export function getStructType(type: ts.ObjectType, node: ts.Node, generator: LLVMGenerator) {
  const { context, module, checker } = generator;

  const elements: llvm.Type[] = getProperties(type, checker).map((property) => {
    const llvmType = getLLVMType(checker.getTypeOfSymbolAtLocation(property, node), node, generator);
    const valueType = property.valueDeclaration.decorators?.some((decorator) => decorator.getText() === "@ValueType");
    return valueType ? (llvmType as llvm.PointerType).elementType : llvmType;
  });

  let struct: llvm.StructType | null;
  const declaration = type.getSymbol()!.valueDeclaration;

  if (ts.isClassDeclaration(declaration)) {
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

export function isUnionLLVMValue(value: llvm.Value): boolean {
  return (
    ((value as llvm.AllocaInst).allocatedType as llvm.StructType)?.name?.endsWith(".union") ||
    value.name?.endsWith(".union")
  );
}

export function handleFunctionArgument(argument: ts.Expression, generator: LLVMGenerator): llvm.Value {
  let arg = generator.handleExpression(argument);
  if (isUnionLLVMValue(arg)) {
    const symbol = generator.checker.getSymbolAtLocation(argument);
    const declaration = symbol!.declarations[0];
    const declaredType = generator.checker.getTypeAtLocation(declaration!);

    if (!declaredType.isUnion()) {
      return error("Expected union type");
    }

    const actualType = generator.checker.getTypeAtLocation(argument);
    const unionIndex = declaredType.types.indexOf(actualType);
    const union = generator.builder.createLoad(arg, arg.name + ".load");
    arg = generator.builder.createExtractValue(union, [unionIndex]);
  }
  return arg;
}

export function initializeUnion(
  unionType: llvm.StructType,
  initializer: llvm.Value,
  generator: LLVMGenerator
): llvm.Constant {
  let unionValue = llvm.Constant.getNullValue(unionType);
  let activeIndex = -1;
  const elementTypes = [];
  for (let i = 0; i < unionType.numElements; ++i) {
    elementTypes.push(unionType.getElementType(i));
  }

  if (
    (!checkIfLLVMString(initializer.type) &&
      initializer.type.isPointerTy() &&
      initializer.type.elementType.isStructTy()) ||
    initializer.type.isStructTy()
  ) {
    const initializerElementTypes = [];
    const structType = (initializer.type.isStructTy()
      ? initializer.type
      : initializer.type.elementType) as llvm.StructType;
    for (let i = 0; i < structType.numElements; ++i) {
      initializerElementTypes.push(structType.getElementType(i));
    }

    activeIndex = findIndexOfSubarray(elementTypes, initializerElementTypes);
    const initializerValue = initializer.type.isStructTy()
      ? initializer
      : (generator.builder.createLoad(initializer, initializer.name + ".load") as llvm.ConstantStruct);
    for (let i = 0, k = 0; i < unionType.numElements; ++i) {
      if (
        i >= activeIndex &&
        activeIndex + initializerElementTypes.length <= unionType.numElements &&
        i < activeIndex + initializerElementTypes.length
      ) {
        const initializerUnionElement = generator.builder.createExtractValue(initializerValue, [k]);
        unionValue = generator.builder.createInsertValue(unionValue, initializerUnionElement, [k++]) as llvm.Constant;
      }
    }
    initializer = unionValue;
  } else {
    for (let i = 0; i < elementTypes.length; ++i) {
      if (elementTypes[i].equals(initializer.type)) {
        activeIndex = i;
        break;
      }
    }
    initializer = generator.builder.createInsertValue(unionValue, initializer, [activeIndex]);
  }

  return initializer as llvm.Constant;
}

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

  if (checkIfBoolean(type)) {
    return llvm.Type.getInt1Ty(context);
  }

  if (checkIfNumber(type)) {
    return llvm.Type.getDoubleTy(context);
  }

  if (checkIfString(type, generator.checker)) {
    return generator.builtinString.getLLVMType();
  }

  if (checkIfFunction(type)) {
    const signature = checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0];
    const tsReturnType = checker.getReturnTypeOfSignature(signature);
    const tsParameters = signature.getDeclaration().parameters;

    const llvmReturnType = getLLVMType(tsReturnType, node, generator);
    const llvmParameters = tsParameters.map((parameter) => {
      const tsType = checker.getTypeFromTypeNode(parameter.type!);
      return getLLVMType(tsType, node, generator);
    });

    return llvm.FunctionType.get(llvmReturnType, llvmParameters, false);
  }

  if (checkIfObject(type)) {
    return getStructType(type as ts.ObjectType, node, generator).getPointerTo();
  }

  if (checkIfVoid(type)) {
    return llvm.Type.getVoidTy(context);
  }

  if (isCppNumericType(checker.typeToString(type))) {
    return getNumericType(type, generator)!;
  }

  if (type.isIntersection()) {
    return getIntersectionStructType(type, node, generator).getPointerTo();
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
  const declaration = type.symbol.valueDeclaration;
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

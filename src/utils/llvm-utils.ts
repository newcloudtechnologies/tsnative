import { getNumericType, isNumericType } from "@cpp";
import { LLVMGenerator } from "@generator";
import { TypeMangler } from "@mangling";
import { error, getStoredProperties, isObject, isString } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export function keepInsertionPoint<T>(builder: llvm.IRBuilder, emit: () => T): T {
  const backup = builder.getInsertBlock();
  const result = emit();
  if (backup) {
    builder.setInsertionPoint(backup);
  }
  return result;
}

export function createLLVMFunction(
  returnType: llvm.Type,
  parameterTypes: llvm.Type[],
  name: string,
  module: llvm.Module,
  linkage: llvm.LinkageTypes = llvm.LinkageTypes.ExternalLinkage
) {
  const type = llvm.FunctionType.get(returnType, parameterTypes, false);
  return llvm.Function.create(type, linkage, name, module);
}

export function isLLVMString(type: llvm.Type) {
  return type.isStructTy() && type.name === "string";
}

export function isValueType(type: llvm.Type) {
  return type.isDoubleTy() || type.isIntegerTy() || type.isPointerTy() || isLLVMString(type);
}

export function getSize(type: llvm.Type, module: llvm.Module): number {
  return module.dataLayout.getTypeStoreSize(type);
}

export function isTypeSupported(type: ts.Type): boolean {
  return Boolean(
    type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral) ||
      type.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral) ||
      isString(type) ||
      isObject(type) ||
      type.flags & ts.TypeFlags.Void
  );
}

export function getLLVMType(type: ts.Type, node: ts.Node, generator: LLVMGenerator): llvm.Type {
  const { context, checker } = generator;

  // TODO: Inline literal types where possible.

  if (type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)) {
    return llvm.Type.getInt1Ty(context);
  }

  if (type.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral)) {
    return llvm.Type.getDoubleTy(context);
  }

  if (isString(type)) {
    return getStringType(context);
  }

  if (isObject(type)) {
    return getStructType(type, node, generator).getPointerTo();
  }

  if (isNumericType(checker.typeToString(type))) {
    return getNumericType(type, generator)!;
  }

  if (type.flags & ts.TypeFlags.Void) {
    return llvm.Type.getVoidTy(context);
  }

  if (type.flags & ts.TypeFlags.Any) {
    return error("'any' type is not supported");
  }

  return error(`Unhandled ts.Type '${checker.typeToString(type)}'`);
}

export function getStructType(type: ts.ObjectType, node: ts.Node, generator: LLVMGenerator) {
  const { context, module, checker } = generator;

  const elements: llvm.Type[] = getStoredProperties(type, checker).map(property => {
    return getLLVMType(checker.getTypeOfSymbolAtLocation(property, node), node, generator);
  });
  let struct: llvm.StructType | null;
  const declaration = type.symbol.declarations[0];
  if (ts.isClassDeclaration(declaration)) {
    const name = TypeMangler.mangle(type, checker, declaration);
    struct = module.getTypeByName(name);
    if (!struct) {
      struct = llvm.StructType.create(context, name);
      struct.setBody(elements);
    }
  } else {
    struct = llvm.StructType.get(context, elements);
  }

  return struct;
}

let stringType: llvm.StructType | undefined;

export function getStringType(context: llvm.LLVMContext): llvm.StructType {
  if (!stringType) {
    stringType = llvm.StructType.create(context, "string");
    stringType.setBody([llvm.Type.getInt8PtrTy(context), llvm.Type.getInt32Ty(context)]);
  }
  return stringType;
}

export function createEntryBlockAlloca(type: llvm.Type, name: string, generator: LLVMGenerator): llvm.AllocaInst {
  const builder = new llvm.IRBuilder(generator.currentFunction.getEntryBlock()!);
  const arraySize = undefined;
  return builder.createAlloca(type, arraySize, name);
}

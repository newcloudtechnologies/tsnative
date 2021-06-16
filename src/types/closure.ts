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
import { checkIfMethod, checkIfStaticMethod, error, getArgumentTypes } from "@utils";
import { FunctionMangler } from "@mangling";
import { LLVMValue } from "../llvm/value";
import { LLVMStructType, LLVMType } from "../llvm/type";

export class Closure {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  // @todo: temporary hack in fact!
  //        there is potential problem with function expression declared in body of another function in case if this function expression is a returned value
  //        its environment cannot be used on call (illformed IR will be generated)
  //        workaround this issue by this hack
  canCreateLazyClosure(declaration: ts.Declaration) {
    if (ts.isPropertyAssignment(declaration.parent)) {
      return false;
    }

    if (ts.isReturnStatement(declaration.parent)) {
      return false;
    }

    if (ts.isCallExpression(declaration.parent)) {
      const callExpression = declaration.parent;

      const argumentTypes = getArgumentTypes(callExpression, this.generator);
      const isMethod = checkIfMethod(callExpression.expression, this.generator.ts.checker);
      let thisType;
      if (isMethod) {
        const methodReference = callExpression.expression as ts.PropertyAccessExpression;
        thisType = this.generator.ts.checker.getTypeAtLocation(methodReference.expression);
      }

      const symbol = this.generator.ts.checker.getTypeAtLocation(callExpression.expression).getSymbol();
      const valueDeclaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;

      const thisTypeForMangling = checkIfStaticMethod(valueDeclaration)
        ? this.generator.ts.checker.getTypeAtLocation(
            (callExpression.expression as ts.PropertyAccessExpression).expression
          )
        : thisType;

      const { isExternalSymbol } = FunctionMangler.mangle(
        valueDeclaration,
        callExpression,
        thisTypeForMangling,
        argumentTypes,
        this.generator
      );

      if (isExternalSymbol) {
        // C++ backend knows nothing about `lazy` closures
        return false;
      }
    }

    return true;
  }

  isOptionalTSClosure(value: LLVMValue) {
    const isOptionalUnion =
      this.generator.types.union.isUnionWithNull(value.type) ||
      this.generator.types.union.isUnionWithUndefined(value.type);
    if (!isOptionalUnion) {
      return false;
    }

    let structType: LLVMStructType;
    if (value.type.isPointer()) {
      structType = value.type.getPointerElementType() as LLVMStructType;
    } else if (value.type.isStructType()) {
      structType = value.type;
    } else {
      error("Unreachable");
    }

    // Optional functions expected to be unions of exactly two elements: marker and one closure pointer
    const isPair = structType.numElements === 2;
    const secondPairPtr = value.type.isPointer()
      ? this.generator.builder.createSafeInBoundsGEP(value, [0, 1])
      : this.generator.builder.createSafeExtractValue(value, [1]);
    return isPair && this.isTSClosure(secondPairPtr.type);
  }

  isTSClosure(type: LLVMType) {
    const nakedType = type.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.getName()?.startsWith("TSClosure__class"));
  }
}

export class LazyClosure {
  private readonly tag = "__lazy_closure";

  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;

  constructor(generator: LLVMGenerator) {
    const structType = LLVMStructType.create(generator, this.tag);
    structType.setBody([]);
    this.generator = generator;
    this.llvmType = structType.getPointer();
  }

  get type() {
    return this.llvmType;
  }

  get create() {
    return this.generator.gc.allocate(this.llvmType.getPointerElementType());
  }

  isLazyClosure(value: LLVMValue) {
    const nakedType = value.type.unwrapPointer();
    return Boolean(nakedType.isStructType() && nakedType.getName()?.startsWith(this.tag));
  }
}

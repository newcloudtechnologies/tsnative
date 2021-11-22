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

import { LLVMGenerator } from "../generator";
import { TSType } from "./type";
import * as ts from "typescript";
import { LLVMValue } from "../llvm/value";
import { addClassScope } from "../scope/scope";
import { FunctionMangler } from "../mangling/functionmangler";
import { LLVMType } from "../llvm/type";

export class TSArray {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  getArgumentArrayType(expression: ts.ArrayLiteralExpression) {
    if (!ts.isCallExpression(expression.parent) && !ts.isNewExpression(expression.parent)) {
      throw new Error(
        `Expected expression parent to be of kind ts.CallExpression or ts.NewExpression, got '${
          ts.SyntaxKind[expression.parent.kind]
        }'`
      );
    }

    const parentType = this.generator.ts.checker.getTypeAtLocation(expression.parent.expression);
    const argumentIndex = expression.parent.arguments?.findIndex((argument) => argument === expression);
    if (typeof argumentIndex === "undefined" || argumentIndex === -1) {
      throw new Error(`Argument '${expression.getText()}' not found`); // unreachable
    }

    let parentDeclaration = parentType.getSymbol().valueDeclaration;
    if (!parentDeclaration) {
      throw new Error(
        `getArgumentArrayType: No parent declaration found at '${expression.parent.expression.getText()}'`
      );
    }

    if (parentDeclaration.isClass()) {
      const constructorDeclaration = parentDeclaration.members.find((member) => member.isConstructor());
      if (!constructorDeclaration) {
        throw new Error(`Unable to find constructor declaration at '${parentDeclaration.getText()}'`);
      }

      parentDeclaration = constructorDeclaration;
    }

    return this.generator.ts.checker.getTypeAtLocation(parentDeclaration.parameters[argumentIndex]);
  }

  getType(expression: ts.ArrayLiteralExpression) {
    let arrayType;
    if (expression.elements.length === 0) {
      if (ts.isVariableDeclaration(expression.parent)) {
        arrayType = this.generator.ts.checker.getTypeAtLocation(expression.parent);
      } else if (ts.isCallExpression(expression.parent) || ts.isNewExpression(expression.parent)) {
        arrayType = this.getArgumentArrayType(expression);
      } else if (ts.isBinaryExpression(expression.parent)) {
        arrayType = this.generator.ts.checker.getTypeAtLocation(expression.parent.left);
      } else if (ts.isParameter(expression.parent)) {
        if (!expression.parent.type) {
          throw new Error(`Type is required for default argument at '${expression.parent.getText()}'`);
        }

        arrayType = this.generator.ts.checker.getTypeAtLocation(expression.parent.type);
      }
    }

    if (!arrayType) {
      arrayType = this.generator.ts.checker.getTypeAtLocation(expression);
    }

    return arrayType;
  }

  createConstructor(expression: ts.ArrayLiteralExpression): { constructor: LLVMValue; allocated: LLVMValue } {
    addClassScope(expression, this.generator.symbolTable.globalScope, this.generator);

    const arrayType = this.getType(expression);
    const symbol = arrayType.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.getText()}'`);
    }

    const constructorDeclaration = valueDeclaration.members.find((m) => m.isConstructor())!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      expression,
      arrayType,
      [],
      this.generator
    );
    if (!isExternalSymbol) {
      throw new Error(`Array constructor for type '${arrayType.toString()}' not found`);
    }

    const parentScope = valueDeclaration.getScope(arrayType);
    if (!parentScope.thisData) {
      throw new Error("No 'this' data found");
    }

    const { fn: constructor } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      [LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    const allocated = this.generator.gc.allocate(parentScope.thisData.llvmType.getPointerElementType());
    return { constructor, allocated };
  }

  createPush(elementType: TSType, expression: ts.ArrayLiteralExpression) {
    const arrayType = this.getType(expression);
    if (elementType.isFunction()) {
      elementType = this.generator.tsclosure.getTSType();
    }

    const pushSymbol = arrayType.getProperty("push");
    const pushDeclaration = pushSymbol.valueDeclaration;

    if (!pushDeclaration) {
      throw new Error("No declaration for Array.push found");
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      pushDeclaration,
      expression,
      arrayType,
      [elementType],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Array 'push' for type '${arrayType.toString()}' not found`);
    }

    const parameterType =
      elementType.isObject() || elementType.isUnionOrIntersection()
        ? LLVMType.getInt8Type(this.generator).getPointer()
        : elementType.getLLVMType().correctCppPrimitiveType();

    const { fn: push } = this.generator.llvm.function.create(
      LLVMType.getDoubleType(this.generator),
      [LLVMType.getInt8Type(this.generator).getPointer(), parameterType],
      qualifiedName
    );

    return push;
  }

  createSubscription(arrayType: TSType) {
    const valueDeclaration = arrayType.getSymbol().valueDeclaration;
    if (!valueDeclaration) {
      throw new Error("No declaration for Array[] found");
    }
    const declaration = valueDeclaration.members.find((m) => m.isIndexSignature())!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      declaration,
      undefined,
      arrayType,
      [this.generator.ts.checker.getTypeFromTypeNode(declaration.parameters[0].type!)],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Array 'subscription' for type '${arrayType.toString()}' not found`);
    }

    const retType = LLVMType.getInt8Type(this.generator).getPointer(); // void*; caller have to perform cast

    const { fn: subscript } = this.generator.llvm.function.create(
      retType,
      [LLVMType.getInt8Type(this.generator).getPointer(), LLVMType.getDoubleType(this.generator)],
      qualifiedName
    );

    return subscript;
  }

  createConcat(expression: ts.ArrayLiteralExpression) {
    const arrayType = this.getType(expression);

    const symbol = arrayType.getProperty("concat")!;
    const declaration = symbol.valueDeclaration;

    if (!declaration) {
      throw new Error("No declaration for Array.concat found");
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      declaration,
      expression,
      arrayType,
      [arrayType],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Array 'concat' for type '${arrayType.toString()}' not found`);
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer(); // void*; caller have to perform cast

    const { fn: concat } = this.generator.llvm.function.create(
      llvmReturnType,
      [LLVMType.getInt8Type(this.generator).getPointer(), LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    return concat;
  }

  createToString(arrayType: TSType, expression: ts.Expression): LLVMValue {
    let elementType = arrayType.getTypeGenericArguments()[0];
    if (elementType.isFunction()) {
      elementType = this.generator.tsclosure.getTSType();
    }

    const toStringSymbol = arrayType.getProperty("toString");
    const toStringDeclaration = toStringSymbol.valueDeclaration;

    if (!toStringDeclaration) {
      throw new Error("No declaration for Array.toString found");
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      toStringDeclaration,
      expression,
      arrayType,
      [elementType],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Array 'toString' for type '${arrayType.toString()}' not found`);
    }

    const { fn: toString } = this.generator.llvm.function.create(
      this.generator.builtinString.getLLVMType(),
      [LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    return toString;
  }

  createIterator(expression: ts.ArrayLiteralExpression) {
    const arrayType = this.getType(expression);

    const symbol = arrayType.getProperty("iterator")!;
    const declaration = symbol.valueDeclaration;

    if (!declaration) {
      throw new Error("No declaration for Array.concat found");
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      declaration,
      expression,
      arrayType,
      [arrayType],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Array 'iterator' for type '${arrayType.toString()}' not found`);
    }

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer(); // void*; caller have to perform cast

    const { fn: concat } = this.generator.llvm.function.create(
      llvmReturnType,
      [LLVMType.getInt8Type(this.generator).getPointer(), LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    return concat;
  }
}

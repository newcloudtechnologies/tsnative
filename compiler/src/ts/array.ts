/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { LLVMGenerator } from "../generator";
import { TSType } from "./type";
import * as ts from "typescript";
import { LLVMValue } from "../llvm/value";
import { addClassScope } from "../scope/scope";
import { FunctionMangler } from "../mangling/functionmangler";
import { LLVMType } from "../llvm/type";
import { Declaration } from "./declaration";

const stdlib = require("std/constants");

export class TSArray {
  private readonly generator: LLVMGenerator;
  private readonly llvmType: LLVMType;
  private readonly classDeclaration: Declaration;

  private readonly constructorFns = new Map<string, LLVMValue>();
  private readonly subscriptFns = new Map<string, LLVMValue>();
  private readonly pushFns = new Map<string, LLVMValue>();
  private readonly concatFns = new Map<string, LLVMValue>();
  private readonly toStringFns = new Map<string, LLVMValue>();
  private readonly iteratorFns = new Map<string, LLVMValue>();

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    this.classDeclaration = this.initClassDeclaration();

    this.llvmType = this.classDeclaration.getLLVMStructType("array");
  }

  private initClassDeclaration() {
    const stddefs = this.generator.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === stdlib.ARRAY_DEFINITION);
    if (!stddefs) {
      throw new Error("No array definition source file found");
    }

    const classDeclaration = stddefs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(stddefs) === "Array";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Array' declaration in std library definitions");
    }

    return Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
  }

  getDeclaration() {
    return this.classDeclaration;
  }

  getLLVMType() {
    return this.llvmType;
  }

  getArgumentArrayType(expression: ts.ArrayLiteralExpression) {
    if (!ts.isCallExpression(expression.parent) && !ts.isNewExpression(expression.parent)) {
      throw new Error(
        `Expected expression parent to be of kind ts.CallExpression or ts.NewExpression, got '${ts.SyntaxKind[expression.parent.kind]
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
      if (ts.isVariableDeclaration(expression.parent) || ts.isPropertyDeclaration(expression.parent)) {
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
      } else if (ts.isTypeAssertion(expression.parent) || ts.isAsExpression(expression.parent)) {
        arrayType = this.generator.ts.checker.getTypeFromTypeNode(expression.parent.type);
      }
    }

    if (!arrayType) {
      arrayType = this.generator.ts.checker.getTypeAtLocation(expression);
      const elementType = arrayType.getTypeGenericArguments()[0];

      if (elementType.isNever()) {
        let returnStatement = expression.parent;

        while (returnStatement.parent && !ts.isReturnStatement(returnStatement)) {
          returnStatement = returnStatement.parent;
        }

        if (!returnStatement || !ts.isReturnStatement(returnStatement)) {
          throw new Error(`Type of empty array can only be deduced at return statement. Error at: '${expression.parent.getText()}'`);
        }

        let parentFunction = expression.parent.parent;
        while (parentFunction.parent && !ts.isFunctionLike(parentFunction)) {
          parentFunction = parentFunction.parent;
        }

        const functionType = this.generator.ts.checker.getTypeAtLocation(parentFunction);
        const functionSymbol = functionType.getSymbol();
        const functionDeclaration = functionSymbol.valueDeclaration;

        if (!functionDeclaration) {
          throw new Error(`Unable to find valude declaration for type: '${functionType.toString}'. Error at: '${parentFunction.getText()}'`);
        }

        const signature = this.generator.ts.checker.getSignatureFromDeclaration(functionDeclaration);

        arrayType = signature.getReturnType();
      }
    }

    return arrayType;
  }

  createConstructor(expression: ts.ArrayLiteralExpression): { constructor: LLVMValue; allocated: LLVMValue } {
    addClassScope(expression, this.generator.symbolTable.globalScope, this.generator);

    const arrayType = this.getType(expression);

    const arrayTypename = arrayType.toString();
    const allocated = this.generator.gc.allocate(this.classDeclaration.type.getLLVMType().getPointerElementType());

    if (this.constructorFns.has(arrayTypename)) {
      return { constructor: this.constructorFns.get(arrayTypename)!, allocated };
    }

    const symbol = arrayType.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.pos > 0 ? expression.getText() : "<synthetic array node>"}' type ${arrayType.toString()}`);
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

    const { fn: constructor } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      [LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    this.constructorFns.set(arrayTypename, constructor);

    return { constructor, allocated };
  }

  createPush(elementType: TSType, expression: ts.ArrayLiteralExpression) {
    const arrayType = this.getType(expression);

    const arrayTypename = arrayType.toString();

    if (this.pushFns.has(arrayTypename)) {
      return this.pushFns.get(arrayTypename)!;
    }

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

    const { fn: push } = this.generator.llvm.function.create(
      this.generator.builtinNumber.getLLVMType(),
      [LLVMType.getInt8Type(this.generator).getPointer(), LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    this.pushFns.set(arrayTypename, push);

    return push;
  }

  createSubscription(arrayType: TSType) {
    const arrayTypename = arrayType.toString();

    if (this.subscriptFns.has(arrayTypename)) {
      return this.subscriptFns.get(arrayTypename)!;
    }

    const valueDeclaration = arrayType.getSymbol().valueDeclaration;
    if (!valueDeclaration) {
      throw new Error("No declaration for Array[] found");
    }
    const declaration = valueDeclaration.members.find((m) => m.isIndexSignature())!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      declaration,
      undefined,
      arrayType,
      [this.generator.builtinNumber.getTSType()],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Array 'subscription' for type '${arrayType.toString()}' not found`);
    }

    const retType = LLVMType.getInt8Type(this.generator).getPointer(); // void*; caller have to perform cast

    const { fn: subscript } = this.generator.llvm.function.create(
      retType,
      [LLVMType.getInt8Type(this.generator).getPointer(), this.generator.builtinNumber.getLLVMType()],
      qualifiedName
    );

    this.subscriptFns.set(arrayTypename, subscript);

    return subscript;
  }

  createConcat(expression: ts.ArrayLiteralExpression) {
    const arrayType = this.getType(expression);

    const arrayTypename = arrayType.toString();
    if (this.concatFns.has(arrayTypename)) {
      return this.concatFns.get(arrayTypename)!;
    }

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

    this.concatFns.set(arrayTypename, concat);

    return concat;
  }

  getToStringFn(arrayType: TSType, expression: ts.Expression): LLVMValue {
    const arrayTypename = arrayType.toString();

    if (this.toStringFns.has(arrayTypename)) {
      return this.toStringFns.get(arrayTypename)!;
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
      [],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Array 'toString' for type '${arrayType.toString()}' not found`);
    }

    const { fn: toString } = this.generator.llvm.function.create(
      this.generator.ts.str.getLLVMType(),
      [LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    this.toStringFns.set(arrayTypename, toString);

    return toString;
  }

  createIterator(expression: ts.ArrayLiteralExpression) {
    const arrayType = this.getType(expression);

    const arrayTypename = arrayType.toString();

    if (this.iteratorFns.has(arrayTypename)) {
      return this.iteratorFns.get(arrayTypename)!;
    }

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

    const { fn: result } = this.generator.llvm.function.create(
      llvmReturnType,
      [LLVMType.getInt8Type(this.generator).getPointer(), LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    this.iteratorFns.set(arrayTypename, result);

    return result;
  }
}

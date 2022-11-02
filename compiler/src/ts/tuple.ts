/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { LLVMGenerator } from "../generator";
import { FunctionMangler } from "../mangling/functionmangler";
import { LLVMType } from "../llvm/type";
import * as ts from "typescript";
import { Declaration } from "./declaration";
import { Environment } from "../scope";
import { LLVMValue } from "../llvm/value";

const stdlib = require("std/constants");

export class TSTuple {
  private readonly generator: LLVMGenerator;
  private readonly declaration: Declaration;
  private readonly llvmType: LLVMType;

  private constructorFn: LLVMValue | undefined;
  private pushFn: LLVMValue | undefined;
  private subscriptFn: LLVMValue | undefined;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    this.declaration = this.initClassDeclaration()
    this.llvmType = this.declaration.getLLVMStructType("tuple");
  }

  private getTSType() {
    return this.declaration.type;
  }

  private initClassDeclaration() {
    const defs = this.generator.program.getSourceFiles().find((sourceFile) => sourceFile.fileName === stdlib.TUPLE_DEFINITION);

    if (!defs) {
      throw new Error("No tuple definition source file found");
    }

    const classDeclaration = defs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(defs) === "Tuple";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Tuple' declaration in std library definitions");
    }

    return Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
  }

  private initConstructorFn() {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const constructorDeclaration = declaration.members.find((m) => m.isConstructor());
    if (!constructorDeclaration) {
      throw new Error(`Unable to find Tuple constructor at '${declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      [],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error("External symbol Tuple constructor not found");
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [this.getLLVMType()];
    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return constructor;
  }

  private initSubscriptFn() {
    const subscriptDeclaration = this.declaration.members.find((m) => m.isIndexSignature());

    if (!subscriptDeclaration) {
      throw new Error(`Unable to find index signature for 'Tuple' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      subscriptDeclaration,
      undefined,
      this.getTSType(),
      [this.generator.builtinNumber.getTSType()],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error(`Tuple 'subscription' not found`);
    }

    const retType = LLVMType.getInt8Type(this.generator).getPointer(); // void*; caller have to perform cast

    const { fn: subscript } = this.generator.llvm.function.create(
      retType,
      [LLVMType.getInt8Type(this.generator).getPointer(), this.generator.builtinNumber.getLLVMType()],
      qualifiedName
    );

    return subscript;
  }

  private initPushFn() {
    const pushSymbol = this.getTSType().getProperty("push");
    const pushDeclaration = pushSymbol.valueDeclaration;

    if (!pushDeclaration) {
      throw new Error("No declaration for Tuple.push found");
    }

    if (pushDeclaration.parameters.length !== 1) {
      throw new Error("Expected Tuple.push to have exactly one parameter Object");
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      pushDeclaration,
      undefined,
      this.getTSType(),
      [this.generator.ts.obj.getTSType()],
      this.generator
    );

    if (!isExternalSymbol) {
      throw new Error("Unable to find Tuple.push in external symbols");
    }

    const { fn: push } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      [this.getLLVMType(), LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    return push;
  }

  private getLLVMPush() {
    if (!this.pushFn) {
      this.pushFn = this.initPushFn();
    }

    return this.pushFn;
  }

  private getLLVMConstructor() {
    if (!this.constructorFn) {
      this.constructorFn = this.initConstructorFn();
    }

    return this.constructorFn;
  }

  getLLVMType() {
    return this.llvmType;
  }

  getDeclaration() {
    return this.declaration;
  }

  create(elements: ts.NodeArray<ts.Expression>, env?: Environment) {
    const constructor = this.getLLVMConstructor();
    const allocated = this.generator.gc.allocate(this.getLLVMType().getPointerElementType());
    this.generator.builder.createSafeCall(constructor, [allocated]);

    const push = this.getLLVMPush();

    for (const element of elements) {
      const initializer = this.generator.handleExpression(element, env);
      this.generator.builder.createSafeCall(push, [allocated, this.generator.builder.asVoidStar(initializer)]);
    }

    return allocated;
  }

  getSubscriptionFn() {
    if (!this.subscriptFn) {
      this.subscriptFn = this.initSubscriptFn();
    }

    return this.subscriptFn;
  }

  // Actually a better place for this method is in ts.Node's wrapper which is yet not written
  static isTupleFromVariableDeclaration(node: ts.Node) {
    return Boolean(ts.isVariableDeclaration(node.parent) && node.parent.type && ts.isTupleTypeNode(node.parent.type));
  }

  // Actually a better place for this method is in ts.Node's wrapper which is yet not written
  static isTupleFromAssignment(node: ts.Node) {
    return Boolean(
      ts.isArrayLiteralExpression(node) &&
      ts.isBinaryExpression(node.parent) &&
      node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isArrayLiteralExpression(node.parent.left)
    );
  }
}

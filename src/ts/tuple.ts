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
import { FunctionMangler } from "../mangling/functionmangler";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { TSType } from "./type";
import * as ts from "typescript";
import { SIZEOF_TUPLE } from "../cppintegration";
import { Declaration } from "./declaration";
import { DEFINITIONS } from "../../std/constants";

export class TSTuple {
  private readonly generator: LLVMGenerator;
  private readonly declaration: Declaration;
  private readonly llvmType: LLVMType;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;

    const defs = this.generator.program.getSourceFiles().find((sourceFile) => sourceFile.fileName === DEFINITIONS);

    if (!defs) {
      throw new Error("No std definitions source file found");
    }

    const classDeclaration = defs.statements.find((node) => {
      return ts.isClassDeclaration(node) && node.name?.getText(defs) === "Tuple";
    });

    if (!classDeclaration) {
      throw new Error("Unable to find 'Tuple' declaration in std library definitions");
    }

    this.declaration = Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);

    const structType = LLVMStructType.create(generator, "tuple");
    const syntheticBody = structType.getSyntheticBody(SIZEOF_TUPLE);
    structType.setBody(syntheticBody);
    this.llvmType = structType.getPointer();
  }

  getLLVMType() {
    return this.llvmType;
  }

  getDeclaration() {
    return this.declaration;
  }

  private getTSType() {
    return this.declaration.type;
  }

  getLLVMConstructor(argTypes: TSType[]) {
    const declaration = this.getDeclaration();
    const thisType = this.getTSType();

    const constructorDeclaration = declaration.members.find((m) => m.isConstructor())!;

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      undefined,
      thisType,
      argTypes,
      this.generator
    );
    if (!isExternalSymbol) {
      throw new Error("External symbol Tuple constructor not found");
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const llvmArgumentTypes = [this.getLLVMType(), ...argTypes.map((type) => type.getLLVMType())];
    const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);

    return constructor;
  }

  createSubscription(tupleType: TSType) {
    const subscriptDeclaration = this.declaration.members.find((m) => m.isIndexSignature());

    if (!subscriptDeclaration) {
      throw new Error(`Unable to find index signature for 'Tuple' at '${this.declaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      subscriptDeclaration,
      undefined,
      tupleType,
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

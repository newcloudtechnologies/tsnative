/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { LLVMGenerator } from "../generator";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { LLVMArrayType, LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";

export class FunctionMeta {
  needUnwind: boolean = false;
}

export function getParentNode(currentNode: ts.Node, expectedParentNode: (node: ts.Node) => boolean): ts.Node {
  let searchNode = currentNode.parent;
  while (searchNode && !expectedParentNode(searchNode)) {
    searchNode = searchNode.parent;
  }
  return searchNode;
}

export function getInvocableBody(node: ts.Node): ts.Block | ts.Expression | undefined {
  const searchNode = getParentNode(node, (currentNode) =>
    ts.isFunctionLike(currentNode)
  ) as ts.FunctionLikeDeclarationBase;
  return searchNode?.body;
}

export function needUnwind(node: ts.Node): boolean {
  const searchNode = getParentNode(
    node,
    (currentNode: ts.Node) => ts.isFunctionLike(currentNode) || ts.isTryStatement(currentNode)
  );
  return searchNode ? searchNode.kind === ts.SyntaxKind.TryStatement : false;
}

export class Builder {
  private readonly generator: LLVMGenerator;
  private readonly builder: llvm.IRBuilder;
  landingPadStack: llvm.BasicBlock[] = [];
  functionMetaEntry: Map<ts.Block | ts.Expression, FunctionMeta>;

  constructor(generator: LLVMGenerator, basicBlock: llvm.BasicBlock | null) {
    this.generator = generator;
    this.builder = basicBlock ? new llvm.IRBuilder(basicBlock) : new llvm.IRBuilder(generator.context);
    this.functionMetaEntry = new Map<ts.Block | ts.Expression, FunctionMeta>();
  }

  unwrap() {
    return this.builder;
  }

  checkInsert(aggregate: LLVMValue, value: LLVMValue, idxList: number[]) {
    if (!aggregate.type.isStructType()) {
      throw new Error(`Expected aggregate to be of StructType, got ${aggregate.type.toString()}`);
    }

    if (!aggregate.type.getElementType(idxList[0]).equals(value.type)) {
      throw new Error(
        `Types mismatch, trying to insert '${value.type.toString()}'
                 into '${aggregate.type.getElementType(idxList[0]).toString()}'`
      );
    }
  }

  createSafeInsert(aggregate: LLVMValue, value: LLVMValue, idxList: number[]) {
    this.checkInsert(aggregate, value, idxList);
    const updatedAggregate = this.builder.createInsertValue(aggregate.unwrapped, value.unwrapped, idxList);
    return LLVMValue.create(updatedAggregate, this.generator);
  }

  checkStore(value: LLVMValue, ptr: LLVMValue) {
    if (!value.type.equals(ptr.type.getPointerElementType())) {
      throw new Error(
        `Types mismatch: value '${value.type.toString()}', pointer element type '${ptr.type
          .getPointerElementType()
          .toString()}'`
      );
    }
  }

  createSafeStore(valuePtr: LLVMValue, destinationPtrPtr: LLVMValue, isVolatile?: boolean) {
    if (destinationPtrPtr.type.getPointerElementType().isCXXVoidStar()) {
      valuePtr = this.generator.builder.asVoidStar(valuePtr);
    } else if (valuePtr.type.isCXXVoidStar()) {
      valuePtr = this.generator.builder.createBitCast(valuePtr, destinationPtrPtr.type.getPointerElementType());
    }

    this.checkStore(valuePtr, destinationPtrPtr);
    return this.builder.createStore(valuePtr.unwrapped, destinationPtrPtr.unwrapped, isVolatile);
  }

  checkExtractValue(aggregate: LLVMValue, idxList: number[]) {
    if (!aggregate.type.isStructType()) {
      throw new Error(`Expected aggregate to be of StructType, got ${aggregate.type.toString()}`);
    }
    const aggregateStructType = aggregate.type;
    if (idxList.some((idx) => idx >= aggregateStructType.numElements || idx < 0)) {
      throw new Error(`Index out of bounds for ${aggregateStructType.toString()}, ${idxList}`);
    }
  }

  createSafeExtractValue(aggregate: LLVMValue, idxList: number[], name?: string) {
    this.checkExtractValue(aggregate, idxList);
    const value = this.builder.createExtractValue(aggregate.unwrapped, idxList, name);
    return LLVMValue.create(value, this.generator);
  }

  checkInBoundsGEP(ptr: LLVMValue, idxList: number[]) {
    if (!ptr.type.isPointer()) {
      throw new Error(`Expected ptr to be of PointerType, got '${ptr.type.toString()}'`);
    }

    if (!ptr.type.isPointerToStruct() && !ptr.type.isPointerToArray()) {
      throw new Error(`Expected ptr element to be of StructType/ArrayType, got '${ptr.type.toString()}'`);
    }

    const pointerElementType: LLVMStructType | LLVMArrayType = ptr.type.getPointerElementType() as
      | LLVMStructType
      | LLVMArrayType;

    if (pointerElementType.numElements === 0) {
      throw new Error(`Invalid GEP from empty struct/array`);
    }

    for (const idx of idxList) {
      if (idx < 0) {
        throw new Error(`Invalid GEP index: -1`);
      }

      if (idx > pointerElementType.numElements - 1) {
        throw new Error(`GEP index out of bounds: ${idx}, upper bound: ${pointerElementType.numElements - 1}`);
      }
    }
  }

  createInBoundsGEP(ptr: LLVMValue, idxList: LLVMValue[], name?: string) {
    const idxValues = idxList.map((idx) => idx.unwrapped);
    const value = this.builder.createInBoundsGEP(ptr.unwrapped, idxValues, name);
    return LLVMValue.create(value, this.generator);
  }

  createSafeInBoundsGEP(ptr: LLVMValue, idxList: number[], name?: string) {
    this.checkInBoundsGEP(ptr, idxList);
    const idxValues = idxList.map((idx) => llvm.ConstantInt.get(this.generator.context, idx));
    const value = this.builder.createInBoundsGEP(ptr.unwrapped, idxValues, name);
    return LLVMValue.create(value, this.generator);
  }

  checkCall(callee: LLVMValue, args: LLVMValue[]) {
    const calleeUnwrapped = callee.unwrapped;
    if (!(calleeUnwrapped instanceof llvm.Function)) {
      // Giving up.
      return;
    }

    const calleeArgs = calleeUnwrapped.getArguments();
    if (calleeArgs.length !== args.length) {
      throw new Error(`Arguments length mismatch, expected ${calleeArgs.length}, got ${args.length}`);
    }

    for (let i = 0; i < calleeArgs.length; ++i) {
      const calleeArg = calleeArgs[i];
      const arg = args[i];
      if (!calleeArg.type.equals(arg.type.unwrapped)) {
        throw new Error(
          `Types mismatch: '${calleeArg.type.toString()}' - '${arg.type.unwrapped.toString()}' at index: ${i}`
        );
      }
    }
  }

  createSafeCall(callee: LLVMValue, args: LLVMValue[], name?: string) {
    this.checkCall(callee, args);
    const value = this.builder.createCall(
      callee.unwrapped,
      args.map((arg) => arg.unwrapped),
      name
    );
    return LLVMValue.create(value, this.generator);
  }

  checkRet(value: LLVMValue) {
    const currentFnReturnType = this.generator.currentFunction.type.elementType.returnType;
    if (!currentFnReturnType.equals(value.type.unwrapped)) {
      throw new Error(
        `Expected return value to be of '${currentFnReturnType.toString()}', got '${value.type.unwrapped.toString()}'`
      );
    }
  }

  createSafeRet(value: LLVMValue) {
    this.generator.symbolTable.currentScope.deinitialize();
    this.checkRet(value);
    return this.builder.createRet(value.unwrapped);
  }

  asVoidStar(value: LLVMValue) {
    // It might looks strange, but void* in LLVM is i8*.
    const casted = this.builder.createBitCast(
      value.unwrapped,
      LLVMType.getInt8Type(this.generator).getPointer().unwrapped
    );
    return LLVMValue.create(casted, this.generator);
  }

  asVoidStarStar(value: LLVMValue) {
    // It might looks strange, but void* in LLVM is i8*.
    const casted = this.builder.createBitCast(
      value.unwrapped,
      LLVMType.getInt8Type(this.generator).getPointer().getPointer().unwrapped
    );
    return LLVMValue.create(casted, this.generator);
  }

  asVoidStarStarStar(value: LLVMValue) {
    // It might looks strange, but void* in LLVM is i8*.
    const casted = this.builder.createBitCast(
      value.unwrapped,
      LLVMType.getInt8Type(this.generator).getPointer().getPointer().getPointer().unwrapped
    );
    return LLVMValue.create(casted, this.generator);
  }

  getInsertBlock() {
    return this.builder.getInsertBlock();
  }

  setInsertionPoint(insertionPoint?: llvm.BasicBlock | llvm.Value) {
    if (!insertionPoint) {
      throw new Error("No insertion point provided to `Builder.setInsertionPoint`");
    }

    this.builder.setInsertionPoint(insertionPoint);
  }

  createGlobalStringPtr(value: string, name?: string, addressSpace?: number) {
    const ptr = this.builder.createGlobalStringPtr(value, name, addressSpace);
    return LLVMValue.create(ptr, this.generator);
  }

  createSelect(condition: LLVMValue, trueValue: LLVMValue, falseValue: LLVMValue, name?: string) {
    if (!condition.type.isTSBoolean()) {
      throw new Error(`Expected boolean condition, got ${condition.type.toString()}`);
    }

    const unboxed = this.generator.builtinBoolean.getUnboxed(condition);
    const select = this.builder.createSelect(unboxed.unwrapped, trueValue.unwrapped, falseValue.unwrapped, name);
    return LLVMValue.create(select, this.generator);
  }

  createBr(basicBlock: llvm.BasicBlock) {
    const br = this.builder.createBr(basicBlock);
    return LLVMValue.create(br, this.generator);
  }

  createCondBr(condition: LLVMValue, 
               then: llvm.BasicBlock, 
               elseBlock: llvm.BasicBlock) {
    if (!condition.type.isTSBoolean()) {
      throw new Error(`Expected boolean condition, got ${condition.type.toString()}`);
    }

    const unboxed = this.generator.builtinBoolean.getUnboxed(condition);
    const condBr = this.builder.createCondBr(unboxed.unwrapped, then, elseBlock);
    return LLVMValue.create(condBr, this.generator);
  }

  createRetVoid() {
    this.generator.symbolTable.currentScope.deinitialize();
    this.builder.createRetVoid();
  }

  createLoad(value: LLVMValue) {
    const loaded = this.builder.createLoad(value.unwrapped);
    return LLVMValue.create(loaded, this.generator);
  }

  createAlloca(type: LLVMType) {
    const alloca = this.builder.createAlloca(type.unwrapped);
    return LLVMValue.create(alloca, this.generator);
  }

  createBitCast(value: LLVMValue, destType: LLVMType, name?: string) {
    if (value.type.isLazyClosure() && destType.isClosure()) {
      throw new Error("Cannot bitcast lazy closure to closure");
    }

    const casted = this.builder.createBitCast(value.unwrapped, destType.unwrapped, name);
    const castedLLVMValue = LLVMValue.create(casted, this.generator);

    return castedLLVMValue;
  }

  private withDoublesAsInts(
    lhs: LLVMValue,
    rhs: LLVMValue,
    generator: LLVMGenerator,
    handler: (lhs: LLVMValue, rhs: LLVMValue) => LLVMValue
  ): LLVMValue {
    lhs = generator.builder.createFPToSI(lhs, LLVMType.getInt32Type(generator));
    rhs = generator.builder.createFPToSI(rhs, LLVMType.getInt32Type(generator));

    const result = handler(lhs, rhs);

    return generator.builder.createSIToFP(result, LLVMType.getDoubleType(generator));
  }

  createFPToSI(value: LLVMValue, type: LLVMType, name?: string) {
    const casted = this.builder.createFPToSI(value.unwrapped, type.unwrapped, name);
    return LLVMValue.create(casted, this.generator);
  }

  createSIToFP(value: LLVMValue, type: LLVMType, name?: string) {
    const casted = this.builder.createSIToFP(value.unwrapped, type.unwrapped, name);
    return LLVMValue.create(casted, this.generator);
  }

  createUIToFP(value: LLVMValue, type: LLVMType, name?: string) {
    const casted = this.builder.createUIToFP(value.unwrapped, type.unwrapped, name);
    return LLVMValue.create(casted, this.generator);
  }

  createFCmpONE(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const value = this.builder.createFCmpONE(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createICmpNE(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const value = this.builder.createICmpNE(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createAdd(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.createFAdd(lhs, rhs);
    }

    const value = this.builder.createAdd(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  private createFAdd(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const value = this.builder.createFAdd(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createSub(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.createFSub(lhs, rhs);
    }

    const value = this.builder.createSub(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  private createFSub(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const value = this.builder.createFSub(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createMul(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.createFMul(lhs, rhs);
    }

    const value = this.builder.createMul(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  private createFMul(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const value = this.builder.createFMul(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createDiv(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.createFDiv(lhs, rhs);
    }

    const value = this.builder.createSDiv(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  private createFDiv(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const value = this.builder.createFDiv(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createRem(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.createFRem(lhs, rhs);
    }

    const value = this.builder.createSRem(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  private createFRem(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const value = this.builder.createFRem(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createAnd(lhs: LLVMValue, rhs: LLVMValue, name?: string): LLVMValue {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.withDoublesAsInts(lhs, rhs, this.generator, (l, r) => this.createAnd(l, r, name));
    }

    const value = this.builder.createAnd(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createOr(lhs: LLVMValue, rhs: LLVMValue, name?: string): LLVMValue {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.withDoublesAsInts(lhs, rhs, this.generator, (l, r) => this.createOr(l, r, name));
    }

    const value = this.builder.createOr(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createXor(lhs: LLVMValue, rhs: LLVMValue, name?: string): LLVMValue {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.withDoublesAsInts(lhs, rhs, this.generator, (l, r) => this.createXor(l, r, name));
    }

    const value = this.builder.createXor(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createShl(lhs: LLVMValue, rhs: LLVMValue, name?: string): LLVMValue {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.withDoublesAsInts(lhs, rhs, this.generator, (l, r) => this.createShl(l, r, name));
    }

    const value = this.builder.createShl(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createLShr(lhs: LLVMValue, rhs: LLVMValue, name?: string): LLVMValue {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.withDoublesAsInts(lhs, rhs, this.generator, (l, r) => this.createLShr(l, r, name));
    }

    const value = this.builder.createLShr(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createAShr(lhs: LLVMValue, rhs: LLVMValue, name?: string): LLVMValue {
    if (lhs.type.isDoubleType() && rhs.type.isDoubleType()) {
      return this.withDoublesAsInts(lhs, rhs, this.generator, (l, r) => this.createAShr(l, r, name));
    }

    const value = this.builder.createAShr(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createFCmpOEQ(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const value = this.builder.createFCmpOEQ(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createICmpEQ(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const value = this.builder.createICmpEQ(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(value, this.generator);
  }

  createPtrToInt(value: LLVMValue, destType: LLVMType, name?: string) {
    const casted = this.builder.createPtrToInt(value.unwrapped, destType.unwrapped, name);
    return LLVMValue.create(casted, this.generator);
  }

  createNot(value: LLVMValue, name?: string) {
    const negated = this.builder.createNot(value.unwrapped, name);
    return LLVMValue.create(negated, this.generator);
  }

  createNeg(value: LLVMValue, name?: string) {
    let negated: llvm.Value;

    if (value.type.isIntegerType()) {
      negated = this.builder.createNeg(value.unwrapped, name);
    } else if (value.type.isDoubleType()) {
      negated = this.builder.createFNeg(value.unwrapped, name);
    } else {
      throw new Error(`Unexpected negation of type '${value.type.toString()}'`);
    }

    return LLVMValue.create(negated, this.generator);
  }

  createFCmpOLT(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createFCmpOLT(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createICmpSLT(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createICmpSLT(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createICmpULT(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createICmpULT(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createFCmpOGT(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createFCmpOGT(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createICmpSGT(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createICmpSGT(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createICmpUGT(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createICmpULT(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createFCmpOLE(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createFCmpOLE(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createICmpSLE(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createICmpSLE(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createICmpULE(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createICmpULE(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createFCmpOGE(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createFCmpOGE(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createICmpSGE(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createICmpSGE(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }

  createICmpUGE(lhs: LLVMValue, rhs: LLVMValue, name?: string) {
    const result = this.builder.createICmpUGE(lhs.unwrapped, rhs.unwrapped, name);
    return LLVMValue.create(result, this.generator);
  }
}

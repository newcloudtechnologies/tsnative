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

import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";
import * as llvm from "llvm-node";
import {
  LLVMConstant,
  LLVMConstantInt,
  LLVMGlobalVariable,
  LLVMValue,
} from "../../llvm/value";
import { LLVMFunction } from "../../llvm/function";
import { LLVMType } from "../../llvm/type";
import { getInvocableBody, needUnwind } from "../../builder/builder";

type FunctionEntry = { fn: LLVMValue; existing: boolean };

/*
  ExceptionHandler class is provides exception handling via C++ Runtime realization described
  https://itanium-cxx-abi.github.io/cxx-abi/abi-eh.html
  This DWARF has implementation in LLVM https://llvm.org/docs/ExceptionHandling.html
*/

export class ExceptionHandler extends AbstractNodeHandler {
  private static typeInfo: LLVMGlobalVariable; // Type-info uses C++ RTTI. Store type information in runtime
  private static allocateException: FunctionEntry; // __cxa_allocate_exception --- LLVM ABI Itanium intrinsic
  private static throwException: FunctionEntry; // __cxa_throw --- LLVM ABI Itanium intrinsic
  private static beginCatch: FunctionEntry; // __cxa_begin_catch --- LLVM ABI Itanium intrinsic
  private static endCatch: FunctionEntry; // __cxa_end_catch --- LLVM ABI Itanium intrinsic
  private static personality: FunctionEntry; // __gxx_personality_v0 -- Personality function
  private readonly unreachableBlockName: string = "unreachable";

  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    const { builder, currentFunction, context } = this.generator;
    this.initRTTI();
    if (ts.isTryStatement(node)) {
      // Emit all declaration and type info
      // Mark attr function as required unwinding
      currentFunction.addFnAttr(llvm.Attribute.AttrKind.UWTable);

      // Set LSDA handler personality. This suggests that the function will language specific have an unwinder(C++)
      currentFunction.setPersonalityFn(
        ExceptionHandler.personality.fn.unwrapped as llvm.Constant
      );
      // ExceptionHandler.ehIrGenerator.setPersonalityFn(currentFunction);

      const tryBlockBB = llvm.BasicBlock.create(
        context,
        "try",
        currentFunction
      );
      const ldPadBB = llvm.BasicBlock.create(context, "catch.body", currentFunction);

      /* We will keep a stack of landing pages in order to correctly handle
         the context of the transition to the unwinding instructions
       */
      builder.landingPadStack.push(ldPadBB);

      this.generator.builder.createBr(tryBlockBB);
      this.generator.builder.setInsertionPoint(tryBlockBB);
      this.generator.handleNode(node.tryBlock, parentScope, env);
      const afterTryBB = llvm.BasicBlock.create(
        context,
        "after.try",
        currentFunction
      );
      const hasTerminator = Boolean(builder.getInsertBlock()?.getTerminator());
      if (
        !builder.getInsertBlock()?.name.startsWith("throw") &&
        !hasTerminator
      ) {
        builder.createBr(afterTryBB);
      }

      if (node.catchClause) {
        this.generator.handleNode(node.catchClause, parentScope, env);
      }
      if (!builder.getInsertBlock()?.getTerminator()) {
        builder.createBr(afterTryBB);
      }
      builder.setInsertionPoint(afterTryBB);

      return true;
    }

    if (ts.isThrowStatement(node)) {
      if (node.expression) {
        this.generator.emitLocation(node);
        const value = this.generator.handleExpression(node.expression, env).derefToPtrLevel1();
        this.emitThrowBlock(value, node);
      }
      return true;
    }

    if (ts.isCatchClause(node)) {
      this.generator.emitLocation(node);
      const lpad = builder.landingPadStack[builder.landingPadStack.length - 1];
      builder.landingPadStack.pop();
      this.generator.builder.setInsertionPoint(lpad);
      const int8PtrTy = LLVMType.getInt8Type(this.generator).getPointer();
      const int32Ty = LLVMType.getInt32Type(this.generator);

      const structType = llvm.StructType.get(context, [
        int8PtrTy.type,
        int32Ty.type,
      ]);
      const exception = builder
        .unwrap()
        .CreateLandingPad(structType, 1, "exception.inst");

      // Always only one catch block with type.
      exception.addClause(
        llvm.ConstantExpr.getBitCast(
          ExceptionHandler.typeInfo.unwrapped as llvm.Constant,
          int8PtrTy.type,
          false
        )
      );
      // This flag will not call destructors for the caught value in runtime C++
      exception.setCleanup(false);
      const selector = builder.createSafeExtractValue(
        LLVMValue.create(exception, this.generator),
        [0],
        "exception.slot"
      );
      const exceptionValue = builder.createSafeCall(
        ExceptionHandler.beginCatch.fn,
        [selector],
        "begin_catch"
      );

      if (node.variableDeclaration) {
        parentScope.set(node.variableDeclaration.name.getText(), exceptionValue);
      }
      this.generator.handleNode(node.block, parentScope, env);

      const currentBB = this.generator.builder.getInsertBlock();
      if (currentBB && !currentBB.getTerminator()) {
        this.generator.builder.createSafeCall(ExceptionHandler.endCatch.fn, []);
      }
      return true;
    }
    return false;
  }

  emitThrowBlock(raisedException: LLVMValue, node: ts.Node): void {
    const { builder, currentFunction } = this.generator;
    const int8PtrTy = LLVMType.getInt8Type(this.generator).getPointer();

    // Get exception payload and store to exception ptr
    const throwBlock = llvm.BasicBlock.create(
      this.generator.context,
      "throw",
      currentFunction
    );
    builder.createBr(throwBlock);
    builder.setInsertionPoint(throwBlock);
    const exceptionSize = LLVMConstantInt.get(
      this.generator,
      raisedException.type.getTypeSize(),
      64
    );
    const allocateException = builder.createSafeCall(
      ExceptionHandler.allocateException.fn,
      [exceptionSize],
      "alloc.exception.ptr"
    );
    const exceptionPtr = builder.createBitCast(
      allocateException,
      raisedException.type.getPointer()
    );
    builder.createSafeStore(raisedException, exceptionPtr);

    // Income from try block.
    if (needUnwind(node)) {
      const ldPadBB =
        builder.landingPadStack[builder.landingPadStack.length - 1];
      const unreachableBB = this.getOrCreateUnreachableBlock();
      {
        builder
          .unwrap()
          .CreateInvoke(
            ExceptionHandler.throwException.fn.unwrapped,
            unreachableBB,
            ldPadBB,
            [
              allocateException.unwrapped,
              builder.createBitCast(ExceptionHandler.typeInfo, int8PtrTy)
                .unwrapped,
              LLVMConstant.createNullValue(int8PtrTy, this.generator).unwrapped,
            ]
          );
      }
    } else {
      const block = getInvocableBody(node);
      builder.functionMetaEntry.set(block as ts.Block, { needUnwind: true });

      currentFunction.addFnAttr(llvm.Attribute.AttrKind.UWTable);
      builder.createSafeCall(ExceptionHandler.throwException.fn, [
        allocateException,
        builder.createBitCast(ExceptionHandler.typeInfo, int8PtrTy),
        LLVMConstant.createNullValue(int8PtrTy, this.generator),
      ]);
      builder.unwrap().CreateUnreachable();
    }
  }

  createFunction(
    ret: LLVMType,
    args: LLVMType[],
    name: string
  ): { fn: LLVMValue; existing: boolean } {
    const functionInstance = new LLVMFunction(this.generator);
    return functionInstance.create(ret, args, name);
  }

  getOrCreateUnreachableBlock(): llvm.BasicBlock {
    const { context, currentFunction, builder } = this.generator;
    const blocks = currentFunction.getBasicBlocks();
    const unreachableBB = blocks.find(
      (block: llvm.BasicBlock) => block.name === this.unreachableBlockName
    );
    if (unreachableBB) return unreachableBB;
    return this.generator.withInsertBlockKeeping(() => {
      const newUnreachableBB = llvm.BasicBlock.create(
        context,
        this.unreachableBlockName,
        currentFunction
      );
      builder.setInsertionPoint(newUnreachableBB);
      builder.unwrap().CreateUnreachable();
      return newUnreachableBB;
    });
  }

  initRTTI(): void {
    const int8PtrTy = LLVMType.getInt8Type(this.generator).getPointer();
    const int64Ty = LLVMType.getInt64Type(this.generator);
    const voidTy = LLVMType.getVoidType(this.generator);

    // Emit exception handling rtti intrinsic
    if (!this.generator.module.getGlobalVariable("_ZTIPv")) {
      ExceptionHandler.typeInfo = LLVMGlobalVariable.make(
        this.generator,
        int8PtrTy,
        true,
        undefined,
        "_ZTIPv"
      );
    }
    ExceptionHandler.personality = this.getPersonality();
    ExceptionHandler.allocateException = this.createFunction(
      int8PtrTy,
      [int64Ty],
      "__cxa_allocate_exception"
    );
    ExceptionHandler.throwException = this.createFunction(
      voidTy,
      [int8PtrTy, int8PtrTy, int8PtrTy],
      "__cxa_throw"
    );
    ExceptionHandler.beginCatch = this.createFunction(
      int8PtrTy,
      [int8PtrTy],
      "__cxa_begin_catch"
    );
    ExceptionHandler.endCatch = this.createFunction(
      voidTy,
      [],
      "__cxa_end_catch"
    );
  }

  getPersonality(): FunctionEntry {
    const int32Ty = LLVMType.getInt32Type(this.generator);
    const isOSWindows = new llvm.Triple(llvm.getProcessTriple()).isOSWindows();
    if (isOSWindows) {
      return this.createFunction(int32Ty, [], "__gxx_personality_seh0");
    }
    return this.createFunction(int32Ty, [], "__gxx_personality_v0");
  }
}

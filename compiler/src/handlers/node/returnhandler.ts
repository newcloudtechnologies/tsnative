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
import { LLVMType } from "../../llvm/type";
import { Declaration } from "../../ts/declaration";

export class ReturnHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isReturnStatement(node)) {
      this.generator.emitLocation(node);

      const currentFunctionReturnType = LLVMType.make(
        this.generator.currentFunction.type.elementType.returnType,
        this.generator
      );

      if (node.expression) {
        this.generator.emitLocation(node);

        let ret = this.generator.handleExpression(node.expression, env).derefToPtrLevel1();

        if (node.expression.getText() === "this" && this.generator.meta.inSuperCall()) {
          const currentClassDeclaration = this.generator.meta.getCurrentClassDeclaration();
          const declarationOfReturn = this.generator.ts.checker.getSymbolAtLocation(node.expression).valueDeclaration;

          if (currentClassDeclaration && declarationOfReturn?.isBaseOf(currentClassDeclaration)) {
            ret = this.generator.ts.obj.get(ret, "parent");
            ret = this.generator.ts.union.get(ret);
            ret = this.generator.builder.createBitCast(ret, currentFunctionReturnType);
            this.generator.builder.createSafeRet(ret);
            return true;
          }
        }

        if (this.generator.builder.getInsertBlock()?.name.startsWith("catch.body")) {
          const cxaEndCatchFn = this.generator.module.getFunction("__cxa_end_catch");
          this.generator.builder.unwrap().createCall(cxaEndCatchFn!, []);
        }

        if (!ret.type.equals(currentFunctionReturnType)) {
          const signature = this.getSignatureOfFunctionThatReturns(node);
          const declaratedReturnType = signature.getReturnType();
          const typeOfReturn = this.generator.ts.checker.getTypeAtLocation(node.expression);

          if (typeOfReturn.isUpcastableTo(declaratedReturnType) || typeOfReturn.isThisType()) {
            ret = this.generator.builder.createBitCast(ret, declaratedReturnType.getLLVMType());
            this.generator.builder.createSafeRet(ret);

            return true;
          }

          const retTypeUnwrapped = ret.type.unwrapPointer();
          if (currentFunctionReturnType.isUnion()) {
            ret = this.generator.ts.union.create(ret);
          } else if (ret.type.isUnion()) {
            ret = this.generator.ts.union.get(ret);
            ret = this.generator.builder.createBitCast(ret, currentFunctionReturnType);
          } else if (
            (retTypeUnwrapped.isStructType() &&
              retTypeUnwrapped.isSameStructs(currentFunctionReturnType.unwrapPointer())) ||
            (ret.type.isPointer() && retTypeUnwrapped.isIntegerType(8))
          ) {
            ret = this.generator.builder.createBitCast(ret, currentFunctionReturnType);
          }
        }

        this.generator.builder.createSafeRet(ret);
      } else {
        if (currentFunctionReturnType.isUndefined()) {
          this.generator.builder.createSafeRet(this.generator.ts.undef.get());
        } else {
          const optionalUnion = this.generator.ts.union.create();
          this.generator.builder.createSafeRet(optionalUnion);
        }
      }

      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private getSignatureOfFunctionThatReturns(node: ts.Node) {
    let parentFunction = node.parent;

    while (!ts.isFunctionLike(parentFunction)) {
      parentFunction = parentFunction.parent;
    }

    return this.generator.ts.checker.getSignatureFromDeclaration(Declaration.create(parentFunction, this.generator));
  }
}

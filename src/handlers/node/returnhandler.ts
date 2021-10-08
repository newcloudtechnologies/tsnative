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

import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";
import { LLVMType } from "../../llvm/type";
import { LLVMUnion } from "../../llvm/value";
import { Declaration } from "../../ts/declaration";

export class ReturnHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isReturnStatement(node)) {
      if (node.expression) {
        let ret = this.generator.handleExpression(node.expression, env);
        const currentFunctionReturnType = LLVMType.make(
          this.generator.currentFunction.type.elementType.returnType,
          this.generator
        );

        if (!ret.type.equals(currentFunctionReturnType)) {
          const signature = this.getSignatureOfFunctionThatReturns(node);
          const declaratedReturnType = signature.getReturnType();
          const typeOfReturn = this.generator.ts.checker.getTypeAtLocation(node.expression);

          if (typeOfReturn.isUpcastableTo(declaratedReturnType)) {
            ret = this.generator.builder.createBitCast(ret, declaratedReturnType.getLLVMType());
            this.generator.builder.createSafeRet(ret);

            return true;
          }

          const retTypeUnwrapped = ret.type.unwrapPointer();
          if (
            (retTypeUnwrapped.isStructType() &&
              retTypeUnwrapped.isSameStructs(currentFunctionReturnType.unwrapPointer())) ||
            (ret.type.isPointer() && retTypeUnwrapped.isIntegerType(8))
          ) {
            ret = this.generator.builder.createBitCast(ret, currentFunctionReturnType);
          } else if (currentFunctionReturnType.isUnion()) {
            const nullUnion = LLVMUnion.createNullValue(currentFunctionReturnType, this.generator);
            ret = nullUnion.initialize(ret);
          }
        }

        this.generator.builder.createSafeRet(ret);
      } else {
        this.generator.builder.createRetVoid();
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

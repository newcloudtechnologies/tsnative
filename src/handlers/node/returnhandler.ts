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
import { Scope, Environment } from "@scope";
import { isSimilarStructs } from "@utils";
import { PointerType } from "llvm-node";

export class ReturnHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isReturnStatement(node)) {
      if (node.expression) {
        let ret = this.generator.handleExpression(node.expression, env);
        const currentFunctionReturnType = this.generator.currentFunction.type.elementType.returnType;

        if (!ret.type.equals(currentFunctionReturnType)) {
          if (isSimilarStructs(ret.type, currentFunctionReturnType)) {
            ret = this.generator.builder.createBitCast(ret, currentFunctionReturnType);
          } else if (this.generator.types.union.isLLVMUnion(currentFunctionReturnType)) {
            ret = this.generator.types.union.initialize(currentFunctionReturnType as PointerType, ret);
          }
        }

        this.generator.xbuilder.createSafeRet(ret);
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
}

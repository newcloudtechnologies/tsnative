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
import * as llvm from "llvm-node";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "@scope";
import { getLLVMType, checkIfUnion, initializeUnion } from "@utils";

export class ReturnHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isReturnStatement(node)) {
      const statement = node as ts.ReturnStatement;
      if (statement.expression) {
        const ret = this.generator.handleExpression(statement.expression, env);
        const retType = this.generator.checker.getTypeAtLocation(statement.expression);

        if (checkIfUnion(retType)) {
          let parent = node.parent;
          while (!ts.isFunctionLike(parent)) {
            parent = parent.parent;
          }

          const signature = this.generator.checker.getSignatureFromDeclaration(parent);
          const declaredReturnType = this.generator.checker.getReturnTypeOfSignature(signature!) as ts.UnionType;
          const llvmType = getLLVMType(declaredReturnType, node, this.generator) as llvm.StructType;
          const llvmUnion = initializeUnion(llvmType, ret, this.generator);
          this.generator.builder.createRet(llvmUnion);
        } else {
          this.generator.builder.createRet(ret);
        }
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

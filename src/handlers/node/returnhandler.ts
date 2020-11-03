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
import { checkIfUnion, initializeUnion, isSimilarStructs } from "@utils";

export class ReturnHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isReturnStatement(node)) {
      const statement = node as ts.ReturnStatement;
      if (statement.expression) {
        let ret = this.generator.handleExpression(statement.expression, env);
        const retType = this.generator.checker.getTypeAtLocation(statement.expression);

        if (checkIfUnion(retType)) {
          ret = initializeUnion(this.generator.currentFunction.type, ret, this.generator);
          this.generator.xbuilder.createSafeRet(ret);
        } else {
          const currentFunctionReturnType = this.generator.currentFunction.type.elementType.returnType;
          if (!ret.type.equals(currentFunctionReturnType)) {
            if (isSimilarStructs(ret.type, currentFunctionReturnType)) {
              ret = this.generator.builder.createBitCast(ret, currentFunctionReturnType);
            }
          }

          this.generator.xbuilder.createSafeRet(ret);
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

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
import { Scope } from "@scope";

export class ReturnHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope): boolean {
    if (ts.isReturnStatement(node)) {
      const statement = node as ts.ReturnStatement;
      if (statement.expression) {
        this.generator.builder.createRet(this.generator.handleExpression(statement.expression));
      } else {
        this.generator.builder.createRetVoid();
      }
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope);
    }

    return false;
  }
}

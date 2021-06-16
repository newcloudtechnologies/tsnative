/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { LLVMValue } from "../../llvm/value";
import { LLVMType } from "../../llvm/type";

export class NullKeywordHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (expression.kind === ts.SyntaxKind.NullKeyword) {
      const allocated = this.generator.gc.allocate(LLVMType.getInt8Type(this.generator));
      return allocated;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }
}

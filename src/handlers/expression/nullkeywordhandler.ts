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

import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMConstantInt, LLVMValue } from "../../llvm/value";

export class NullKeywordHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (expression.kind === ts.SyntaxKind.NullKeyword) {
      return this.generator.builtinBoolean.create(LLVMConstantInt.getFalse(this.generator));
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }
}

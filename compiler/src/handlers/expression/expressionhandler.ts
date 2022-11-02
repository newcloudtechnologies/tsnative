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

import { LLVMGenerator } from "../../generator";
import { Expression } from "typescript";
import { Environment } from "../../scope";
import { LLVMValue } from "../../llvm/value";

export abstract class AbstractExpressionHandler {
  protected next: AbstractExpressionHandler | undefined;
  protected generator: LLVMGenerator;
  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }
  abstract handle(expression: Expression, env?: Environment): LLVMValue | undefined;
  setNext(handler: AbstractExpressionHandler): AbstractExpressionHandler {
    this.next = handler;
    return this.next;
  }
}

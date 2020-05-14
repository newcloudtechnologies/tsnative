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

import { LLVMGenerator } from "@generator";
import { Expression } from "typescript";

export abstract class AbstractExpressionHandler {
  protected next: AbstractExpressionHandler | undefined;
  protected generator: LLVMGenerator;
  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }
  abstract handle(expression: Expression): llvm.Value | undefined;
  setNext(handler: AbstractExpressionHandler): void {
    this.next = handler;
  }
}

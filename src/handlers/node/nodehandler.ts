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
import * as ts from "typescript";
import { Scope, Environment } from "@scope";

export abstract class AbstractNodeHandler {
  protected next: AbstractNodeHandler | undefined;
  protected generator: LLVMGenerator;
  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }
  abstract handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean;
  setNext(handler: AbstractNodeHandler): void {
    this.next = handler;
  }
}

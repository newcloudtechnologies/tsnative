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

import { LLVMGenerator } from "../../generator";
import * as ts from "typescript";
import { Scope, Environment } from "../../scope";

export abstract class AbstractNodeHandler {
  protected next: AbstractNodeHandler | undefined;
  protected generator: LLVMGenerator;
  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }
  abstract handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean;
  setNext(handler: AbstractNodeHandler): AbstractNodeHandler {
    this.next = handler;
    return this.next;
  }
}

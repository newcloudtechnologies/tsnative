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

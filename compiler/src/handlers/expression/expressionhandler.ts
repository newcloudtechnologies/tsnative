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

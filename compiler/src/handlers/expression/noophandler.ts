import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMConstantInt, LLVMValue } from "../../llvm/value";

export class NoopHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isSpreadElement(expression)) {
      return LLVMConstantInt.getFalse(this.generator);
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }
}

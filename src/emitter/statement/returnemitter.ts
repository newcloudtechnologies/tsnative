import { LLVMGenerator } from "@generator";
import { ReturnStatement } from "typescript";

export class ReturnEmitter {
  emitReturnStatement(statement: ReturnStatement, generator: LLVMGenerator): void {
    if (statement.expression) {
      generator.builder.createRet(generator.emitExpression(statement.expression));
    } else {
      generator.builder.createRetVoid();
    }
  }
}

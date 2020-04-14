import { LLVMGenerator } from "@generator";
import { ExpressionStatement } from "typescript";

export class ExpressionStatementEmitter {
  emitExpressionStatement(statement: ExpressionStatement, generator: LLVMGenerator): void {
    generator.emitValueExpression(statement.expression);
  }
}

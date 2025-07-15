import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import * as ts from "typescript";
import { LLVMValue } from "../../llvm/value";

export class CastHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.TypeAssertionExpression:
      case ts.SyntaxKind.AsExpression:
        const asExpression = expression as ts.AsExpression | ts.TypeAssertion;

        this.generator.emitLocation(asExpression);

        let value = this.generator.handleExpression(asExpression.expression, env).derefToPtrLevel1();

        if (value.type.isUnion()) {
          value = this.generator.ts.union.get(value);
        }

        const destinationTSType = this.generator.ts.checker.getTypeFromTypeNode(asExpression.type);
        return this.generator.builder.createBitCast(value, destinationTSType.getLLVMType().ensurePointer());
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }
}

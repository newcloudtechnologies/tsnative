import * as ts from "typescript";
import * as llvm from "llvm-node";

import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMValue } from "../../llvm/value";

export class LogicHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      const emitLocation = () => {
        this.generator.emitLocation(expression.left);
        this.generator.emitLocation(expression.right);
      };
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.AmpersandAmpersandToken:
          emitLocation();
          return this.handleLogicalAnd(left, right, env);
        case ts.SyntaxKind.BarBarToken:
          emitLocation();
          return this.handleLogicalOr(left, right, env);
        default:
          break;
      }
    }

    if (ts.isConditionalExpression(expression)) {
      const conditionValue = this.generator.handleExpression(expression.condition, env).derefToPtrLevel1();
      const condition = conditionValue.makeBoolean().derefToPtrLevel1();

      const tsType = this.generator.ts.checker.getTypeAtLocation(expression);

      let result = this.generator.builder.createAlloca(tsType.getLLVMType());

      const trueBlock = llvm.BasicBlock.create(this.generator.context, "trueTernary", this.generator.currentFunction);
      const falseBlock = llvm.BasicBlock.create(this.generator.context, "falseTernary", this.generator.currentFunction);
      const endBlock = llvm.BasicBlock.create(this.generator.context, "endTernary", this.generator.currentFunction);
      this.generator.builder.createCondBr(condition, trueBlock, falseBlock);

      this.generator.builder.setInsertionPoint(trueBlock);
      let thenResult = this.generator.handleExpression(expression.whenTrue, env).derefToPtrLevel1();

      if (tsType.isUnion() && !thenResult.type.isUnion()) {
        thenResult = this.generator.ts.union.create(thenResult);
      } else if (!tsType.isUnion() && thenResult.type.isUnion()) {
        thenResult = this.generator.ts.union.get(thenResult);
        thenResult = this.generator.builder.createBitCast(thenResult, tsType.getLLVMType());
      }

      this.generator.builder.createSafeStore(thenResult, result);
      this.generator.builder.createBr(endBlock);

      this.generator.builder.setInsertionPoint(falseBlock);
      let elseResult = this.generator.handleExpression(expression.whenFalse, env).derefToPtrLevel1();

      if (tsType.isUnion() && !elseResult.type.isUnion()) {
        elseResult = this.generator.ts.union.create(elseResult);
      } else if (!tsType.isUnion() && elseResult.type.isUnion()) {
        elseResult = this.generator.ts.union.get(elseResult);
        elseResult = this.generator.builder.createBitCast(elseResult, tsType.getLLVMType());
      }

      this.generator.builder.createSafeStore(elseResult, result);
      this.generator.builder.createBr(endBlock);

      this.generator.builder.setInsertionPoint(endBlock);


      return result;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }
    return;
  }

  private handleLogicalAnd(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.handleExpression(lhs, env).derefToPtrLevel1();
    const right = this.generator.handleExpression(rhs, env).derefToPtrLevel1();

    const lhsBoolean = left.makeBoolean();

    if (left.type.equals(right.type)) {
      return this.generator.builder.createSelect(lhsBoolean, right, left);
    }

    throw new Error(`Invalid operand types to logical AND:
        lhs: ${left.type.toString()}
        rhs: ${right.type.toString()}
        Error at: ${lhs.parent.getText()}`);
  }

  private handleLogicalOr(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.handleExpression(lhs, env).derefToPtrLevel1();
    const right = this.generator.handleExpression(rhs, env).derefToPtrLevel1();

    const lhsBoolean = left.makeBoolean();

    if (left.type.equals(right.type)) {
      return this.generator.builder.createSelect(lhsBoolean, left, right);
    }

    throw new Error("Invalid operand types to logical OR");
  }
}

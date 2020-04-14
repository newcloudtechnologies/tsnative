import { castToInt32AndBack, emitAsBoolean, emitAssignment } from "@emitter";
import { LLVMGenerator } from "@generator";
import { error } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export class UnaryEmitter {
  emitPrefixUnaryExpression(expression: ts.PrefixUnaryExpression, generator: LLVMGenerator): llvm.Value {
    const { operand } = expression;

    switch (expression.operator) {
      case ts.SyntaxKind.PlusToken:
        return generator.emitExpression(operand);
      case ts.SyntaxKind.MinusToken:
        return generator.builder.createFNeg(generator.emitExpression(operand));
      case ts.SyntaxKind.PlusPlusToken: {
        const lvalue = generator.emitValueExpression(operand);
        const oldValue = generator.createLoadIfNecessary(lvalue);
        const newValue = generator.builder.createFAdd(oldValue, llvm.ConstantFP.get(generator.context, 1));
        return emitAssignment(lvalue, newValue, generator);
      }
      case ts.SyntaxKind.MinusMinusToken: {
        const lvalue = generator.emitValueExpression(operand);
        const oldValue = generator.createLoadIfNecessary(lvalue);
        const newValue = generator.builder.createFSub(oldValue, llvm.ConstantFP.get(generator.context, 1));
        return emitAssignment(lvalue, newValue, generator);
      }
      case ts.SyntaxKind.TildeToken:
        return castToInt32AndBack([generator.emitExpression(operand)], generator, ([value]) =>
          generator.builder.createNot(value)
        );
      case ts.SyntaxKind.ExclamationToken:
        return generator.builder.createNot(emitAsBoolean(generator.emitExpression(operand), generator));
      default:
        return error(`Unhandled ts.PrefixUnaryOperator operator '${ts.SyntaxKind[expression.operator]}'`);
    }
  }

  emitPostfixUnaryExpression(expression: ts.PostfixUnaryExpression, generator: LLVMGenerator): llvm.Value {
    const { operand } = expression;

    switch (expression.operator) {
      case ts.SyntaxKind.PlusPlusToken: {
        const lvalue = generator.emitValueExpression(operand);
        const oldValue = generator.createLoadIfNecessary(lvalue);
        const newValue = generator.builder.createFAdd(oldValue, llvm.ConstantFP.get(generator.context, 1));
        emitAssignment(lvalue, newValue, generator);
        return oldValue;
      }
      case ts.SyntaxKind.MinusMinusToken: {
        const lvalue = generator.emitValueExpression(operand);
        const oldValue = generator.createLoadIfNecessary(lvalue);
        const newValue = generator.builder.createFSub(oldValue, llvm.ConstantFP.get(generator.context, 1));
        emitAssignment(lvalue, newValue, generator);
        return oldValue;
      }
    }
  }
}

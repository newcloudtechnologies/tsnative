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

import { emitAssignment } from "@emitter";
import {
  ArithmeticEmitter,
  BitwiseEmitter,
  ComparisonEmitter,
  CompoundEmitter,
  LogicEmitter
} from "@emitter/expression";
import { LLVMGenerator } from "@generator";
import { error } from "@utils";
import * as ts from "typescript";

export class BinaryEmitter {
  private readonly arithmetic: ArithmeticEmitter = new ArithmeticEmitter();
  private readonly comparison: ComparisonEmitter = new ComparisonEmitter();
  private readonly bitwise: BitwiseEmitter = new BitwiseEmitter();
  private readonly logic: LogicEmitter = new LogicEmitter();
  private readonly compound: CompoundEmitter = new CompoundEmitter();

  emit(expression: ts.BinaryExpression, generator: LLVMGenerator): llvm.Value {
    const { left, right } = expression;
    switch (expression.operatorToken.kind) {
      case ts.SyntaxKind.EqualsToken:
        return emitAssignment(generator.emitValueExpression(left), generator.emitExpression(right), generator);
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
        return this.comparison.emitStrictEquals(left, right, generator);
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
        return this.comparison.emitStrictNotEquals(left, right, generator);

      case ts.SyntaxKind.LessThanToken:
        return this.comparison.emitLessThan(left, right, generator);
      case ts.SyntaxKind.GreaterThanToken:
        return this.comparison.emitGreaterThan(left, right, generator);
      case ts.SyntaxKind.LessThanEqualsToken:
        return this.comparison.emitLessEqualsThan(left, right, generator);
      case ts.SyntaxKind.GreaterThanEqualsToken:
        return this.comparison.emitGreaterEqualsThan(left, right, generator);

      case ts.SyntaxKind.PlusToken:
        return this.arithmetic.emitBinaryPlus(left, right, generator);
      case ts.SyntaxKind.MinusToken:
        return this.arithmetic.emitBinaryMinus(left, right, generator);
      case ts.SyntaxKind.AsteriskToken:
        return this.arithmetic.emitMultiply(left, right, generator);
      case ts.SyntaxKind.SlashToken:
        return this.arithmetic.emitDivision(left, right, generator);
      case ts.SyntaxKind.PercentToken:
        return this.arithmetic.emitModulo(left, right, generator);

      case ts.SyntaxKind.AmpersandToken:
        return this.bitwise.emitBitwiseAnd(left, right, generator);
      case ts.SyntaxKind.BarToken:
        return this.bitwise.emitBitwiseOr(left, right, generator);
      case ts.SyntaxKind.CaretToken:
        return this.bitwise.emitBitwiseXor(left, right, generator);
      case ts.SyntaxKind.LessThanLessThanToken:
        return this.bitwise.emitLeftShift(left, right, generator);
      case ts.SyntaxKind.GreaterThanGreaterThanToken:
        return this.bitwise.emitRightShift(left, right, generator);
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
        return this.bitwise.emitLogicalRightShift(left, right, generator);

      case ts.SyntaxKind.AmpersandAmpersandToken:
        return this.logic.emitLogicalAnd(left, right, generator);
      case ts.SyntaxKind.BarBarToken:
        return this.logic.emitLogicalOr(left, right, generator);

      case ts.SyntaxKind.PlusEqualsToken:
        return this.compound.emitCompoundPlus(left, right, generator);
      case ts.SyntaxKind.MinusEqualsToken:
        return this.compound.emitCompoundMinus(left, right, generator);
      case ts.SyntaxKind.AsteriskEqualsToken:
        return this.compound.emitCompoundMultiply(left, right, generator);
      case ts.SyntaxKind.SlashEqualsToken:
        return this.compound.emitCompoundDivision(left, right, generator);
      case ts.SyntaxKind.PercentEqualsToken:
        return this.compound.emitCompoundModulo(left, right, generator);

      case ts.SyntaxKind.AmpersandEqualsToken:
        return this.compound.emitCompoundBitwiseAnd(left, right, generator);
      case ts.SyntaxKind.BarEqualsToken:
        return this.compound.emitCompoundBitwiseOr(left, right, generator);
      case ts.SyntaxKind.CaretEqualsToken:
        return this.compound.emitCompoundBitwiseXor(left, right, generator);
      case ts.SyntaxKind.LessThanLessThanEqualsToken:
        return this.compound.emitCompoundLeftShift(left, right, generator);
      case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
        return this.compound.emitCompoundRightShift(left, right, generator);
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
        return this.compound.emitCompoundLogicalRightShift(left, right, generator);

      default:
        return error(`Unhandled ts.BinaryExpression operator '${ts.SyntaxKind[expression.operatorToken.kind]}'`);
    }
  }
}

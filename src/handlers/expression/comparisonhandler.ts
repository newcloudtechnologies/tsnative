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

import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMValue } from "../../llvm/value";
import { LLVMType } from "../../llvm/type";

export class ComparisonHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isBinaryExpression(expression)) {
      const binaryExpression = expression as ts.BinaryExpression;
      const { left, right } = binaryExpression;
      switch (binaryExpression.operatorToken.kind) {
        case ts.SyntaxKind.EqualsEqualsToken:
        case ts.SyntaxKind.ExclamationEqualsToken:
          throw new Error(
            `Comparison with implicit conversion is not supported. Use '===' or '!==' instead of weakened operators. Error at: '${binaryExpression.getText()}'`
          );
        case ts.SyntaxKind.EqualsEqualsEqualsToken: {
          const lhs = this.generator.handleExpression(left, env);
          const rhs = this.generator.handleExpression(right, env);
          return this.handleStrictEquals(left, right, lhs, rhs, env);
        }
        case ts.SyntaxKind.ExclamationEqualsEqualsToken:
          return this.handleStrictNotEquals(left, right, env);

        case ts.SyntaxKind.LessThanToken:
          return this.handleLessThan(left, right, env);
        case ts.SyntaxKind.GreaterThanToken:
          return this.handleGreaterThan(left, right, env);
        case ts.SyntaxKind.LessThanEqualsToken:
          return this.handleLessEqualsThan(left, right, env);
        case ts.SyntaxKind.GreaterThanEqualsToken:
          return this.handleGreaterEqualsThan(left, right, env);
        default:
          break;
      }
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleStrictEquals(
    lhs: ts.Expression,
    rhs: ts.Expression,
    lhsLLVM: LLVMValue,
    rhsLLVM: LLVMValue,
    env?: Environment
  ): LLVMValue {
    lhsLLVM = this.generator.createLoadIfNecessary(lhsLLVM);
    rhsLLVM = this.generator.createLoadIfNecessary(rhsLLVM);

    const lhsLLVMType = lhsLLVM.type;
    const rhsLLVMType = rhsLLVM.type;

    if (lhsLLVMType.isTSNumber() && rhsLLVMType.isTSNumber()) {
      return lhsLLVM.createEquals(rhsLLVM).createHeapAllocated();
    }

    if (lhsLLVMType.isIntegerType() && rhsLLVMType.isIntegerType()) {
      return this.generator.builder.createICmpEQ(lhsLLVM, rhsLLVM).createHeapAllocated();
    }

    if (lhsLLVMType.isString() && rhsLLVMType.isString()) {
      const equals = this.generator.builtinString.getLLVMEquals();
      return this.generator.builder.createSafeCall(equals, [lhsLLVM, rhsLLVM]).createHeapAllocated();
    }

    if (lhsLLVM.isUnion()) {
      const extracted = lhsLLVM.extract(rhsLLVMType.ensurePointer());

      return this.handleStrictEquals(lhs, rhs, extracted, rhsLLVM, env);
    }

    if (!lhsLLVM.isIntersection() && rhsLLVM.isIntersection()) {
      if (!lhsLLVMType.isPointer()) {
        throw new Error(`Expected left hand side operand to be of PointerType, got ${lhsLLVMType.toString()}`);
      }

      const extracted = rhsLLVM.extract(lhsLLVMType);
      return this.handleStrictEquals(lhs, rhs, lhsLLVM, extracted, env);
    }

    if (lhsLLVMType.isIntersection() && rhsLLVMType.isIntersection()) {
      if (!lhsLLVMType.isPointer()) {
        throw new Error(`Expected left hand side operand to be of PointerType, got ${lhsLLVMType.toString()}`);
      }

      if (!rhsLLVMType.isPointer()) {
        throw new Error(`Expected right hand side operand to be of PointerType, got ${rhsLLVMType.toString()}`);
      }

      const lhsAddress = this.generator.builder.createPtrToInt(lhsLLVM, LLVMType.getInt32Type(this.generator));
      const rhsAddress = this.generator.builder.createPtrToInt(rhsLLVM, LLVMType.getInt32Type(this.generator));

      return this.generator.builder.createICmpEQ(lhsAddress, rhsAddress).createHeapAllocated();
    }

    if (lhsLLVMType.isPointerToStruct() && rhsLLVMType.isPointerToStruct()) {
      const lhsAddress = this.generator.builder.createPtrToInt(lhsLLVM, LLVMType.getInt32Type(this.generator));
      const rhsAddress = this.generator.builder.createPtrToInt(rhsLLVM, LLVMType.getInt32Type(this.generator));
      return this.generator.builder.createICmpEQ(lhsAddress, rhsAddress).createHeapAllocated();
    }

    throw new Error(`Invalid operand types to strict equals: 
                            lhs: ${lhsLLVMType.toString()} ${lhsLLVMType.typeIDName}
                            rhs: ${rhsLLVMType.toString()} ${rhsLLVMType.typeIDName}`);
  }

  private handleStrictNotEquals(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    return this.generator.builder
      .createNot(this.generator.builder.createLoad(this.handleStrictEquals(lhs, rhs, left, right, env)))
      .createHeapAllocated();
  }

  private handleLessThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createLessThan(right);
    }

    throw new Error(`Invalid operand types to less than: 
                            lhs: ${left.type.toString()} ${left.type.typeIDName}
                            rhs: ${right.type.toString()} ${right.type.typeIDName}`);
  }

  private handleGreaterThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createGreaterThan(right);
    }

    throw new Error(`Invalid operand types to greater than: 
                            lhs: ${left.type.toString()} ${left.type.typeIDName}
                            rhs: ${right.type.toString()} ${right.type.typeIDName}`);
  }

  private handleLessEqualsThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createLessEqualsThan(right);
    }

    throw new Error(`Invalid operand types to less equal than: 
                            lhs: ${left.type.toString()} ${left.type.typeIDName}
                            rhs: ${right.type.toString()} ${right.type.typeIDName}`);
  }

  private handleGreaterEqualsThan(lhs: ts.Expression, rhs: ts.Expression, env?: Environment): LLVMValue {
    const left: LLVMValue = this.generator.createLoadIfNecessary(this.generator.handleExpression(lhs, env));
    const right: LLVMValue = this.generator.createLoadIfNecessary(this.generator.handleExpression(rhs, env));

    if (left.type.isTSNumber() && right.type.isTSNumber()) {
      return left.createGreaterEqualsThan(right);
    }

    throw new Error(`Invalid operand types to greater equal than: 
                            lhs: ${left.type.toString()} ${left.type.typeIDName}
                            rhs: ${right.type.toString()} ${right.type.typeIDName}`);
  }
}

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

export class TemplateExpressionHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    if (ts.isTemplateExpression(expression)) {
      return this.handleTemplateExpression(expression, env);
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleTemplateExpression(expression: ts.TemplateExpression, env?: Environment) {
    const stringType = this.generator.builtinString.getLLVMType();
    const stringConstructor = this.generator.builtinString.getLLVMConstructor();
    const stringConcat = this.generator.builtinString.getLLVMConcat();
    let allocated = this.generator.gc.allocate(stringType.getPointerElementType());
    allocated = this.generator.builder.asVoidStar(allocated);

    const head = this.generator.builder.createGlobalStringPtr(expression.head.rawText || "");
    this.generator.builder.createSafeCall(stringConstructor, [allocated, head]);

    for (const span of expression.templateSpans) {
      const value = this.generator.handleExpression(span.expression, env);

      const allocatedSpanExpression = this.llvmValueToString(span.expression, value);

      allocated = this.generator.builder.createSafeCall(stringConcat, [
        this.generator.builder.asVoidStar(allocated),
        allocatedSpanExpression,
      ]);

      if (span.literal.rawText) {
        const allocatedLiteral = this.generator.gc.allocate(stringType.getPointerElementType());
        const literal = this.generator.builder.createGlobalStringPtr(span.literal.rawText);
        this.generator.builder.createSafeCall(stringConstructor, [
          this.generator.builder.asVoidStar(allocatedLiteral),
          literal,
        ]);

        allocated = this.generator.builder.createSafeCall(stringConcat, [
          this.generator.builder.asVoidStar(allocated),
          allocatedLiteral,
        ]);
      }
    }

    return allocated;
  }

  private llvmValueToString(expression: ts.Expression, value: LLVMValue) {
    const nakedType = value.type.unwrapPointer();
    if (!value.isTSPrimitivePtr() && !value.type.isArray()) {
      throw new Error(`Only primitives and arrays are supported, got '${value.type.toString()}'`);
    }

    let allocated;
    if (nakedType.isTSBoolean()) {
      const toString = this.generator.builtinBoolean.createToString();
      allocated = this.generator.builder.createSafeCall(toString, [this.generator.builder.asVoidStar(value)]);
    } else if (nakedType.isTSNumber()) {
      const toString = this.generator.builtinNumber.createToString();
      allocated = this.generator.builder.createSafeCall(toString, [this.generator.builder.asVoidStar(value)]);
    } else if (nakedType.isArray()) {
      const arrayType = this.generator.ts.checker.getTypeAtLocation(expression);
      const toString = this.generator.ts.array.createToString(arrayType, expression);

      allocated = this.generator.builder.createSafeCall(toString, [this.generator.builder.asVoidStar(value)]);
    } else {
      allocated = value;
    }

    return allocated;
  }
}

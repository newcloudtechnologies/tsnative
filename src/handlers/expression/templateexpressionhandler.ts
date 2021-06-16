/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { error } from "@utils";
import { createArrayToString } from "@handlers";
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
    const stringConstructor = this.generator.builtinString.getLLVMConstructor(expression);
    const stringConcat = this.generator.builtinString.getLLVMConcat(expression);
    let allocated = this.generator.gc.allocate(stringType.getPointerElementType());

    const head = this.generator.builder.createGlobalStringPtr(expression.head.rawText || "");
    this.generator.builder.createSafeCall(stringConstructor, [allocated, head]);

    for (const span of expression.templateSpans) {
      const value = this.generator.handleExpression(span.expression, env);

      const allocatedSpanExpression = this.llvmValueToString(expression, span.expression, value);

      allocated = this.generator.builder.createSafeCall(stringConcat, [
        this.generator.builder.asVoidStar(allocated),
        allocatedSpanExpression,
      ]);

      if (span.literal.rawText) {
        const allocatedLiteral = this.generator.gc.allocate(stringType.getPointerElementType());
        const literal = this.generator.builder.createGlobalStringPtr(span.literal.rawText);
        this.generator.builder.createSafeCall(stringConstructor, [allocatedLiteral, literal]);

        allocated = this.generator.builder.createSafeCall(stringConcat, [
          this.generator.builder.asVoidStar(allocated),
          allocatedLiteral,
        ]);
      }
    }

    return allocated;
  }

  private llvmValueToString(contextExpression: ts.Expression, expression: ts.Expression, value: LLVMValue) {
    const nakedType = value.type.unwrapPointer();
    if (!nakedType.isCppPrimitiveType() && !nakedType.isString() && !nakedType.isArray()) {
      error("Only primitives, strings and arrays are supported");
    }

    const stringType = this.generator.builtinString.getLLVMType();

    let allocated;
    if (nakedType.isCppPrimitiveType()) {
      const stringFromPrimitiveConstructor = this.generator.builtinString.getLLVMConstructor(
        contextExpression,
        expression
      );
      allocated = this.generator.gc.allocate(stringType.getPointerElementType());
      this.generator.builder.createSafeCall(stringFromPrimitiveConstructor, [allocated, value.getValue()]);
    } else if (nakedType.isArray()) {
      const arrayType = this.generator.ts.checker.getTypeAtLocation(expression);
      const toString = createArrayToString(arrayType, expression, this.generator);

      allocated = this.generator.builder.createSafeCall(toString, [this.generator.builder.asVoidStar(value)]);
    } else {
      allocated = value;
    }

    return allocated;
  }
}

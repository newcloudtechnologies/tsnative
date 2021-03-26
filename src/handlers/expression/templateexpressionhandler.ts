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

import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { checkIfLLVMString, error, getLLVMValue, isCppPrimitiveType } from "@utils";

export class TemplateExpressionHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
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
    const allocated = this.generator.gc.allocate(stringType.elementType);

    const head = this.generator.builder.createGlobalStringPtr(expression.head.rawText || "");
    this.generator.xbuilder.createSafeCall(stringConstructor, [allocated, head]);

    for (const span of expression.templateSpans) {
      const value = getLLVMValue(this.generator.handleExpression(span.expression, env), this.generator);

      if (!isCppPrimitiveType(value.type) && !checkIfLLVMString(value.type)) {
        error("Only primitives and strings supported");
      }

      let allocatedSpanExpression;
      if (isCppPrimitiveType(value.type)) {
        const stringFromPrimitiveConstructor = this.generator.builtinString.getLLVMConstructor(
          expression,
          span.expression
        );
        allocatedSpanExpression = this.generator.gc.allocate(stringType.elementType);
        this.generator.xbuilder.createSafeCall(stringFromPrimitiveConstructor, [allocatedSpanExpression, value]);
      } else {
        allocatedSpanExpression = value;
      }

      this.generator.xbuilder.createSafeCall(stringConcat, [
        allocated,
        this.generator.xbuilder.asVoidStar(allocated),
        allocatedSpanExpression,
      ]);

      if (span.literal.rawText) {
        const allocatedLiteral = this.generator.gc.allocate(stringType.elementType);
        const literal = this.generator.builder.createGlobalStringPtr(span.literal.rawText);
        this.generator.xbuilder.createSafeCall(stringConstructor, [allocatedLiteral, literal]);

        this.generator.xbuilder.createSafeCall(stringConcat, [
          allocated,
          this.generator.xbuilder.asVoidStar(allocated),
          allocatedLiteral,
        ]);
      }
    }

    return allocated;
  }
}

/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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
      this.generator.emitLocation(expression);
      return this.handleTemplateExpression(expression, env);
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleTemplateExpression(expression: ts.TemplateExpression, env?: Environment) {
    const stringType = this.generator.ts.str.getLLVMType();
    const stringConstructor = this.generator.ts.str.getLLVMConstructor();
    const stringConcat = this.generator.ts.str.getLLVMConcat();
    let allocated = this.generator.gc.allocate(stringType.getPointerElementType());
    allocated = this.generator.builder.asVoidStar(allocated);

    const head = this.generator.builder.createGlobalStringPtr(expression.head.rawText || "");
    this.generator.builder.createSafeCall(stringConstructor, [allocated, head]);

    for (const span of expression.templateSpans) {
      const value = this.generator.handleExpression(span.expression, env).derefToPtrLevel1();

      const allocatedSpanExpression = this.generator.ts.obj.objectToString(value);

      allocated = this.generator.builder.createSafeCall(stringConcat, [
        this.generator.builder.asVoidStar(allocated),
        this.generator.builder.asVoidStar(allocatedSpanExpression)
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
          this.generator.builder.asVoidStar(allocatedLiteral),
        ]);
      }
    }

    return allocated;
  }
}

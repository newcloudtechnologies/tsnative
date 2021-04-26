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
import {
  checkIfLLVMArray,
  checkIfLLVMString,
  error,
  getLLVMValue,
  isCppPrimitiveType,
  unwrapPointerType,
} from "@utils";
import { createArrayToString } from "@handlers";

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
    let allocated: llvm.Value = this.generator.gc.allocate(stringType.elementType);

    const head = this.generator.builder.createGlobalStringPtr(expression.head.rawText || "");
    this.generator.xbuilder.createSafeCall(stringConstructor, [allocated, head]);

    for (const span of expression.templateSpans) {
      const value = this.generator.handleExpression(span.expression, env);
      const allocatedSpanExpression = this.llvmValueToString(expression, span.expression, value);

      allocated = this.generator.xbuilder.createSafeCall(stringConcat, [
        this.generator.xbuilder.asVoidStar(allocated),
        allocatedSpanExpression,
      ]);

      if (span.literal.rawText) {
        const allocatedLiteral = this.generator.gc.allocate(stringType.elementType);
        const literal = this.generator.builder.createGlobalStringPtr(span.literal.rawText);
        this.generator.xbuilder.createSafeCall(stringConstructor, [allocatedLiteral, literal]);

        allocated = this.generator.xbuilder.createSafeCall(stringConcat, [
          this.generator.xbuilder.asVoidStar(allocated),
          allocatedLiteral,
        ]);
      }
    }

    return allocated;
  }

  private llvmValueToString(contextExpression: ts.Expression, expression: ts.Expression, value: llvm.Value) {
    const nakedType = unwrapPointerType(value.type);
    if (!isCppPrimitiveType(nakedType) && !checkIfLLVMString(nakedType) && !checkIfLLVMArray(nakedType)) {
      error("Only primitives, strings and arrays are supported");
    }

    const stringType = this.generator.builtinString.getLLVMType();

    let allocated;
    if (isCppPrimitiveType(nakedType)) {
      const stringFromPrimitiveConstructor = this.generator.builtinString.getLLVMConstructor(
        contextExpression,
        expression
      );
      allocated = this.generator.gc.allocate(stringType.elementType);
      this.generator.xbuilder.createSafeCall(stringFromPrimitiveConstructor, [
        allocated,
        getLLVMValue(value, this.generator),
      ]);
    } else if (checkIfLLVMArray(nakedType)) {
      const arrayType = this.generator.checker.getTypeAtLocation(expression);
      const toString = createArrayToString(arrayType, expression, this.generator);

      allocated = this.generator.gc.allocate(stringType.elementType);
      this.generator.xbuilder.createSafeCall(toString, [allocated, this.generator.xbuilder.asVoidStar(value)]);
    } else {
      allocated = value;
    }

    return allocated;
  }
}

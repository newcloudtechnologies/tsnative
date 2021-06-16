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

import {
  AccessHandler,
  ArithmeticHandler,
  CastHandler,
  AssignmentHandler,
  BitwiseHandler,
  ComparisonHandler,
  CompoundAssignmentHandler,
  FunctionHandler,
  IdentifierHandler,
  LiteralHandler,
  LogicHandler,
  ParenthesizedHandler,
  UnaryHandler,
  NoopHandler,
  TemplateExpressionHandler,
  NullKeywordHandler,
} from "@handlers/expression";
import { LLVMGenerator } from "@generator";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { LLVMValue } from "../../llvm/value";

export class ExpressionHandlerChain {
  private readonly root: AbstractExpressionHandler;

  constructor(generator: LLVMGenerator) {
    const noop = new NoopHandler(generator);

    noop
      .setNext(new AccessHandler(generator))
      .setNext(new ArithmeticHandler(generator))
      .setNext(new AssignmentHandler(generator))
      .setNext(new BitwiseHandler(generator))
      .setNext(new CastHandler(generator))
      .setNext(new ComparisonHandler(generator))
      .setNext(new CompoundAssignmentHandler(generator))
      .setNext(new FunctionHandler(generator))
      .setNext(new IdentifierHandler(generator))
      .setNext(new LiteralHandler(generator))
      .setNext(new LogicHandler(generator))
      .setNext(new ParenthesizedHandler(generator))
      .setNext(new UnaryHandler(generator))
      .setNext(new TemplateExpressionHandler(generator))
      .setNext(new NullKeywordHandler(generator));

    this.root = noop;
  }

  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    return this.root.handle(expression, env);
  }
}

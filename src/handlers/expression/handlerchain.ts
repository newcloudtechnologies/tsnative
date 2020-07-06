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
} from "@handlers/expression";
import { LLVMGenerator } from "@generator";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";

export class ExpressionHandlerChain {
  private readonly root: AbstractExpressionHandler;

  constructor(generator: LLVMGenerator) {
    const access = new AccessHandler(generator);
    const arithmetic = new ArithmeticHandler(generator);
    const assignment = new AssignmentHandler(generator);
    const bitwise = new BitwiseHandler(generator);
    const comparison = new ComparisonHandler(generator);
    const compound = new CompoundAssignmentHandler(generator);
    const fn = new FunctionHandler(generator);
    const identifier = new IdentifierHandler(generator);
    const literal = new LiteralHandler(generator);
    const logic = new LogicHandler(generator);
    const parentheses = new ParenthesizedHandler(generator);
    const unary = new UnaryHandler(generator);

    access.setNext(arithmetic);
    arithmetic.setNext(assignment);
    assignment.setNext(bitwise);
    bitwise.setNext(comparison);
    comparison.setNext(compound);
    compound.setNext(fn);
    fn.setNext(identifier);
    identifier.setNext(literal);
    literal.setNext(logic);
    logic.setNext(parentheses);
    parentheses.setNext(unary);

    this.root = access;
  }

  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    return this.root.handle(expression, env);
  }
}

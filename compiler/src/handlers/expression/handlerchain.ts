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
  OperatorInHandler
} from "../../handlers/expression";
import { LLVMGenerator } from "../../generator";
import { DebugInfo } from "../../generator/debug_info";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "../../scope";
import { LLVMValue } from "../../llvm/value";
import { CommaHandler } from "./commahandler";

export class ExpressionHandlerChain {
  private readonly root: AbstractExpressionHandler;
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    const noop = new NoopHandler(generator);
    this.generator = generator;

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
      .setNext(new OperatorInHandler(generator))
      .setNext(new CommaHandler(generator));

    this.root = noop;
  }

  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    try {
      return this.root.handle(expression, env);
    }
    catch (e) {
      console.log(this.generator.module.print());

      const location = DebugInfo.getSourceLocation(expression);
      console.log(`File: '${expression.getSourceFile().fileName}'\n` +
                  `Expression: '${expression.getFullText()}'\n` +
                  `Line: '${location.lineNo.toString()}'\n` +
                  `Column: '${location.column.toString()}'`);
      
      throw e;
    }
  }
}

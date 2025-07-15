import { LLVMGenerator } from "../../generator";
import * as ts from "typescript";

import {
  BlockHandler,
  BranchHandler,
  BreakHandler,
  BypassingHandler,
  ClassHandler,
  ExpressionStatementHandler,
  ImportsHandler,
  LoopHandler,
  ModuleHandler,
  ReturnHandler,
  TypeAliasHandler,
  VariableHandler,
  SwitchHandler,
  EnumHandler,
  ExceptionHandler,
} from "../../handlers/node";

import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";
import { FunctionDeclarationHandler } from "./functiondeclarationhandler";

export class NodeHandlerChain {
  private readonly root: AbstractNodeHandler;

  constructor(generator: LLVMGenerator) {
    const imports = new ImportsHandler(generator);

    imports
      .setNext(new BlockHandler(generator))
      .setNext(new FunctionDeclarationHandler(generator))
      .setNext(new BranchHandler(generator))
      .setNext(new BreakHandler(generator))
      .setNext(new BypassingHandler(generator))
      .setNext(new ClassHandler(generator))
      .setNext(new ExpressionStatementHandler(generator))
      .setNext(new LoopHandler(generator))
      .setNext(new ModuleHandler(generator))
      .setNext(new ReturnHandler(generator))
      .setNext(new TypeAliasHandler(generator))
      .setNext(new VariableHandler(generator))
      .setNext(new SwitchHandler(generator))
      .setNext(new EnumHandler(generator))
      .setNext(new ExceptionHandler(generator));

    this.root = imports;
  }

  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    return this.root.handle(node, parentScope, env);
  }
}

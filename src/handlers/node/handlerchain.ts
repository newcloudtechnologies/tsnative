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

import { LLVMGenerator } from "../../generator";
import * as ts from "typescript";

import {
  BlockHandler,
  BranchHandler,
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
} from "../../handlers/node";

import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";

export class NodeHandlerChain {
  private readonly root: AbstractNodeHandler;

  constructor(generator: LLVMGenerator) {
    const imports = new ImportsHandler(generator);

    imports
      .setNext(new BlockHandler(generator))
      .setNext(new BranchHandler(generator))
      .setNext(new BypassingHandler(generator))
      .setNext(new ClassHandler(generator))
      .setNext(new ExpressionStatementHandler(generator))
      .setNext(new LoopHandler(generator))
      .setNext(new ModuleHandler(generator))
      .setNext(new ReturnHandler(generator))
      .setNext(new TypeAliasHandler(generator))
      .setNext(new VariableHandler(generator))
      .setNext(new SwitchHandler(generator))
      .setNext(new EnumHandler(generator));

    this.root = imports;
  }

  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    return this.root.handle(node, parentScope, env);
  }
}

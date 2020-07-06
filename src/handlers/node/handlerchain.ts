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

import { LLVMGenerator } from "@generator";
import * as ts from "typescript";

import {
  BlockHandler,
  BranchHandler,
  BypassingHandler,
  ClassHandler,
  ExpressionStatementHandler,
  LoopHandler,
  ModuleHandler,
  ReturnHandler,
  TypeAliasHandler,
  VariableHandler,
} from "@handlers/node";

import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "@scope";

export class NodeHandlerChain {
  private readonly root: AbstractNodeHandler;

  constructor(generator: LLVMGenerator) {
    const block = new BlockHandler(generator);
    const branch = new BranchHandler(generator);
    const bypassing = new BypassingHandler(generator);
    const clazz = new ClassHandler(generator);
    const expressionStatement = new ExpressionStatementHandler(generator);
    const loop = new LoopHandler(generator);
    const module = new ModuleHandler(generator);
    const ret = new ReturnHandler(generator);
    const typeAlias = new TypeAliasHandler(generator);
    const variable = new VariableHandler(generator);

    block.setNext(branch);
    branch.setNext(bypassing);
    bypassing.setNext(clazz);
    clazz.setNext(expressionStatement);
    expressionStatement.setNext(loop);
    loop.setNext(module);
    module.setNext(ret);
    ret.setNext(typeAlias);
    typeAlias.setNext(variable);

    this.root = block;
  }

  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    return this.root.handle(node, parentScope, env);
  }
}

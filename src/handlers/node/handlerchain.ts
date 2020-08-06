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
  FunctionDeclarationHandler,
  ImportsHandler,
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
    const imports = new ImportsHandler(generator);
    const functionDeclaraion = new FunctionDeclarationHandler(generator);

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

    imports.setNext(typeAlias);
    typeAlias.setNext(expressionStatement);
    expressionStatement.setNext(variable);
    variable.setNext(functionDeclaraion);
    functionDeclaraion.setNext(block);
    block.setNext(branch);
    branch.setNext(bypassing);
    bypassing.setNext(clazz);
    clazz.setNext(loop);
    loop.setNext(module);
    module.setNext(ret);

    this.root = imports;
  }

  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    return this.root.handle(node, parentScope, env);
  }
}

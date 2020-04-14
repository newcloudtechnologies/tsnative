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

import { ClassDeclarationEmitter } from "./declaration/classemitter";
import { ModuleDeclarationEmitter } from "./declaration/moduleemitter";
import { AccessEmitter } from "./expression/accessemitter";
import { BinaryEmitter } from "./expression/binaryemitter";
import { FunctionEmitter } from "./expression/functionemitter";
import { IdentifierEmitter } from "./expression/identifieremitter";
import { LiteralEmitter } from "./expression/literalemitter";
import { UnaryEmitter } from "./expression/unaryemitter";
import { BlockEmitter } from "./statement/blockemitter";
import { BranchEmitter } from "./statement/branchemitter";
import { ExpressionStatementEmitter } from "./statement/expressionstatementemitter";
import { LoopEmitter } from "./statement/loopemitter";
import { ReturnEmitter } from "./statement/returnemitter";
import { VariableEmitter } from "./statement/variableemitter";

export class LLVMEmitter {
  readonly unary: UnaryEmitter = new UnaryEmitter();
  readonly binary: BinaryEmitter = new BinaryEmitter();
  readonly literal: LiteralEmitter = new LiteralEmitter();
  readonly access: AccessEmitter = new AccessEmitter();
  readonly func: FunctionEmitter = new FunctionEmitter();
  readonly identifier: IdentifierEmitter = new IdentifierEmitter();
  readonly class: ClassDeclarationEmitter = new ClassDeclarationEmitter();
  readonly module: ModuleDeclarationEmitter = new ModuleDeclarationEmitter();
  readonly block: BlockEmitter = new BlockEmitter();
  readonly branch: BranchEmitter = new BranchEmitter();
  readonly expressionStatement: ExpressionStatementEmitter = new ExpressionStatementEmitter();
  readonly loop: LoopEmitter = new LoopEmitter();
  readonly return: ReturnEmitter = new ReturnEmitter();
  readonly variable: VariableEmitter = new VariableEmitter();
}

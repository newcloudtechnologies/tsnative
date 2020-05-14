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

import { ExpressionHandlerChain } from "@handlers/expression";
import { NodeHandlerChain } from "@handlers/node";
import { Scope, SymbolTable } from "@scope";
import { createLLVMFunction, error, isValueTy } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { BuiltinString, BuiltinInt8, BuiltinUInt32, GC } from "@builtins";

export class LLVMGenerator {
  readonly checker: ts.TypeChecker;
  readonly module: llvm.Module;
  readonly context: llvm.LLVMContext;
  readonly symbolTable: SymbolTable;
  readonly program: ts.Program;

  private irBuilder: llvm.IRBuilder;

  readonly expressionHandlerChain = new ExpressionHandlerChain(this);
  readonly nodeHandlerChain = new NodeHandlerChain(this);

  readonly builtinInt8: BuiltinInt8;
  readonly builtinUInt32: BuiltinUInt32;
  readonly builtinString: BuiltinString;

  private garbageCollector: GC | undefined;

  constructor(program: ts.Program) {
    this.program = program;
    this.checker = program.getTypeChecker();
    this.context = new llvm.LLVMContext();
    this.module = new llvm.Module("main", this.context);
    this.irBuilder = new llvm.IRBuilder(this.context);
    this.symbolTable = new SymbolTable();

    this.builtinInt8 = new BuiltinInt8(this);
    this.builtinUInt32 = new BuiltinUInt32(this);
    this.builtinString = new BuiltinString(this);
  }

  createModule(): llvm.Module {
    const mainReturnType = llvm.Type.getInt32Ty(this.context);
    const { fn: main } = createLLVMFunction(mainReturnType, [], "main", this.module);
    const entryBlock = llvm.BasicBlock.create(this.context, "entry", main);

    this.builder.setInsertionPoint(entryBlock);
    for (const sourceFile of this.program.getSourceFiles()) {
      this.symbolTable.addScope(sourceFile.fileName);
      sourceFile.forEachChild((node) => this.handleNode(node, this.symbolTable.currentScope));
    }

    this.builder.createRet(llvm.ConstantInt.get(this.context, 0));

    try {
      llvm.verifyModule(this.module);
    } catch (error) {
      error.message += "\n" + this.module.print();
      throw error;
    }

    return this.module;
  }

  initGC(): void {
    const stdlib = this.program.getSourceFiles().find((sourceFile) => sourceFile.fileName.endsWith("lib.std.d.ts"));
    if (!stdlib) {
      error("Standard library not found");
    }
    stdlib.forEachChild((node) => {
      if (ts.isClassDeclaration(node)) {
        const clazz = node as ts.ClassDeclaration;
        const clazzName = this.checker.getTypeAtLocation(clazz).getSymbol()!.escapedName;
        if (clazzName === "GC") {
          this.garbageCollector = new GC(clazz, this);
        }
      }
    });
    if (!this.garbageCollector) {
      error("GC declaration not found");
    }
  }

  withLocalBuilder<R>(action: () => R): R {
    const builder = this.builder;
    this.irBuilder = new llvm.IRBuilder(this.currentFunction.getEntryBlock()!);
    const result: R = action();
    this.irBuilder = builder;
    return result;
  }

  withInsertBlockKeeping<R>(action: () => R): R {
    const insertBlock = this.builder.getInsertBlock();
    const result = action();
    this.builder.setInsertionPoint(insertBlock!);
    return result;
  }

  handleNode(node: ts.Node, parentScope: Scope): void {
    if (!this.nodeHandlerChain.handle(node, parentScope))
      error(`Unhandled ts.Node '${ts.SyntaxKind[node.kind]}': ${node.getText()}`);
  }

  handleValueExpression(expression: ts.Expression): llvm.Value {
    const value = this.expressionHandlerChain.handle(expression);
    if (value) {
      return value;
    }

    return error(`Unhandled expression of kind ${expression.kind}`);
  }

  handleExpression(expression: ts.Expression): llvm.Value {
    const value = this.handleValueExpression(expression);
    return this.createLoadIfNecessary(value);
  }

  createLoadIfNecessary(value: llvm.Value) {
    if (value.type.isPointerTy() && isValueTy(value.type.elementType)) {
      return this.builder.createLoad(value, value.name + ".load");
    }
    return value;
  }

  get builder(): llvm.IRBuilder {
    return this.irBuilder;
  }

  get isCurrentBlockTerminated(): boolean {
    return Boolean(this.builder.getInsertBlock()?.getTerminator());
  }

  get currentFunction(): llvm.Function {
    const insertBlock = this.builder.getInsertBlock();
    if (!insertBlock) {
      return error("Cannot get current LLVM function: no insert block");
    }
    return insertBlock.parent!;
  }

  get gc(): GC {
    if (!this.garbageCollector) {
      this.initGC();
    }
    return this.garbageCollector!;
  }
}

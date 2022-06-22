/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { ExpressionHandlerChain } from "../handlers/expression";
import { NodeHandlerChain } from "../handlers/node";
import { Scope, SymbolTable, Environment, addClassScope } from "../scope";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { GC, BuiltinTSClosure, BuiltinIteratorResult, BuiltinNumber, BuiltinBoolean } from "../tsbuiltins";
import { MetaInfoStorage } from "../generator";
import { GC_DEFINITION, ITERABLE_DEFINITION, CLOSURE_DEFINITION } from "../../std/constants";
import { SizeOf } from "../cppintegration";
import { LLVM } from "../llvm/llvm";
import { TS } from "../ts/ts";
import { LLVMConstantInt, LLVMValue } from "../llvm/value";
import { Builder } from "../builder/builder";
import { LLVMType } from "../llvm/type";
import { Declaration } from "../ts/declaration";
import { DebugInfo } from "./debug_info";

enum InternalNames {
  Environment = "__environment__",
  FunctionScope = "__function_scope__",
  Object = "__object__",
  This = "this",
  TypeLiteral = "__tl__",
}

export class LLVMGenerator {
  readonly module: llvm.Module;
  readonly context: llvm.LLVMContext;
  readonly symbolTable: SymbolTable;
  private readonly metainfoStorage = new MetaInfoStorage();

  readonly program: ts.Program;
  private currentSource: ts.SourceFile | undefined;

  private irBuilder: Builder;

  readonly expressionHandlerChain = new ExpressionHandlerChain(this);
  readonly nodeHandlerChain = new NodeHandlerChain(this);

  readonly builtinNumber: BuiltinNumber;
  readonly builtinBoolean: BuiltinBoolean;

  private builtinTSClosure: BuiltinTSClosure | undefined;
  private garbageCollector: GC | undefined;

  private builtinIteratorResult: BuiltinIteratorResult | undefined;

  readonly sizeOf: SizeOf;
  readonly llvm: LLVM;
  readonly ts: TS;

  readonly internalNames = InternalNames;

  private readonly debugInfo: DebugInfo | undefined;

  constructor(program: ts.Program, generateDebugInfo = false) {
    this.program = program;
    this.context = new llvm.LLVMContext();
    this.module = new llvm.Module("main", this.context);
    this.irBuilder = new Builder(this, null);
    this.symbolTable = new SymbolTable();

    this.builtinNumber = new BuiltinNumber(this);
    this.builtinBoolean = new BuiltinBoolean(this);

    this.sizeOf = new SizeOf();

    this.llvm = new LLVM(this);

    this.ts = new TS(this);

    if (generateDebugInfo) {
      this.debugInfo = new DebugInfo(this);
    }
  }

  createModule(): llvm.Module {
    const dbg = this.debugInfo;
    const mainReturnType = LLVMType.getInt32Type(this);
    const { fn: main } = this.llvm.function.create(mainReturnType, [], "main");

    const entryBlock = llvm.BasicBlock.create(this.context, "entry", main.unwrapped as llvm.Function);

    this.builder.setInsertionPoint(entryBlock);

    this.ts.null.init();
    this.ts.undef.init();

    if (dbg) {
      dbg.emitMainScope(main.unwrapped as llvm.Function);
    }

    for (const sourceFile of this.program.getSourceFiles()) {
      this.currentSource = sourceFile;
      this.symbolTable.addScope(sourceFile.fileName);

      sourceFile.forEachChild((node) => this.handleNode(node, this.symbolTable.currentScope));
    }

    this.builder.createSafeRet(LLVMConstantInt.get(this, 0));

    if (dbg) {
      dbg.emitProcedureEnd(main.unwrapped as llvm.Function);
      dbg.finalize();
    }

    try {
      llvm.verifyModule(this.module);
    } catch (error) {
      error.message += "\n" + this.module.print();
      throw error;
    }

    return this.module;
  }

  initGC(): void {
    const gc = this.program.getSourceFiles().find((sourceFile) => sourceFile.fileName === GC_DEFINITION);
    if (!gc) {
      throw new Error("No std GC file found");
    }
    gc.forEachChild((node) => {
      if (ts.isClassDeclaration(node)) {
        const clazz = Declaration.create(node as ts.ClassDeclaration, this);
        const clazzName = clazz.type.getSymbol().escapedName;
        if (clazzName === "GC") {
          this.garbageCollector = new GC(clazz, this);
        }
      }
    });
    if (!this.garbageCollector) {
      throw new Error("GC declaration not found");
    }
  }

  initTSClosure(): void {
    const tsclosure = this.program.getSourceFiles().find((sourceFile) => sourceFile.fileName === CLOSURE_DEFINITION);
    if (!tsclosure) {
      throw new Error("No std utility source file found");
    }
    tsclosure.forEachChild((node) => {
      if (ts.isClassDeclaration(node)) {
        const clazz = Declaration.create(node as ts.ClassDeclaration, this);
        const clazzName = clazz.type.getSymbol().escapedName;
        if (clazzName === "TSClosure") {
          this.builtinTSClosure = new BuiltinTSClosure(this);
        }
      }
    });
    if (!this.builtinTSClosure) {
      throw new Error("TSClosure declaration not found");
    }
  }

  initIteratorResult() {
    const iterabledefs = this.program
      .getSourceFiles()
      .find((sourceFile) => sourceFile.fileName === ITERABLE_DEFINITION);

    if (!iterabledefs) {
      throw new Error("No iterable definitions source file found");
    }
    iterabledefs.forEachChild((node) => {
      if (ts.isClassDeclaration(node)) {
        const clazz = Declaration.create(node as ts.ClassDeclaration, this);
        const clazzName = clazz.type.getSymbol().escapedName;
        if (clazzName === "IteratorResult") {
          this.builtinIteratorResult = new BuiltinIteratorResult(clazz, this);
          addClassScope(node, this.symbolTable.globalScope, this);
        }
      }
    });
    if (!this.builtinIteratorResult) {
      throw new Error("IteratorResult declaration not found");
    }
  }

  withLocalBuilder<R>(action: () => R): R {
    const builder = this.builder;
    this.irBuilder = new Builder(this, this.currentFunction.getEntryBlock());
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

  handleNode(node: ts.Node, parentScope: Scope, env?: Environment): void {
    if (!this.nodeHandlerChain.handle(node, parentScope, env))
      throw new Error(`Unhandled ts.Node '${ts.SyntaxKind[node.kind]}': ${node.getText()}`);
  }

  handleExpression(expression: ts.Expression, env?: Environment): LLVMValue {
    const value = this.expressionHandlerChain.handle(expression, env);
    if (value) {
      return value;
    }

    throw new Error(
      `Unhandled expression of kind ${expression.kind}: '${ts.SyntaxKind[expression.kind]}' at ${expression.getText()}`
    );
  }

  get meta() {
    return this.metainfoStorage;
  }

  get currentSourceFile(): ts.SourceFile {
    if (!this.currentSource) {
      throw new Error("No current source available");
    }
    return this.currentSource;
  }

  get builder() {
    return this.irBuilder;
  }

  get isCurrentBlockTerminated(): boolean {
    return Boolean(this.builder.getInsertBlock()?.getTerminator());
  }

  get currentFunction(): llvm.Function {
    const insertBlock = this.builder.getInsertBlock();
    if (!insertBlock) {
      throw new Error("Cannot get current LLVM function: no insert block");
    }
    return insertBlock.parent!;
  }

  get gc(): GC {
    if (!this.garbageCollector) {
      this.initGC();
    }
    return this.garbageCollector!;
  }

  get tsclosure() {
    if (!this.builtinTSClosure) {
      this.initTSClosure();
    }

    return this.builtinTSClosure!;
  }

  get iteratorResult() {
    if (!this.builtinIteratorResult) {
      this.initIteratorResult();
    }

    return this.builtinIteratorResult!;
  }

  get randomString() {
    return Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "")
      .substr(0, 5);
  }

  getDebugInfo(): DebugInfo | undefined {
    return this.debugInfo;
  }

  emitLocation(node: ts.Node | undefined) {
    this.getDebugInfo()?.emitLocation(node);
  }

  applyLocation(callInst: llvm.CallInst, decl: ts.Node) {
    this.getDebugInfo()?.applyLocation(callInst, decl);
  }
}

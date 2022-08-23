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
import { BuiltinTSClosure, BuiltinIteratorResult, BuiltinNumber, BuiltinBoolean } from "../tsbuiltins";
import { GC } from "../tsbuiltins/gc"
import { Runtime } from "../tsbuiltins/runtime";
import { MetaInfoStorage } from "../generator";
import { LLVM } from "../llvm/llvm";
import { TS } from "../ts/ts";
import { LLVMConstantInt, LLVMValue } from "../llvm/value";
import { Builder } from "../builder/builder";
import { LLVMType } from "../llvm/type";
import { Declaration } from "../ts/declaration";
import { DebugInfo } from "./debug_info";

const stdlib = require("std/constants");

enum InternalNames {
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

  private _builtinNumber: BuiltinNumber | undefined;
  private _builtinBoolean: BuiltinBoolean | undefined;

  private builtinTSClosure: BuiltinTSClosure | undefined;
  private globalRuntime: Runtime | undefined;

  private builtinIteratorResult: BuiltinIteratorResult | undefined;

  readonly llvm: LLVM;

  private _ts: TS | undefined;

  readonly internalNames = InternalNames;

  private readonly debugInfo: DebugInfo | undefined;

  private initialized = false;

  constructor(program: ts.Program, generateDebugInfo = false) {
    this.program = program;
    this.context = new llvm.LLVMContext();
    this.module = new llvm.Module("main", this.context);
    this.irBuilder = new Builder(this, null);

    this.llvm = new LLVM(this);

    this._ts = new TS(this);

    this.symbolTable = new SymbolTable(this);

    if (generateDebugInfo) {
      this.debugInfo = new DebugInfo(this);
    }
  }

  init() {
    this._builtinNumber = new BuiltinNumber(this);
    this._builtinBoolean = new BuiltinBoolean(this);

    this.initRuntime();
    this.initialized = true;

    return this;
  }

  createModule(): llvm.Module {
    if (!this.initialized) {
      throw new Error("Generator in not initialized. Call LLVMGenerator.init first");
    }

    const dbg = this.debugInfo;
    const mainReturnType = LLVMType.getInt32Type(this);
    const { fn: main } = this.llvm.function.create(mainReturnType, [], "__ts_main");

    const entryBlock = llvm.BasicBlock.create(this.context, "entry", main.unwrapped as llvm.Function);

    this.builder.setInsertionPoint(entryBlock);

    this.runtime.initGlobalState();
    this.ts.null.init();
    this.ts.undef.init();

    if (dbg) {
      dbg.emitMainScope(main.unwrapped as llvm.Function);
    }

    this.handleSources(this.program.getSourceFiles())

    this.builder.createSafeRet(LLVMConstantInt.get(this, 0));

    if (dbg) {
      dbg.emitProcedureEnd(main.unwrapped as llvm.Function);
      dbg.finalize();
    }

    try {
      llvm.verifyModule(this.module);
    } catch (error) {
      let e = error as Error;
      e.message += "\n" + this.module.print();
      throw e;
    }

    return this.module;
  }

  private initRuntime(): void {
    const runtime = this.program.getSourceFiles().find((sourceFile) => sourceFile.fileName === stdlib.RUNTIME_DEFINITION);
    if (!runtime) {
      throw new Error("No std Runtime file found");
    }
    runtime.forEachChild((node) => {
      if (ts.isClassDeclaration(node)) {
        const clazz = Declaration.create(node as ts.ClassDeclaration, this);
        const clazzName = clazz.type.getSymbol().escapedName;
        if (clazzName === "Runtime") {
          this.globalRuntime = new Runtime(clazz, this);
        }
      }
    });
    if (!this.globalRuntime) {
      throw new Error("Runtime declaration not found");
    }
  }

  handleSources(sources: readonly ts.SourceFile[]) {
    for (const sourceFile of sources) {
      this.currentSource = sourceFile;
      this.symbolTable.addScope(sourceFile.fileName);

      this.symbolTable.currentScope.initializeVariablesAndFunctionDeclarations(this.currentSourceFile, this);

      sourceFile.forEachChild((node) => this.handleNode(node, this.symbolTable.currentScope));
    }
  }

  initTSClosure(): void {
    const tsclosure = this.program.getSourceFiles().find((sourceFile) => sourceFile.fileName === stdlib.CLOSURE_DEFINITION);
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
      .find((sourceFile) => sourceFile.fileName === stdlib.ITERABLE_DEFINITION);

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
    if (!this.globalRuntime) {
      throw new Error("Runtime was not initialized");
    }
    
    return this.runtime.gc;
  }

  get runtime(): Runtime {
    if (!this.globalRuntime) {
      throw new Error("Runtime was not initialized");
    }
    return this.globalRuntime!;
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

  get builtinNumber() {
    if (!this._builtinNumber) {
      throw new Error("Builtin 'Number' is not initialized");
    }

    return this._builtinNumber;
  }

  get builtinBoolean() {
    if (!this._builtinBoolean) {
      throw new Error("Builtin 'Boolean' is not initialized");
    }

    return this._builtinBoolean;
  }

  get ts() {
    if (!this._ts) {
      throw new Error("'TS' is not initialized");
    }

    return this._ts;
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

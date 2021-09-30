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

import { ExpressionHandlerChain } from "../handlers/expression";
import { NodeHandlerChain } from "../handlers/node";
import { Scope, SymbolTable, Environment, injectUndefined, addClassScope } from "../scope";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { BuiltinString, BuiltinInt8, BuiltinUInt32, GC, BuiltinTSClosure, BuiltinTSTuple } from "../tsbuiltins";
import { MetaInfoStorage } from "../generator";
import { DEFINITIONS, GC_DEFINITION, UTILITY_DEFINITIONS } from "../../std/constants";
import { SizeOf } from "../cppintegration";
import { LLVM } from "../llvm/llvm";
import { TS } from "../ts/ts";
import { LLVMConstantInt, LLVMValue } from "../llvm/value";
import { Builder } from "../builder/builder";
import { LLVMType } from "../llvm/type";
import { Declaration } from "../ts/declaration";

enum InternalNames {
  Environment = "__environment__",
  FunctionScope = "__function_scope__",
  Object = "__object__",
  This = "this",
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

  readonly builtinInt8: BuiltinInt8;
  readonly builtinUInt32: BuiltinUInt32;
  readonly builtinString: BuiltinString;

  private builtinTSTuple: BuiltinTSTuple | undefined;
  private builtinTSClosure: BuiltinTSClosure | undefined;
  private garbageCollector: GC | undefined;

  readonly sizeOf: SizeOf;
  readonly llvm: LLVM;
  readonly ts: TS;

  readonly internalNames = InternalNames;

  constructor(program: ts.Program) {
    this.program = program;
    this.context = new llvm.LLVMContext();
    this.module = new llvm.Module("main", this.context);
    this.irBuilder = new Builder(this, null);
    this.symbolTable = new SymbolTable();

    this.builtinInt8 = new BuiltinInt8(this);
    this.builtinUInt32 = new BuiltinUInt32(this);

    this.builtinString = new BuiltinString(this);

    this.sizeOf = new SizeOf();

    this.llvm = new LLVM(this);
    this.ts = new TS(this);
  }

  createModule(): llvm.Module {
    const mainReturnType = LLVMType.getInt32Type(this);
    const { fn: main } = this.llvm.function.create(mainReturnType, [], "main");

    const entryBlock = llvm.BasicBlock.create(this.context, "entry", main.unwrapped as llvm.Function);

    const sourceFiles: ts.SourceFile[] = [];
    for (const sourceFile of this.program.getSourceFiles()) {
      sourceFiles.push(sourceFile);
    }

    // Sources order is not defined, ensure std numeric types will appear in symbol table first as others, like GC, depends on them.
    const indexOfStdNumeric = sourceFiles.findIndex((file) => file.fileName.endsWith("lib.std.numeric.d.ts"));
    sourceFiles.unshift(...sourceFiles.splice(indexOfStdNumeric, 1));

    this.builder.setInsertionPoint(entryBlock);
    for (const sourceFile of sourceFiles) {
      this.currentSource = sourceFile;
      this.symbolTable.addScope(sourceFile.fileName);

      injectUndefined(this.symbolTable.currentScope, this);

      sourceFile.forEachChild((node) => this.handleNode(node, this.symbolTable.currentScope));
    }

    this.builder.createSafeRet(LLVMConstantInt.get(this, 0));

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
    const tsclosure = this.program.getSourceFiles().find((sourceFile) => sourceFile.fileName === UTILITY_DEFINITIONS);
    if (!tsclosure) {
      throw new Error("No std utility source file found");
    }
    tsclosure.forEachChild((node) => {
      if (ts.isClassDeclaration(node)) {
        const clazz = Declaration.create(node as ts.ClassDeclaration, this);
        const clazzName = clazz.type.getSymbol().escapedName;
        if (clazzName === "TSClosure") {
          this.builtinTSClosure = new BuiltinTSClosure(clazz, this);
        }
      }
    });
    if (!this.builtinTSClosure) {
      throw new Error("TSClosure declaration not found");
    }
  }

  initTSTuple(): void {
    const stddefs = this.program.getSourceFiles().find((sourceFile) => sourceFile.fileName === DEFINITIONS);
    if (!stddefs) {
      throw new Error("No std definitions source file found");
    }
    stddefs.forEachChild((node) => {
      if (ts.isClassDeclaration(node)) {
        const clazz = Declaration.create(node as ts.ClassDeclaration, this);
        const clazzName = clazz.type.getSymbol().escapedName;
        if (clazzName === "Tuple") {
          this.builtinTSTuple = new BuiltinTSTuple(clazz, this);
          addClassScope(node, this.symbolTable.globalScope, this);
        }
      }
    });
    if (!this.builtinTSTuple) {
      throw new Error("Tuple declaration not found");
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

  createLoadIfNecessary(value: LLVMValue) {
    if (value.type.isPointer() && value.type.getPointerElementType().isCppPrimitiveType()) {
      return this.builder.createLoad(value);
    }
    return value;
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

  get tuple() {
    if (!this.builtinTSTuple) {
      this.initTSTuple();
    }

    return this.builtinTSTuple!;
  }

  get tsclosure() {
    if (!this.builtinTSClosure) {
      this.initTSClosure();
    }

    return this.builtinTSClosure!;
  }

  get randomString() {
    return Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "")
      .substr(0, 5);
  }
}

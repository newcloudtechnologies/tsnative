/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import * as llvm from "llvm-node";
import * as ts from "typescript";
import * as path from "path";
import { LLVMGenerator } from "./generator";
import { TSType } from "../ts/type";
import { LLVMValue } from "../llvm/value";
import { addClassScope, Scope } from "../scope";

export class SourceLocation {
  lineNo: number = 0;
  column: number = 0;
}

export class FileLocation {
  filename: string = "";
  dir: string = ".";
}

export class DebugInfo {
  private readonly generator: LLVMGenerator;
  private readonly diBuilder: llvm.DIBuilder;
  private readonly compileUnit: llvm.DICompileUnit;
  private readonly scopeStack: llvm.DIScope[];
  private readonly typeCache: Map<TSType, llvm.DIType>;

  static getFileNameAndDir(p: string): FileLocation {
    const parsedPath = path.parse(p);
    return { filename: parsedPath.base, dir: parsedPath.dir };
  }

  static getSourceLocation(decl: ts.Node | undefined): SourceLocation {
    if (decl === undefined || decl.pos === -1) {
      return {
        lineNo: 0,
        column: 0,
      };
    }
    const { line, character } = decl
      .getSourceFile()
      .getLineAndCharacterOfPosition(decl.getStart());
    return {
      lineNo: line + 1, // 'line + 1' - gives the real position of the string in the source code
      column: character + 1, // 'character + 1' - gives the real position of the string in the source code
    };
  }

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
    this.diBuilder = new llvm.DIBuilder(this.generator.module);
    this.scopeStack = [];
    this.generator.module.addModuleFlag(
      llvm.Module.ModFlagBehavior.Warning,
      "Debug Info Version",
      llvm.LLVMConstants.DEBUG_METADATA_VERSION
    );
    // Darwin only supports DWARF 2
    if (new llvm.Triple(llvm.getProcessTriple()).isOSDarwin()) {
      this.generator.module.addModuleFlag(
        llvm.Module.ModFlagBehavior.Warning,
        "Dwarf Version",
        2
      );
    }
    const topLevelCompileUnit = DebugInfo.getFileNameAndDir(
      this.generator.program.getRootFileNames()[0]
    );
    const diFile = this.diBuilder.createFile(
      topLevelCompileUnit.filename,
      topLevelCompileUnit.dir
    );
    console.log(`Add file ${topLevelCompileUnit.filename}`);

    this.compileUnit = this.diBuilder.createCompileUnit(
      llvm.dwarf.SourceLanguage.C_plus_plus_14,
      diFile,
      "TypeScript Compiler",
      false,
      "",
      0
    );
    this.typeCache = new Map<TSType, llvm.DIType>();
  }

  getScope(): llvm.DIScope {
    if (this.scopeStack.length === 0) {
      this.openScope(this.compileUnit.getFile());
    }
    return this.scopeStack[this.scopeStack.length - 1];
  }

  openScope(scope: llvm.DIScope): void {
    this.scopeStack.push(scope);
  }

  closeScope() {
    if (this.scopeStack.length !== 0) {
      this.scopeStack.pop();
    }
  }

  emitLocation(decl: ts.Node | undefined): void {
    if (decl === undefined) {
      this.generator.builder
        .unwrap()
        .SetCurrentDebugLocation(new llvm.DebugLoc());
      return;
    }
    const { lineNo, column } = DebugInfo.getSourceLocation(decl);
    const location = llvm.DILocation.get(
      this.generator.context,
      lineNo,
      column,
      this.getScope()
    );
    this.generator.builder
      .unwrap()
      .SetCurrentDebugLocation(new llvm.DebugLoc(location));
  }
  emitProcedure(
    decl: ts.Node | undefined,
    fn: llvm.Function,
    qualifiedFnName: string,
    linkageName: string
  ) {
    const { filename, dir } = DebugInfo.getFileNameAndDir(
      this.generator.currentSourceFile.fileName
    );
    const compileUnit = this.diBuilder.createFile(filename, dir);
    const lineNo = DebugInfo.getSourceLocation(decl).lineNo;
    const diSubroutineType = this.diBuilder.createSubroutineType(
      new llvm.DITypeRefArray()
    );
    const scopeFn = this.diBuilder.createFunction(
      compileUnit as llvm.DIScope,
      qualifiedFnName,
      linkageName,
      compileUnit,
      lineNo,
      diSubroutineType,
      lineNo,
      llvm.DINode.DIFlags.FlagPrototyped,
      llvm.DISubprogram.DISPFlags.SPFlagDefinition
    );
    fn.setSubprogram(scopeFn);
    this.openScope(scopeFn);
    this.emitLocation(undefined);
  }

  emitProcedureEnd(fn: llvm.Function): void {
    if (fn && fn.getSubprogram()) {
      this.emitLocation(undefined);
      this.diBuilder.finalizeSubprogram(fn.getSubprogram());
      this.closeScope();
    }
  }

  emitMainScope(fn: llvm.Function): void {
    const mainSubroutine = this.diBuilder.createSubroutineType(
      new llvm.DITypeRefArray()
    );
    const mainScope = this.diBuilder.createFunction(
      this.compileUnit.getFile() as llvm.DIScope,
      fn.name,
      fn.name,
      this.compileUnit.getFile(),
      0, // ignore
      mainSubroutine,
      0, // ignore
      llvm.DINode.DIFlags.FlagPrototyped | llvm.DINode.DIFlags.FlagZero,
      llvm.DISubprogram.DISPFlags.SPFlagDefinition |
        llvm.DISubprogram.DISPFlags.SPFlagMainSubprogram
    );
    fn.setSubprogram(mainScope);
    this.openScope(mainScope);
  }

  finalize(): void {
    this.diBuilder.finalize();
  }
  getOrCreateCompositeType(tsType: TSType, size: number, scope: llvm.DIScope, lineNo : number): llvm.DIType | undefined {
    if (!this.typeCache.has(tsType)) {
      const compType = this.createCompositeType(tsType.getApparentType().toString(), size, scope, lineNo, tsType.getApparentType().mangle());
      this.typeCache.set(
        tsType, compType
      );
    }
    return this.typeCache.get(tsType);
  }
  createCompositeType(typeName : string, size: number, scope: llvm.DIScope, lineNo : number, mangled : string = '') : llvm.DIType {
    const compType = this.diBuilder.createForwardDecl(llvm.dwarf.DW_TAG_class_type, typeName, scope, scope.getFile(), lineNo, mangled);
    const ptrType = this.diBuilder.createPointerType(compType, size);
    return this.diBuilder.createPointerType(ptrType, size)
  }

  getOrCreateType(tsType: TSType, size: number): llvm.DIType | undefined {
    if (!this.typeCache.has(tsType)) {
      this.typeCache.set(
        tsType,
        this.diBuilder.createPointerType(undefined, size)
      );
    }
    return this.typeCache.get(tsType);
  }

  emitDeclare(
    varName: string,
    storage: LLVMValue,
    decl: ts.Node,
    tsType: TSType
  ): llvm.Instruction | undefined {
    const { lineNo, column } = DebugInfo.getSourceLocation(decl);

    const dbgType = this.getOrCreateCompositeType(
      tsType,
      this.generator.module.dataLayout.getPointerSizeInBits(0),
      this.getScope(), lineNo
    );
    if (!dbgType) {
      return undefined;
    }
    const scope = this.getScope();
    const location = llvm.DILocation.get(
      this.generator.context,
      lineNo,
      column,
      scope
    );

    const currentBB = this.generator.builder.getInsertBlock();
    if (!currentBB) {
      throw new Error("Cannot get current LLVM function: no insert block");
    }

    const dbgVarInfo = this.diBuilder.createAutoVariable(
      scope,
      varName,
      scope.getFile(),
      lineNo,
      dbgType
    );
    const alloca = this.generator.builder
      .unwrap()
      .createAlloca(storage.unwrapped.type);
    const inst = this.diBuilder.insertDeclare(
      alloca,
      dbgVarInfo,
      this.diBuilder.createExpression(),
      location,
      currentBB
    );
    this.generator.builder.createSafeStore(
      storage,
      LLVMValue.create(alloca, this.generator)
    );
    return inst;
  }

  applyLocation(callInst: llvm.CallInst, decl: ts.Node): void {
    const { lineNo, column } = DebugInfo.getSourceLocation(decl);
    const location = llvm.DILocation.get(
      this.generator.context,
      lineNo,
      column,
      this.getScope()
    );
    callInst.setDebugLoc(new llvm.DebugLoc(location));
  }
  emitMemberDeclaration (scope : llvm.DIScope,  name : string , size: number, lineNo : number, diFile: llvm.DIFile, type : llvm.DIType) {

    this.diBuilder.createMemberType(scope, name, diFile, lineNo, size, 0, 0, 
      llvm.DINode.DIFlags.FlagPublic, type);
  }

  createFile (filename? : string, dir? : string) : llvm.DIFile {
    if (filename && dir)
      return this.diBuilder.createFile(filename, dir);
    else {
        const { filename, dir } = DebugInfo.getFileNameAndDir(
          this.generator.currentSourceFile.fileName
        );
        return this.diBuilder.createFile(filename, dir);
        }
    }
  emitClassDeclaration(name : string, mangledTypename : string, declaration : ts.Declaration, arr : llvm.DIType[]) {
    if (name.startsWith('Cl')) {
      //this.diBuilder.createClassType(this.scopeStack.at(1), 'Cl')
      this.diBuilder.getOrCreateTypeArray(arr);
    }
  }
}


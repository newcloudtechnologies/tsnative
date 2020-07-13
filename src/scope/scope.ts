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

import { error, getAliasedSymbolIfNecessary, getStructType, InternalNames } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { LLVMGenerator } from "@generator";
import { TypeMangler } from "@mangling";

export class Environment {
  varNames: string[];
  data: llvm.ConstantStruct;
  rawData: llvm.Value[];

  constructor(varNames: string[], data: llvm.ConstantStruct, rawData: llvm.Value[]) {
    this.varNames = varNames;
    this.data = data;
    this.rawData = rawData;
  }
}

export function injectUndefined(scope: Scope, context: llvm.LLVMContext) {
  const declarationLLVMType = llvm.Type.getInt8Ty(context);
  const undef = llvm.UndefValue.get(declarationLLVMType);
  scope.set("undefined", undef);
}

export function setLLVMFunctionScope(fn: llvm.Function, scope: Scope) {
  llvm.verifyFunction(fn);
  scope.set(fn.name, fn);
}

export function addClassScope(
  expression: ts.Expression | ts.Declaration,
  parentScope: Scope,
  generator: LLVMGenerator
): void {
  const thisType = generator.checker.getTypeAtLocation(expression) as ts.ObjectType;
  const declaration = getAliasedSymbolIfNecessary(thisType.symbol, generator.checker)
    .valueDeclaration as ts.ClassDeclaration;
  const mangledTypename: string = TypeMangler.mangle(thisType, generator.checker, declaration);

  if (parentScope.get(mangledTypename)) {
    return;
  }

  const type = getStructType(thisType, declaration, generator).getPointerTo();
  const scope = new Scope(mangledTypename, undefined, { declaration, type });
  parentScope.set(mangledTypename, scope);
  for (const method of declaration.members.filter((member) => !ts.isPropertyDeclaration(member))) {
    generator.handleNode(method, scope);
  }
}

export class HeapVariableDeclaration {
  allocated: llvm.Value;
  initializer: llvm.Value;

  constructor(alloca: llvm.Value, initializer: llvm.Value) {
    this.allocated = alloca;
    this.initializer = initializer;
  }
}

export type ScopeValue =
  | llvm.Value
  | llvm.UndefValue
  | Scope
  | HeapVariableDeclaration
  | ts.Type
  | ts.FunctionDeclaration;

export interface ThisData {
  readonly declaration: ts.ClassDeclaration | ts.InterfaceDeclaration | undefined;
  readonly type: llvm.StructType | llvm.PointerType;
}

export class Scope {
  map: Map<string, ScopeValue>;

  readonly name: string | undefined;
  readonly thisData: ThisData | undefined;
  readonly parent: Scope | undefined;

  constructor(name: string | undefined, parent?: Scope, data?: ThisData) {
    this.map = new Map<string, ScopeValue>();
    this.name = name;
    this.parent = parent;
    this.thisData = data;
  }

  get(identifier: string): ScopeValue | undefined {
    return this.map.get(identifier);
  }

  tryGetThroughParentChain(identifier: string, ignoreTopLevel?: boolean): ScopeValue | undefined {
    const value = this.map.get(identifier);

    if (value) {
      return value;
    } else if (!value && this.parent && (this.parent.name === InternalNames.FunctionScope || !ignoreTopLevel)) {
      return this.parent.tryGetThroughParentChain(identifier, ignoreTopLevel);
    }

    return;
  }

  set(identifier: string, value: ScopeValue) {
    if (!this.map.get(identifier)) {
      return this.map.set(identifier, value);
    }

    return error(`Identifier '${identifier}' already exists. Use 'Scope.overwrite' instead of 'Scope.set'`);
  }

  overwrite(identifier: string, value: ScopeValue) {
    if (this.map.get(identifier)) {
      return this.map.set(identifier, value);
    }

    return error(`Identifier '${identifier}' being overwritten not found in symbol table`);
  }
}

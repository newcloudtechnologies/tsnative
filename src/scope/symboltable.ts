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
import { error, getStringType } from "@utils";
import * as llvm from "llvm-node";
import * as R from "ramda";
import * as ts from "typescript";

type ScopeValue = llvm.Value | Scope;

interface ScopeData {
  readonly declaration: ts.ClassDeclaration | ts.InterfaceDeclaration;
  readonly type: llvm.StructType;
}

export function addInterfaceScope(declaration: ts.InterfaceDeclaration, parentScope: Scope, generator: LLVMGenerator) {
  const name = declaration.name.text;
  parentScope.set(name, new Scope(name));

  if (name === "String") {
    parentScope.set("string", new Scope(name, { declaration, type: getStringType(generator.context) }));
  }
}

export class Scope extends Map<string, ScopeValue> {
  readonly name: string | undefined;
  readonly data: ScopeData | undefined;

  constructor(name: string | undefined, data?: ScopeData) {
    super();
    this.name = name;
    this.data = data;
  }

  get(identifier: string): ScopeValue {
    const value = this.getOptional(identifier);
    if (value) {
      return value;
    }
    return error(`Unknown identifier '${identifier}'`);
  }

  getOptional(identifier: string): ScopeValue | undefined {
    return super.get(identifier);
  }

  set(identifier: string, value: ScopeValue) {
    if (!this.getOptional(identifier)) {
      return super.set(identifier, value);
    }

    return error(`Overwriting identifier '${identifier}' in symbol table`);
  }

  overwrite(identifier: string, value: ScopeValue) {
    if (this.getOptional(identifier)) {
      return super.set(identifier, value);
    }

    return error(`Identifier '${identifier}' being overwritten not found in symbol table`);
  }
}

export class SymbolTable {
  private readonly scopes: Scope[];

  constructor() {
    this.scopes = [];
  }

  get(identifier: string): ScopeValue {
    const parts = identifier.split(".");
    if (parts.length > 1) {
      const outerScope = this.get(parts[0]);
      if (!(outerScope instanceof Scope)) {
        return error(`'${parts[0]}' is not a namespace`);
      }
      return this.getNested(parts, outerScope);
    }

    for (const scope of R.reverse(this.scopes)) {
      const value = scope.getOptional(identifier);
      if (value) {
        return value;
      }
    }
    return error(`Unknown identifier '${identifier}'`);
  }

  pushScope(name: string): void {
    const scope = new Scope(name);
    this.scopes.push(scope);
  }

  get globalScope(): Scope {
    return this.scopes[0];
  }

  get currentScope(): Scope {
    return this.scopes[this.scopes.length - 1];
  }

  inLocalScope(scopeName: string | undefined, body: (scope: Scope) => void): void {
    const scope = new Scope(scopeName);
    this.scopes.push(scope);
    body(scope);
    this.scopes.pop();
  }

  private getNested(parts: string[], scope: Scope): ScopeValue {
    if (parts.length === 1) {
      if (scope.name === parts[0]) {
        return scope;
      } else {
        return scope.get(parts[0]);
      }
    }
    return this.getNested(parts.slice(1), scope.get(parts[1]) as Scope);
  }
}

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

import { Scope, ScopeValue } from "../scope";
import { LLVMGenerator } from "../generator/generator"

export class IdentifierNotFound extends Error {}

export class SymbolTable {
  private readonly scopes: Scope[];
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
    this.scopes = [new Scope("root", "root", this.generator.gc)];
  }

  getScope(name: string) {
    return this.scopes.find((s) => s.name === name || s.mangledName === name);
  }

  get(identifier: string): ScopeValue {
    const reversedScopes = this.scopes.slice().reverse();
    for (const scope of reversedScopes) {
      const value = scope.get(identifier);
      if (value) {
        return value;
      }
    }

    const parts = identifier.split(".");
    if (parts.length > 1) {
      const candidates = this.scopes.filter((scope) => scope.map.has(parts[0]));

      if (candidates.length === 0) {
        throw new IdentifierNotFound(`No '${parts[0]}' in symbol table`);
      }

      for (const candidate of candidates) {
        const value = this.getNested(parts, candidate);
        if (value) {
          return value;
        }
      }
    }

    throw new IdentifierNotFound(`Identifier '${identifier}' not found`);
  }

  addScope(name: string): void {
    const scope = new Scope(name, name, this.generator.gc);
    this.scopes.push(scope);
  }

  get globalScope(): Scope {
    return this.scopes[0];
  }

  get currentScope(): Scope {
    return this.scopes[this.scopes.length - 1];
  }

  withLocalScope<R>(body: (scope: Scope) => R, parentScope?: Scope, name?: string): R {
    const scope = new Scope(name, name, this.generator.gc, false, parentScope);
    this.scopes.push(scope);
    const result = body(scope);
    this.scopes.pop();

    scope.deinitialize();
    return result;
  }

  private getNested(parts: string[], scope: ScopeValue | undefined): ScopeValue | undefined {
    if (!scope) {
      return undefined;
    }

    if (!(scope instanceof Scope)) {
      return scope;
    }

    if (parts.length === 1) {
      if (scope.name === parts[0] || scope.mangledName === parts[0]) {
        return scope;
      } else {
        const value = scope.get(parts[0]);
        if (value) {
          return value;
        }
      }
    }

    return this.getNested(parts.slice(1), scope.get(parts[0]));
  }

  dump() {
    this.scopes.forEach((scope) => scope.dump());
  }
}

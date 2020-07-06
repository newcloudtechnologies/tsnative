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

import { Scope, ScopeValue } from "@scope";
import { error, reverse } from "@utils";

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
        return error(`No namespace '${parts[0]}' found`);
      }
      return this.getNested(parts, outerScope);
    }

    for (const scope of reverse(this.scopes)) {
      const value = scope.get(identifier);
      if (value) {
        return value;
      }
    }
    return error(`Identifier '${identifier}' not found`);
  }

  addScope(name: string): void {
    const scope = new Scope(name);
    this.scopes.push(scope);
  }

  get globalScope(): Scope {
    return this.scopes[0];
  }

  get currentScope(): Scope {
    return this.scopes[this.scopes.length - 1];
  }

  withLocalScope<R>(body: (scope: Scope) => R, parentScope?: Scope, name?: string): R {
    const scope = new Scope(name, parentScope);
    this.scopes.push(scope);
    const result = body(scope);
    this.scopes.pop();
    return result;
  }

  private getNested(parts: string[], scope: Scope): ScopeValue {
    if (!scope) {
      return error(`No scope provided for '${parts}'`);
    }
    if (parts.length === 1) {
      if (scope.name === parts[0]) {
        return scope;
      } else {
        const value = scope.get(parts[0]);
        if (value) return value;

        return error(`Identifier '${parts[0]}' not found`);
      }
    }
    return this.getNested(parts.slice(1), scope.get(parts[1]) as Scope);
  }
}

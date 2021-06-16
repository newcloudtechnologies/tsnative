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
import { error } from "@utils";

export class SymbolTable {
  private readonly scopes: Scope[];
  private readonly objectNames: string[];

  constructor() {
    this.scopes = [new Scope("root", "root")];
    this.objectNames = [];
  }

  addObjectName(objectName: string) {
    this.objectNames.push(objectName);
  }

  getObjectName(fieldName: string) {
    // @todo. This is an heuristic algorithm, so it's worth to handle the case of multiple objectName matches as an error!
    for (const objectName of this.objectNames) {
      if (objectName.includes(fieldName)) {
        return objectName;
      }
    }
    return;
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
        error(`No '${parts[0]}' in symbol table`);
      }

      for (const candidate of candidates) {
        const value = this.getNested(parts, candidate);
        if (value) {
          return value;
        }
      }
    }

    error(`Identifier '${identifier}' not found`);
  }

  addScope(name: string): void {
    const scope = new Scope(name, name);
    this.scopes.push(scope);
  }

  get globalScope(): Scope {
    return this.scopes[0];
  }

  get currentScope(): Scope {
    return this.scopes[this.scopes.length - 1];
  }

  withLocalScope<R>(body: (scope: Scope) => R, parentScope?: Scope, name?: string): R {
    const scope = new Scope(name, name, parentScope);
    this.scopes.push(scope);
    const result = body(scope);
    this.scopes.pop();
    return result;
  }

  private getNested(parts: string[], scope: Scope): ScopeValue | undefined {
    if (!scope) {
      return undefined;
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
    return this.getNested(parts.slice(1), scope.get(parts[0]) as Scope);
  }

  dump() {
    this.scopes.forEach((scope) => scope.dump());
  }
}

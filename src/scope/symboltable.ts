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

  get(identifier: string): ScopeValue {
    for (const scope of reverse(this.scopes)) {
      const value = scope.get(identifier);
      if (value) {
        return value;
      }
    }

    const parts = identifier.split(".");
    if (parts.length > 1) {
      const outerScope = this.get(parts[0]);
      if (!(outerScope instanceof Scope)) {
        error(`No namespace '${parts[0]}' found`);
      }
      return this.getNested(parts, outerScope);
    }

    error(`Identifier '${identifier}' not found`);
  }

  tryGet(identifier: string) {
    let value;
    try {
      value = this.get(identifier);
    } catch (_) {}

    return value;
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

  private getNested(parts: string[], scope: Scope): ScopeValue {
    if (!scope) {
      error(`No scope provided for '${parts}'`);
    }
    if (parts.length === 1) {
      if (scope.name === parts[0] || scope.mangledName === parts[0]) {
        return scope;
      } else {
        const value = scope.get(parts[0]);
        if (value) return value;

        error(`Identifier '${parts[0]}' not found`);
      }
    }
    return this.getNested(parts.slice(1), scope.get(parts[1]) as Scope);
  }

  dump() {
    this.scopes.forEach((scope) => scope.dump());
  }
}

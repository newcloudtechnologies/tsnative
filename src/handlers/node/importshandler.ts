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

import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "@scope";

export class ImportsHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration: {
        const importDeclaration = node as ts.ImportDeclaration;
        const namedBindings = importDeclaration.importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          namedBindings.elements.forEach((e) => {
            const name = e.getText();

            const type = this.generator.ts.checker.getTypeAtLocation(e);

            if (!type.isSymbolless()) {
              const symbol = type.getSymbol();

              for (const declaration of symbol.declarations) {
                const file = declaration.getSourceFile().fileName;
                const scope = this.generator.symbolTable.getScope(file);

                if (scope && !parentScope.get(file)) {
                  parentScope.set(file, scope);
                }
              }
            }

            try {
              // Try inject named import value in parent scope.
              // If this is the type import we will never find it in symbol table,
              // so `get` will throw an exception that we may ignore without any consequences
              try {
                const value = this.generator.symbolTable.get(name);
                parentScope.set(name, value);
              } catch (_) {
                // Or maybe it is a class?
                const value = this.generator.symbolTable.get(name + "__class");
                parentScope.set(name + "__class", value);
              }

              // Ignore empty catch block
              // tslint:disable-next-line
            } catch (_) { }
          });
        }

        return true;
      }
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }
}

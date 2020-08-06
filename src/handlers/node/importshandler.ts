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
import * as llvm from "llvm-node";

export class ImportsHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration: {
        const importDeclaration = node as ts.ImportDeclaration;
        const namedBindings = importDeclaration.importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          namedBindings.elements.forEach((e) => {
            const name = e.getText();
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
                parentScope.set(name, value);
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

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
import { Scope } from "@scope";

export class BypassingHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.MethodDeclaration:
      case ts.SyntaxKind.IndexSignature:
      case ts.SyntaxKind.Constructor:
      // Declarations have no actual arguments. Handle them when called.
      case ts.SyntaxKind.EndOfFileToken:
      case ts.SyntaxKind.EmptyStatement:
      case ts.SyntaxKind.EnumDeclaration:
      case ts.SyntaxKind.ImportDeclaration:
      case ts.SyntaxKind.ExportDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.ExportAssignment:
      case ts.SyntaxKind.GetAccessor: // Gonna handle once called.
        return true;
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(node, parentScope);
    }

    return false;
  }
}

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

import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";

export class BypassingHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.IndexSignature:
      case ts.SyntaxKind.Constructor:
      // Declarations have no actual arguments. Handle them when called.
      case ts.SyntaxKind.EndOfFileToken:
      case ts.SyntaxKind.EmptyStatement:
      case ts.SyntaxKind.ImportDeclaration:
      case ts.SyntaxKind.ExportDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.ExportAssignment:
      case ts.SyntaxKind.GetAccessor: // handled in FunctionHandler
      case ts.SyntaxKind.SetAccessor: // handled in FunctionHandler
      case ts.SyntaxKind.FunctionDeclaration: // all the declarations are turned into expressions on preprocessing stage
        return true;
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }
}

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

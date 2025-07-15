import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";
import { IfBlockCreator } from "../ifblockcreator";

export class BranchHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isIfStatement(node)) {
      this.generator.emitLocation(node);
      const statement = node as ts.IfStatement;
      const condition = this.generator.handleExpression(statement.expression, env).derefToPtrLevel1().makeBoolean();

      const ifBlockCreator = new IfBlockCreator(this.generator);

      const thenAction = () => {
        if (statement.thenStatement) {
          this.generator.handleNode(statement.thenStatement, parentScope, env);
        }
      }

      const elseAction = () => {
        if (statement.elseStatement) {
          this.generator.handleNode(statement.elseStatement, parentScope, env);
        }
      }

      ifBlockCreator.create(condition, thenAction, elseAction);

      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }
}

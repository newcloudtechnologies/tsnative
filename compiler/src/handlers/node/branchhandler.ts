/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
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

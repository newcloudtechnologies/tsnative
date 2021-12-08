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

import { BasicBlock } from "llvm-node";
import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";

export class SwitchHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isSwitchStatement(node)) {
      const statement = node as ts.SwitchStatement;
      const leftExpr = statement.expression;

      const clauses = [];

      let defClause: ts.DefaultClause | undefined;

      // iterate all clauses and put default-block to the end if it exist
      for (const clause of statement.caseBlock.clauses) {
        switch (clause.kind) {
          case ts.SyntaxKind.CaseClause: {
            clauses.push(clause);
            break;
          }
          case ts.SyntaxKind.DefaultClause: {
            defClause = clause;
            break;
          }
          default: {
            break;
          }
        }
      }

      // default clause is always in the end
      if (defClause) {
        clauses.push(defClause);
      }

      const endBlock = BasicBlock.create(this.generator.context, "endSwitch", this.generator.currentFunction);

      const currentBlock = this.generator.builder.getInsertBlock();

      const case0Block = this.handleCase(leftExpr, clauses, 0, endBlock, parentScope, env);

      this.generator.builder.setInsertionPoint(currentBlock!);

      this.generator.builder.createBr(case0Block);

      this.generator.builder.setInsertionPoint(endBlock);

      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private hasDefault(clauses: ts.CaseOrDefaultClause[]): boolean {
    let result = false;

    for (const it of clauses) {
      if (it.kind === ts.SyntaxKind.DefaultClause) {
        result = true;
        break;
      }
    }

    return result;
  }

  private hasAnyStatements(clause: ts.CaseClause): boolean {
    return clause.statements.length > 0;
  }

  private hasTerminateStatement(clause: ts.CaseClause): boolean {
    let result = false;

    for (const it of clause.statements) {
      if (it.kind === ts.SyntaxKind.BreakStatement || it.kind === ts.SyntaxKind.ReturnStatement) {
        result = true;
        break;
      }
    }
    return result;
  }

  private joinByOr(leftExpr: ts.Expression, rightExpr: ts.Expression, prevExpr?: ts.Expression): ts.Expression {
    let expr = ts.createBinary(leftExpr, ts.SyntaxKind.EqualsEqualsEqualsToken, rightExpr);

    if (prevExpr) {
      expr = ts.createBinary(prevExpr, ts.SyntaxKind.BarBarToken, expr);
    }

    return expr;
  }

  private handleCase(
    leftExpr: ts.Expression,
    clauses: ts.CaseOrDefaultClause[],
    n: number,
    endBlock: BasicBlock,
    parentScope: Scope,
    env?: Environment
  ): BasicBlock {
    const name = "case_" + n.toString();
    const block = BasicBlock.create(this.generator.context, name, this.generator.currentFunction);

    this.generator.builder.setInsertionPoint(block);

    const statements = [];

    let expr: ts.Expression | undefined;
    const hasDefault = this.hasDefault(clauses);
    const N = hasDefault ? clauses.length - 1 : clauses.length;

    // skip all empty case-blocks and generate joined expression
    // switch (x)
    //    case 1:
    //    case 2:
    //    case 3:
    //      ...
    //      break;
    //
    // if ( (x === 1) || (x === 2) || (x ===3) ) {...}
    while (n < N && !this.hasAnyStatements(clauses[n] as ts.CaseClause)) {
      const clause = clauses[n] as ts.CaseClause;
      const rightExpr = clause.expression;

      expr = this.joinByOr(leftExpr, rightExpr, expr);
      ++n;
    }

    // switch (x) {
    //   case 1:
    //   default:
    //     return 100;
    // }
    //
    // if default-block exists and case before doesn't have terminate operator
    // rollback n to case-block position. (default-block will be handled below)

    if (hasDefault && n >= N) {
      --n;
    }

    const clause = clauses[n] as ts.CaseClause;

    for (const it of clause.statements) {
      statements.push(it);
    }

    let m = n;
    if (!this.hasTerminateStatement(clauses[m] as ts.CaseClause)) {
      // find forward all blocks without terminate statement
      do {
        if (++m >= (hasDefault ? N + 1 : N)) break;

        const nextClause = clauses[m] as ts.CaseClause;

        // accumulate statements from blocks without "break" (and "return")
        for (const it of nextClause.statements) {
          statements.push(it);
        }
      } while (m < N && !this.hasTerminateStatement(clauses[m] as ts.CaseClause));
    }

    const rightExpr = clause.expression;

    const condition = this.generator.createLoadIfNecessary(
      this.generator.handleExpression(this.joinByOr(leftExpr, rightExpr, expr), env)
    );

    const thenBlock = BasicBlock.create(this.generator.context, name + "_then", this.generator.currentFunction);
    this.generator.builder.setInsertionPoint(thenBlock);

    for (const it of statements) {
      this.generator.handleNode(it, parentScope, env);
    }

    if (!this.generator.isCurrentBlockTerminated) {
      this.generator.builder.createBr(endBlock);
    }

    let elseBlock: BasicBlock;

    if (this.hasDefault(clauses)) {
      // exec handleCase() for all clauses except last clause.
      // for last clause exec handleDefault() because default block always in the end
      elseBlock =
        n + 1 < clauses.length - 1
          ? this.handleCase(leftExpr, clauses, n + 1, endBlock, parentScope, env)
          : this.handleDefault(clauses[clauses.length - 1], endBlock, parentScope, env);
    } else {
      // exec handleCase() for all clauses
      // else block for last clause is end block
      elseBlock =
        n === clauses.length - 1 ? endBlock : this.handleCase(leftExpr, clauses, n + 1, endBlock, parentScope, env);
    }

    this.generator.builder.setInsertionPoint(block);
    this.generator.builder.createCondBr(condition, thenBlock, elseBlock);

    return block;
  }

  private handleDefault(
    clause: ts.CaseOrDefaultClause,
    endBlock: BasicBlock,
    parentScope: Scope,
    env?: Environment
  ): BasicBlock {
    const block = BasicBlock.create(this.generator.context, "default", this.generator.currentFunction);
    this.generator.builder.setInsertionPoint(block);

    for (const statement of clause.statements) {
      this.generator.handleNode(statement, parentScope, env);
    }

    if (!this.generator.isCurrentBlockTerminated) {
      this.generator.builder.createBr(endBlock);
    }

    return block;
  }
}

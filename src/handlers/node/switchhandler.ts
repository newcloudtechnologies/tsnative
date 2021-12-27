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
      this.handleSwitch(node, parentScope, env);
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private correctClausesOrder(node: ts.SwitchStatement) {
    return Array.from(node.caseBlock.clauses).sort((lhs, rhs) => {
      if (ts.isCaseClause(lhs) && ts.isDefaultClause(rhs)) {
        return -1;
      }

      if (ts.isCaseClause(rhs) && ts.isDefaultClause(lhs)) {
        return 1;
      }

      return 0;
    });
  }

  private handleSwitch(node: ts.SwitchStatement, parentScope: Scope, env?: Environment) {
    const endBlock = BasicBlock.create(
      this.generator.context,
      `switch.${node.expression.getText()}.end`,
      this.generator.currentFunction
    );
    const exiting = BasicBlock.create(
      this.generator.context,
      `switch.${node.expression.getText()}.exiting`,
      this.generator.currentFunction
    );

    this.generator.withInsertBlockKeeping(() => {
      this.generator.builder.setInsertionPoint(exiting);
      this.generator.builder.createBr(endBlock);
    });

    this.generator.withInsertBlockKeeping(() => {
      const clauses = this.correctClausesOrder(node);

      const switchBlock = BasicBlock.create(
        this.generator.context,
        `switch.${node.expression.getText()}`,
        this.generator.currentFunction
      );
      this.generator.builder.createBr(switchBlock);
      this.generator.builder.setInsertionPoint(switchBlock);

      const blocks = this.handleClauses(clauses, endBlock, parentScope, env);
      this.handleConditions(node, clauses, blocks, endBlock, env);
    });

    this.generator.builder.setInsertionPoint(endBlock);
  }

  private handleClauses(
    clauses: ts.CaseOrDefaultClause[],
    endBlock: llvm.BasicBlock,
    parentScope: Scope,
    env?: Environment
  ) {
    const blocks = clauses.map((clause) => {
      const blockName = ts.isCaseClause(clause) ? `case_${clause.expression.getText()}` : "default";
      return BasicBlock.create(this.generator.context, blockName, this.generator.currentFunction);
    });

    this.generator.withInsertBlockKeeping(() => {
      for (let i = 0; i < blocks.length; ++i) {
        const clause = clauses[i];
        const block = blocks[i];

        this.generator.builder.setInsertionPoint(block);

        for (const node of clause.statements) {
          this.generator.handleNode(node, parentScope, env);
        }

        const next = blocks[i + 1];
        if (!next && !this.generator.isCurrentBlockTerminated) {
          this.generator.builder.createBr(endBlock);
        }

        if (!this.generator.isCurrentBlockTerminated) {
          this.generator.builder.createBr(next);
        }
      }
    });

    return blocks;
  }

  private handleConditions(
    node: ts.SwitchStatement,
    clauses: ts.CaseOrDefaultClause[],
    blocks: llvm.BasicBlock[],
    endBlock: llvm.BasicBlock,
    env?: Environment
  ) {
    const conditionBlocks = (clauses.filter((clause) => ts.isCaseClause(clause)) as ts.CaseClause[]).map((clause) => {
      const blockName = `case_${clause.expression.getText()}.condition`;
      return BasicBlock.create(this.generator.context, blockName, this.generator.currentFunction);
    });

    const defaultBlock = blocks.find((block) => block.name.includes("default"));

    this.generator.withInsertBlockKeeping(() => {
      for (let i = 0; i < conditionBlocks.length; ++i) {
        const clause = clauses[i];
        const conditionBlock = conditionBlocks[i];
        const nextConditionBlock = conditionBlocks[i + 1];
        const block = blocks[i];

        this.generator.builder.setInsertionPoint(conditionBlock);

        if (ts.isCaseClause(clause)) {
          const comparisonExpression = ts.createBinary(
            node.expression,
            ts.SyntaxKind.EqualsEqualsEqualsToken,
            clause.expression
          );
          const comparisonResult = this.generator.createLoadIfNecessary(
            this.generator.handleExpression(comparisonExpression, env)
          );

          this.generator.builder.createCondBr(comparisonResult, block, nextConditionBlock || defaultBlock || endBlock);
        }
      }
    });

    this.generator.builder.createBr(conditionBlocks[0] || defaultBlock || endBlock);
  }
}

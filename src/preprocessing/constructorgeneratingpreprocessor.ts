/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import * as ts from "typescript";
import { AbstractPreprocessor } from "@preprocessing";

export class ConstructorGeneratingPreprocessor extends AbstractPreprocessor {
  handle(node: ts.Node, sourceFile: ts.SourceFile): ts.Node {
    if (ts.isClassDeclaration(node)) {
      const constructorDeclaration = node.members.find(ts.isConstructorDeclaration);
      if (!constructorDeclaration) {
        const constructorStatements = [];
        if (node.heritageClauses) {
          const superExpression = ts.createSuper();
          const superCall = ts.createCall(superExpression, undefined, undefined);
          const superCallExpression = ts.createExpressionStatement(superCall);
          constructorStatements.push(superCallExpression);
        }
        const constructorBody = ts.createBlock(constructorStatements);
        const defaultConstructor = ts.createConstructor(undefined, undefined, [], constructorBody);
        const updatedMembers = [defaultConstructor, ...node.members];

        return ts.updateClassDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.name,
          node.typeParameters,
          node.heritageClauses,
          updatedMembers
        );
      }
    }

    if (this.next) {
      return this.next.handle(node, sourceFile);
    }

    return node;
  }
}

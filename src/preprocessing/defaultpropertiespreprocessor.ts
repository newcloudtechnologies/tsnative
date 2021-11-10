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
import { AbstractPreprocessor } from "./abstractpreprocessor";
import { Declaration } from "../ts/declaration";

export class DefaultPropertiesPreprocessor extends AbstractPreprocessor {
  transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        const parent = node.parent || this.utils.getParentFromOriginal(node);

        if (ts.isConstructorDeclaration(node) && node.body && parent) {
          const hasSuperCall =
            // @ts-ignore
            parent.heritageClauses &&
            // @ts-ignore
            (parent.heritageClauses as ts.HeritageClause[]).some(
              (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword
            );
          const defaultPropertiesInitializers = [];

          // @ts-ignore
          for (const member of parent.members.filter(ts.isPropertyDeclaration)) {
            const memberDeclaration = Declaration.create(member, this.generator);
            if (!memberDeclaration.initializer && !memberDeclaration.isOptional()) {
              continue;
            }

            if (memberDeclaration.isStaticProperty()) {
              continue;
            }

            if (!ts.isIdentifier(member.name)) {
              throw new Error(`Expected identifier at '${member.name.getText()}'`);
            }

            const thisExpression = ts.createThis();
            const propertyAccess = ts.createPropertyAccess(thisExpression, member.name);

            const initializer = memberDeclaration.isOptional() ? ts.createIdentifier("undefined") : member.initializer;
            const assignment = ts.createAssignment(propertyAccess, initializer);
            const assigmentStatement = ts.createStatement(assignment);

            defaultPropertiesInitializers.push(assigmentStatement);
          }

          let constructorStatements = [];
          if (hasSuperCall) {
            constructorStatements = [
              node.body.statements[0],
              ...defaultPropertiesInitializers,
              ...node.body.statements.slice(1),
            ];
          } else {
            constructorStatements = [...defaultPropertiesInitializers, ...node.body.statements];
          }

          const updated = ts.updateConstructor(
            node,
            node.decorators,
            node.modifiers,
            node.parameters,
            ts.createBlock(constructorStatements, true)
          );
          node = updated;
        }
        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}

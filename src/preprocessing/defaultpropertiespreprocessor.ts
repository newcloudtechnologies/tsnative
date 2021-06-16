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
import { checkIfStaticProperty, error } from "@utils";

export class DefaultPropertiesPreprocessor extends AbstractPreprocessor {
  transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        const parent = node.parent || this.utils.getParentFromOriginal(node);

        if (ts.isConstructorDeclaration(node) && node.body && parent) {
          // @ts-ignore
          const hasSuperCall = Boolean(parent.heritageClauses);
          const defaultPropertiesInitializers = [];

          // @ts-ignore
          for (const member of parent.members.filter(ts.isPropertyDeclaration)) {
            if (!member.initializer) {
              continue;
            }

            if (checkIfStaticProperty(member)) {
              continue;
            }

            if (!ts.isIdentifier(member.name)) {
              error(`Expected identifier at '${member.name.getText()}'`);
            }

            const thisExpression = ts.createThis();
            const propertyAccess = ts.createPropertyAccess(thisExpression, member.name);
            const assignment = ts.createAssignment(propertyAccess, member.initializer);
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

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
          for (const member of parent.members.filter((m) => ts.isPropertyDeclaration(m) || ts.isMethodDeclaration(m))) {
            const memberDeclaration = Declaration.create(member, this.generator);

            if (memberDeclaration.isProperty()) {
              if (!memberDeclaration.initializer && !memberDeclaration.isOptional()) {
                continue;
              }

              if (memberDeclaration.isStaticProperty()) {
                continue;
              }
            }

            if (!ts.isIdentifier(member.name)) {
              throw new Error(`Expected identifier at '${member.name.getText()}'`);
            }

            let initializer = member.initializer;
            if (!initializer && memberDeclaration.isOptional()) {
              initializer = ts.createIdentifier("undefined");
            }

            if (memberDeclaration.isMethod() && memberDeclaration.body) {
              const parentClassDeclaration = Declaration.create(parent as ts.ClassDeclaration, this.generator);
              const methods = parentClassDeclaration.getMethods();

              const overrideOfOptionalMethod = methods.some(
                (m) => m.isOptional() && m.name?.getText() === member.name?.getText()
              );

              if (!overrideOfOptionalMethod) {
                continue;
              }

              initializer = ts.createFunctionExpression(
                undefined,
                member.asteriskToken,
                undefined,
                member.typeParameters,
                member.parameters,
                member.type,
                member.body
              );
            }

            const thisExpression = ts.createThis();
            const propertyAccess = ts.createPropertyAccess(thisExpression, member.name);

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

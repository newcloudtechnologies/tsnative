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
  transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        if (ts.isClassDeclaration(node)) {
          const constructorDeclaration = node.members.find(ts.isConstructorDeclaration);
          if (!constructorDeclaration) {
            const constructorStatements = [];
            const parameters = [];
            const args = [];
            if (node.heritageClauses) {
              const extendsClause = node.heritageClauses.find(
                (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword
              );
              if (extendsClause) {
                const expessionWithTypeArgs = extendsClause.types[0];
                const type = this.generator.ts.checker.getTypeAtLocation(expessionWithTypeArgs);

                const symbol = type.getSymbol();
                const declaration = symbol.declarations[0];

                const baseConstructor = declaration.members.find((m) => m.isConstructor());
                if (!baseConstructor) {
                  throw new Error(`No constructor provided for '${type.toString()}'`);
                }

                parameters.push(...baseConstructor.parameters);
                args.push(...parameters.map((parameter) => ts.createIdentifier(parameter.name.getText())));
              }

              const superExpression = ts.createSuper();
              const superCall = ts.createCall(superExpression, undefined, args);
              const superCallExpression = ts.createExpressionStatement(superCall);
              constructorStatements.push(superCallExpression);
            }
            const constructorBody = ts.createBlock(constructorStatements);
            const defaultConstructor = ts.createConstructor(undefined, undefined, parameters, constructorBody);
            const updatedMembers = [defaultConstructor, ...node.members];

            const updated = ts.updateClassDeclaration(
              node,
              node.decorators,
              node.modifiers,
              node.name,
              node.typeParameters,
              node.heritageClauses,
              updatedMembers
            );

            const type = this.generator.ts.checker.getTypeAtLocation(node);
            const symbol = type.getSymbol();

            defaultConstructor.parent = updated;
            updated.parent = node.parent || sourceFile;
            symbol.unwrapped.declarations[0] = updated;

            node = updated;
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}

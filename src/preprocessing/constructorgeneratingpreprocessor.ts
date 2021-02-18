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
import { error, getAliasedSymbolIfNecessary } from "@utils";

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
                const type = this.generator.checker.getTypeAtLocation(expessionWithTypeArgs);
                if (!type.symbol) {
                  error("Symbol not found");
                }

                const symbol = getAliasedSymbolIfNecessary(type.symbol, this.generator.checker);
                const declaration = symbol.declarations[0] as ts.ClassDeclaration;

                const baseConstructor = declaration.members.find(ts.isConstructorDeclaration);
                if (!baseConstructor) {
                  error(`No constructor provided for '${this.generator.checker.typeToString(type)}'`);
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

            const type = this.generator.checker.getTypeAtLocation(node);
            const symbol = getAliasedSymbolIfNecessary(type.symbol, this.generator.checker);

            defaultConstructor.parent = updated;
            updated.parent = node.parent || sourceFile;
            symbol.declarations[0] = updated;

            node = updated;
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}

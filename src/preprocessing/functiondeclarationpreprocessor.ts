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
import { error } from "@utils";

export class FunctionDeclarationPreprocessor extends AbstractPreprocessor {
  transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        if (ts.isFunctionDeclaration(node) && node.body) {
          const functionExpression = ts.createFunctionExpression(
            undefined,
            node.asteriskToken,
            node.name,
            node.typeParameters,
            node.parameters,
            node.type,
            node.body
          );

          if (!node.name) {
            error("Name not provided");
          }

          const isDefaultExport = Boolean(
            node.modifiers &&
              node.modifiers.find((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
              node.modifiers.find((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
          );

          const identifier = ts.createIdentifier(node.name.text);

          const variableStatement = ts.createVariableStatement(
            isDefaultExport ? undefined : node.modifiers,
            ts.createVariableDeclarationList(
              [ts.createVariableDeclaration(identifier, undefined, functionExpression)],
              ts.NodeFlags.Const
            )
          );

          if (isDefaultExport) {
            const exportAssignment = ts.createExportAssignment(node.decorators, node.modifiers, undefined, identifier);

            return [variableStatement, exportAssignment];
          } else {
            node = variableStatement;
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitEachChild(sourceFile, visitor, context);
    };
  };
}

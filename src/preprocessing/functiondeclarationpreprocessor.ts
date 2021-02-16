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

export class FunctionDeclarationPreprocessor extends AbstractPreprocessor {
  transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        if (ts.isFunctionDeclaration(node) && node.body) {
          if (
            node.modifiers &&
            node.modifiers.find((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
            node.modifiers.find((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
          ) {
            /*
            Transform default exported function declarations in such a manner:
            before:
                export default function f() {}
            after:
                export default (function () {
                    const f = function f() {};
                    return f;
                });

            since 'export default const ...' is illegal expression
            @todo: solution looks too hackish and restricts usage of default exported function declarations (they cannot be used as argument)
            */

            return ts.createExportAssignment(
              undefined,
              undefined,
              undefined,
              ts.createCall(
                ts.createParen(
                  ts.createFunctionExpression(
                    undefined,
                    undefined,
                    node.name!.getText(),
                    undefined,
                    [],
                    undefined,
                    ts.createBlock(
                      [
                        ts.createVariableStatement(
                          undefined,
                          ts.createVariableDeclarationList(
                            [
                              ts.createVariableDeclaration(
                                ts.createIdentifier(node.name!.text),
                                undefined,
                                ts.createFunctionExpression(
                                  undefined,
                                  node.asteriskToken,
                                  node.name,
                                  node.typeParameters,
                                  node.parameters,
                                  node.type,
                                  node.body
                                )
                              ),
                            ],
                            ts.NodeFlags.Const
                          )
                        ),
                        ts.createReturn(ts.createIdentifier(node.name!.text)),
                      ],
                      true
                    )
                  )
                ),
                undefined,
                []
              )
            );
          }

          const functionExpression = ts.createFunctionExpression(
            undefined,
            node.asteriskToken,
            node.name,
            node.typeParameters,
            node.parameters,
            node.type,
            node.body
          );

          node = ts.createVariableStatement(
            node.modifiers,
            ts.createVariableDeclarationList(
              [ts.createVariableDeclaration(ts.createIdentifier(node.name!.text), undefined, functionExpression)],
              ts.NodeFlags.Const
            )
          );
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitEachChild(sourceFile, visitor, context);
    };
  };
}

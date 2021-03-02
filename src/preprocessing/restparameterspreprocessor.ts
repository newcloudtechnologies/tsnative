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
import { error, getAliasedSymbolIfNecessary, getParentFromOriginal, isSyntheticNode } from "@utils";
import { last } from "lodash";

export class RestParametersPreprocessor extends AbstractPreprocessor {
  transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        if (!isSyntheticNode(node) && ts.isCallExpression(node)) {
          let symbol = this.generator.checker.getSymbolAtLocation(node.expression);
          if (symbol) {
            symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);
            let declaration = symbol.declarations[0];

            if (ts.isVariableDeclaration(declaration)) {
              if (!declaration.initializer) {
                error(`Initializer required for '${declaration.getText()}'`);
              }

              const initializerType = this.generator.checker.getTypeAtLocation(declaration.initializer);
              symbol = initializerType.getSymbol();
              if (!symbol) {
                error("No symbol found");
              }

              symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);
              declaration = symbol.declarations[0];
            }

            if ((declaration as ts.FunctionLikeDeclaration).body) {
              // Skip declarations since they are used for C++ integration
              // @todo: is there a better way to check if declaration is declared in ambient context?

              const signature = this.generator.checker.getSignatureFromDeclaration(
                declaration as ts.SignatureDeclaration
              )!;
              const lastParameter = last(signature.getParameters());

              if (lastParameter && this.isRestParameters(lastParameter.declarations[0] as ts.ParameterDeclaration)) {
                const nonRestParametersCount = signature.getParameters().length - 1;
                const restArguments = node.arguments.slice(nonRestParametersCount);
                const restArgumentsArray = ts.createArrayLiteral(restArguments);

                const updatedCall = ts.updateCall(node, node.expression, node.typeArguments, [
                  ...node.arguments.slice(0, nonRestParametersCount),
                  restArgumentsArray,
                ]);
                ts.addSyntheticLeadingComment(
                  updatedCall,
                  ts.SyntaxKind.SingleLineCommentTrivia,
                  "@ts-ignore (Skip check for rest parameters)"
                );

                const parent = node.parent || getParentFromOriginal(node);
                if (!parent) {
                  error("No parent found");
                }

                updatedCall.parent = parent;

                node = updatedCall;
              }
            }
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };

  private isRestParameters(parameter: ts.ParameterDeclaration) {
    return Boolean(parameter.dotDotDotToken);
  }
}

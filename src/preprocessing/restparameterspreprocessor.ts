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
import { getAliasedSymbolIfNecessary } from "@utils";
import { last } from "lodash";

export class RestParametersPreprocessor extends AbstractPreprocessor {
  handle(node: ts.Node, sourceFile: ts.SourceFile): ts.Node {
    if (ts.isCallExpression(node)) {
      let symbol = this.generator.checker.getTypeAtLocation(node.expression).symbol;
      symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);

      const valueDeclaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;

      if (!valueDeclaration.body) {
        // Skip declarations since they are used for C++ integration
        // @todo: is there a better way to check if declaration is declared in ambient context?
        return node;
      }

      const signature = this.generator.checker.getSignatureFromDeclaration(
        valueDeclaration as ts.SignatureDeclaration
      )!;
      const lastParameter = last(signature.getParameters());

      if (lastParameter && this.isRestParameters(lastParameter.valueDeclaration as ts.ParameterDeclaration)) {
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
        return updatedCall;
      }
    }

    if (this.next) {
      return this.next.handle(node, sourceFile);
    }

    return node;
  }

  private isRestParameters(parameter: ts.ParameterDeclaration) {
    return Boolean(parameter.dotDotDotToken);
  }
}

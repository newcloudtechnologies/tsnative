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
import { last } from "lodash";
import { Declaration } from "../ts/declaration";

export class RestParametersPreprocessor extends AbstractPreprocessor {
  transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
          if (ts.isPropertyAccessExpression(node.expression.expression)) {
            const objectType = this.generator.ts.checker.getTypeAtLocation(node.expression.expression.expression);
            const property = node.expression.expression.name.getText(sourceFile);

            if (objectType.isArray() && property === "push" && node.expression.arguments.some(ts.isSpreadElement)) {
              // NB: Even this implementation only considers Array.push, it may be used for any pure function with minor modifications
              // @todo: @pure decorator?
              const arrayToExtend = ts.createIdentifier(node.expression.expression.expression.getText(sourceFile));
              const arrayToExtendPush = ts.createPropertyAccess(arrayToExtend, property);

              const spreadUnrolled: ts.Node[] = [];
              let callArguments: ts.Expression[] = [];

              const commitPart = () => {
                if (callArguments.length === 0) {
                  return;
                }

                const pushPart = ts.createCall(arrayToExtendPush, undefined, callArguments);
                spreadUnrolled.push(pushPart);
                callArguments = [];
              };

              for (let i = 0; i < node.expression.arguments.length; ++i) {
                const argument = node.expression.arguments[i];

                if (!ts.isSpreadElement(argument)) {
                  callArguments.push(argument);

                  if (i === node.expression.arguments.length - 1) {
                    commitPart();
                  }
                } else {
                  commitPart();

                  const counterIdentifier = ts.createIdentifier("i");

                  if (!ts.isIdentifier(argument.expression)) {
                    console.log(ts.SyntaxKind[argument.expression.kind]);
                    throw new Error("Non-identifier spread elements are not supported");
                  }

                  const spreadArrayIdentifier = argument.expression;

                  if (node.expression.expression.expression.getText(sourceFile) === argument.expression.escapedText) {
                    throw new Error(
                      "Using same array with spread operator in 'push' is not supported (will cause endless recursion)"
                    );
                  }

                  const spreadArrayLength = ts.createPropertyAccess(spreadArrayIdentifier, "length");

                  const counter = ts.createVariableDeclarationList(
                    [ts.createVariableDeclaration(counterIdentifier, undefined, ts.createNumericLiteral("0"))],
                    ts.NodeFlags.Let
                  );

                  const condition = ts.createLessThan(counterIdentifier, spreadArrayLength);
                  const incrementor = ts.createPrefix(ts.SyntaxKind.PlusPlusToken, counterIdentifier);

                  const spreadArrayElementAccess = ts.createElementAccess(spreadArrayIdentifier, counterIdentifier);
                  const pushCall = ts.createCall(arrayToExtendPush, undefined, [spreadArrayElementAccess]);
                  const loopBody = ts.createBlock([ts.createExpressionStatement(pushCall)], true);

                  const forLoop = ts.createFor(counter, condition, incrementor, loopBody);
                  spreadUnrolled.push(forLoop);
                }
              }

              return spreadUnrolled;
            }
          }
        }

        if (!this.utils.isSyntheticNode(node) && ts.isCallExpression(node)) {
          const type = this.generator.ts.checker.getTypeAtLocation(node.expression);

          if (!type.isSymbolless()) {
            let symbol = type.getSymbol();
            let declaration = symbol.declarations[0];

            if (declaration.isVariable()) {
              if (!declaration.initializer) {
                throw new Error(`Initializer required for '${declaration.getText()}'`);
              }

              const initializerType = this.generator.ts.checker.getTypeAtLocation(declaration.initializer);
              symbol = initializerType.getSymbol();
              declaration = symbol.declarations[0];
            }

            if (declaration.isFunctionLike() && declaration.body) {
              // Skip declarations since they are used for C++ integration
              // @todo: is there a better way to check if declaration is declared in ambient context?

              const signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration)!;
              const lastParameter = last(signature.getParameters());

              if (lastParameter && this.isRestParameters(lastParameter.declarations[0])) {
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

                const parent = node.parent || this.utils.getParentFromOriginal(node);
                if (!parent) {
                  throw new Error("No parent found");
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

  private isRestParameters(parameter: Declaration) {
    return Boolean((parameter.unwrapped as ts.ParameterDeclaration).dotDotDotToken);
  }
}

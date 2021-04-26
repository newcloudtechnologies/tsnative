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

import { getAliasedSymbolIfNecessary } from "@utils";
import * as ts from "typescript";
import * as crypto from "crypto";
import { AbstractPreprocessor } from "@preprocessing";

export class ParametersRandomizingPreprocessor extends AbstractPreprocessor {
  transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        if (ts.isParameter(node)) {
          // Use parent function declaration to generate parameter's name unique suffix
          // @todo: there may be several same functions in different scopes thus clashes are still possible.
          const suffix = crypto.createHash("sha256").update(node.parent.getText()).digest("hex");
          const randomizedName = `${node.name.getText()}_${suffix}`;
          const parameterRandomized = ts.updateParameter(
            node,
            node.decorators,
            node.modifiers,
            node.dotDotDotToken,
            randomizedName,
            node.questionToken,
            node.type,
            node.initializer
          );

          parameterRandomized.parent = node.parent;
          node = parameterRandomized;
        }

        // Check if identifier is a parameter and requires update;
        // `undefined` is declared as 'type undefined = any', so it has no declaration
        if (ts.isIdentifier(node) && node.getText(sourceFile) !== "undefined") {
          if (node.parent && ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) {
            return ts.visitEachChild(node, visitor, context);
          }
          const location = node.parent && ts.isPropertyAccessExpression(node.parent) ? node.parent.expression : node;

          let symbol = this.generator.checker.getSymbolAtLocation(location);

          if (!symbol) {
            const type = this.generator.checker.getTypeAtLocation(location);
            symbol = type.getSymbol();
          }

          if (symbol) {
            symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);
            const declaration = symbol.declarations[0];

            if (declaration && ts.isParameter(declaration)) {
              // Use parent function declaration to generate parameter's name unique suffix
              const suffix = crypto.createHash("sha256").update(declaration.parent.getText()).digest("hex");
              const randomizedName = `${node.getText()}_${suffix}`;
              const updated = ts.createIdentifier(randomizedName);
              updated.parent = node.parent;
              node = updated;
            }
          }
        }
        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}

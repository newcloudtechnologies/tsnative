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
import * as crypto from "crypto";
import { AbstractPreprocessor } from "./abstractpreprocessor";

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

        // Check if identifier is a parameter and requires update
        if (ts.isIdentifier(node)) {
          if (node.parent && ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) {
            return ts.visitEachChild(node, visitor, context);
          }

          const location = node.parent && ts.isPropertyAccessExpression(node.parent) ? node.parent.expression : node;
          if (this.generator.ts.checker.nodeHasSymbol(location)) {
            const symbol = this.generator.ts.checker.getSymbolAtLocation(location);

            if (symbol.declarations.length > 0) {
              const declaration = symbol.declarations[0];

              if (declaration && declaration.isParameter()) {
                // Use parent function declaration to generate parameter's name unique suffix
                const suffix = crypto.createHash("sha256").update(declaration.parent.getText()).digest("hex");
                const randomizedName = `${node.getText()}_${suffix}`;
                const updated = ts.createIdentifier(randomizedName);
                updated.parent = node.parent;
                node = updated;
              }
            }
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}

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

import { error, getAliasedSymbolIfNecessary } from "@utils";
import * as ts from "typescript";
import * as crypto from "crypto";
import { AbstractPreprocessor } from "@preprocessing";

export class ParametersRandomizingPreprocessor extends AbstractPreprocessor {
  handle(node: ts.Node, sourceFile: ts.SourceFile): ts.Node {
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
      return parameterRandomized;
    }

    if (ts.isIdentifier(node)) {
      // Check if identifier is a parameter and requires update
      if (node.getText(sourceFile) === "undefined") {
        // `undefined` is declared as 'type undefined = any', so it has no declaration
        return node;
      }
      const symbol = getAliasedSymbolIfNecessary(
        this.generator.checker.getSymbolAtLocation(node)!,
        this.generator.checker
      );
      if (!symbol) {
        error("No symbol found");
      }

      const declaration = symbol.declarations[0];
      if (!declaration) {
        error(`Declaration for '${node.getText()}' not found`);
      }

      if (ts.isParameter(declaration)) {
        // Use parent function declaration to generate parameter's name unique suffix
        const suffix = crypto.createHash("sha256").update(declaration.parent.getText()).digest("hex");
        const randomizedName = `${node.getText()}_${suffix}`;
        return ts.createIdentifier(randomizedName);
      }
    }

    if (this.next) {
      return this.next.handle(node, sourceFile);
    }

    return node;
  }
}

/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { flatten } from "lodash";
import * as fs from "fs";

export class NmSymbolExtractor {
  readSymbols(demangledTables: string[], mangledTables: string[]) {
    const demangledSymbols: string[] = flatten(
      demangledTables.map((file) => {
        const contents = fs.readFileSync(file, "utf8");
        return this.getExportedSymbols(contents);
      })
    );

    const mangledSymbols: string[] = flatten(
      mangledTables.map((file) => {
        const contents = fs.readFileSync(file, "utf8");
        return this.getExportedSymbols(contents);
      })
    );

    return { mangledSymbols, demangledSymbols };
  }

  private getExportedSymbols(rawOutput: string): string[] {
    const lines = rawOutput.split("\n");

    const removeLeadingUnderscope = process.platform === "darwin";
    const cutLeadingUnderscopeIfNecessary = (symbol: string) => {
      if (symbol.startsWith("__Z") && removeLeadingUnderscope) {
        return symbol.substring(1);
      }

      return symbol;
    };

    const symbols: (string | null)[] = lines.map((line) => {
      const trimmed = line.trim();
      const symbolTypePattern = new RegExp(/(?<=\s)\w(?=\s)/);
      const symbolTypeMatches = trimmed.match(symbolTypePattern);

      if (!symbolTypeMatches || symbolTypeMatches.length === 0) {
        return null;
      }

      const symbolType = symbolTypeMatches[0];
      if (symbolType === "V" || symbolType === "R" || symbolType === "S") {
        const symbol = trimmed.split(` ${symbolType} `)[1];
        return cutLeadingUnderscopeIfNecessary(symbol);
      }

      if (symbolType === "T" || symbolType === "W") {
        const signaturePattern = new RegExp(/(?<=(?<=\s)\w(?=\s)\s).*$/);
        const signatureMatches = trimmed.match(signaturePattern);
        if (!signatureMatches || signatureMatches.length === 0) {
          return null;
        }

        const symbol = signatureMatches[0];
        return cutLeadingUnderscopeIfNecessary(symbol);
      }
      return null;
    });
    return symbols.filter(Boolean) as string[];
  }
}

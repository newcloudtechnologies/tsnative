/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
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
    const symbols: (string | null)[] = lines.map((line) => {
      const trimmed = line.trim();
      const symbolTypePattern = new RegExp(/(?<=\s)\w(?=\s)/);
      const symbolTypeMatches = trimmed.match(symbolTypePattern);
      if (!symbolTypeMatches || symbolTypeMatches.length === 0) {
        return null;
      }
      const symbolType = symbolTypeMatches[0];
      if (symbolType === "T" || symbolType === "W") {
        const signaturePattern = new RegExp(/(?<=(?<=\s)\w(?=\s)\s).*$/);
        const signatureMatches = trimmed.match(signaturePattern);
        if (!signatureMatches || signatureMatches.length === 0) {
          return null;
        }
        return signatureMatches[0];
      }
      return null;
    });
    return symbols.filter(Boolean) as string[];
  }
}

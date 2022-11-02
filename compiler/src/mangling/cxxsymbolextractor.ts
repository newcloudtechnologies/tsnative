/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { flatten, zipWith } from "lodash";
import * as fs from "fs";

export class CXXSymbolExtractor {
  readSymbols(demangledTables: string[], mangledTables: string[]) {
    const demangledSymbols: string[] = flatten(
      demangledTables.map((file) => {
        console.log("[LOG] Looking demangled tables at " + file);
        const contents = fs.readFileSync(file, "utf8");
        return this.getExportedSymbols(contents);
      })
    );

    const mangledSymbols: string[] = flatten(
      mangledTables.map((file) => {
        console.log("[LOG] Looking mangled tables at " + file);
        const contents = fs.readFileSync(file, "utf8");
        return this.getExportedSymbols(contents);
      })
    );

    const zipped: [string, string][] = zipWith(demangledSymbols, mangledSymbols, (key: string, value: string) => {
      return [key, value];
    });

    const filtered = new Map<string, string>(zipped);
    const isServiceSymbol = (symbol: string) => symbol.startsWith("#");

    filtered.forEach((_, key) => {
      if (isServiceSymbol(key)) {
        filtered.delete(key);
      }
    });

    return { mangledSymbols: Array.from(filtered.values()), demangledSymbols: Array.from(filtered.keys()) };
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

    // mkrv @todo: it would be nice to filter all the service stuff like std, __gcc, __clang, etc
    const lambdaPattern = new RegExp(/(?=::.lambda.+\()/);
    const isLambda = (line: string) => {
      return line.match(lambdaPattern);
    };

    const nonVirtualThunkPattern = "non-virtual thunk to";

    const isNonVirtualThunk = (line: string) => {
      return line.includes(nonVirtualThunkPattern);
    };

    const isServiceLine = (line: string) => {
      return isLambda(line) || isNonVirtualThunk(line);
    };

    const symbols: (string | null)[] = lines.map((line) => {
      const trimmed = line.trim();

      const symbolTypePattern = new RegExp(/(?<=\s)\w(?=\s)/);
      const symbolTypeMatches = trimmed.match(symbolTypePattern);

      if (!symbolTypeMatches || symbolTypeMatches.length === 0) {
        return null;
      }

      const symbolType = symbolTypeMatches[0];
      if (symbolType === "V" || symbolType === "R" || symbolType === "S" || symbolType === "D") {
        let symbol = trimmed.split(` ${symbolType} `)[1];
        if (isServiceLine(line)) {
          symbol = "#" + symbol;
        }

        return cutLeadingUnderscopeIfNecessary(symbol);
      }

      if (symbolType === "T" || symbolType === "W") {
        const signaturePattern = new RegExp(/(?<=(?<=\s)\w(?=\s)\s).*$/);
        const signatureMatches = trimmed.match(signaturePattern);
        if (!signatureMatches || signatureMatches.length === 0) {
          return null;
        }

        let symbol = signatureMatches[0];
        if (isServiceLine(line)) {
          symbol = "#" + symbol;
        }

        return cutLeadingUnderscopeIfNecessary(symbol);
      }

      return null;
    });
    return symbols.filter(Boolean) as string[];
  }
}

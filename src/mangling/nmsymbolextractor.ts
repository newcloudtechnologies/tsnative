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

import { replaceOrAddExtension } from "@utils";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as R from "ramda";

export class NmSymbolExtractor {
  extractSymbols(cppDirs: string[]) {
    const runtimeLibPath = path.join(__dirname, "../../", "lib", "runtime");
    const runtimeLibFiles = fs
      .readdirSync(runtimeLibPath)
      .filter(file => path.extname(file) === ".cpp")
      .map(file => path.join(runtimeLibPath, file));

    const cppDependencies = cppDirs.map(dir => {
      return fs
        .readdirSync(dir)
        .filter(file => path.extname(file) === ".cpp")
        .map(file => path.join(dir, file));
    });

    const dependencies = runtimeLibFiles.concat(R.flatten<string>(cppDependencies));

    const optimizationLevel = "-O3";
    const outPath = fs.mkdtempSync(process.pid.toString());
    const dependencyObjects: string[] = [];
    try {
      dependencies.forEach(file => {
        const outFile = path.join(outPath, path.basename(replaceOrAddExtension(file, ".o")));
        execFileSync("g++", [optimizationLevel, file, "-c", "-o", outFile, "-std=c++11", "-Werror"]);
        dependencyObjects.push(outFile);
      });
    } catch (e) {
      for (const libObj of dependencyObjects) {
        fs.unlinkSync(libObj);
      }
      fs.rmdirSync(outPath);
      throw e;
    }

    const mangledSymbols: string[] = Array.prototype.concat.apply(
      [],
      dependencyObjects.map(libObj => {
        const output = execFileSync("nm", [libObj]).toString();
        return this.getExportedSymbols(output);
      })
    );
    const demangledSymbols: string[] = Array.prototype.concat.apply(
      [],
      dependencyObjects.map(libObj => {
        const output = execFileSync("nm", ["-C", libObj]).toString();
        return this.getExportedSymbols(output);
      })
    );
    for (const libObj of dependencyObjects) {
      fs.unlinkSync(libObj);
    }
    fs.rmdirSync(outPath);
    return { mangledSymbols, demangledSymbols, dependencies };
  }
  private getExportedSymbols(rawOutput: string): string[] {
    const lines = rawOutput.split("\n");
    const symbols: Array<string | null> = lines.map(line => {
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

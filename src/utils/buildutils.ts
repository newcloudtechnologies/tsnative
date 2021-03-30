import * as fs from "fs";
import * as llvm from "llvm-node";
import * as path from "path";
import * as ts from "typescript";
import { CommanderStatic } from "commander";

export function replaceOrAddExtension(filename: string, extension: string): string {
  const lastDotPosition = filename.lastIndexOf(".");
  const pos = lastDotPosition < 0 ? filename.length : lastDotPosition;
  return filename.substr(0, pos) + extension;
}

export function getOutputBaseName(program: ts.Program): string {
  const fileNames = program.getRootFileNames();
  return fileNames.length === 1 ? path.basename(fileNames[0], ".ts") : "main";
}

export function writeIRToFile(module: llvm.Module, program: ts.Program, argv: CommanderStatic): string {
  const basename = replaceOrAddExtension(getOutputBaseName(program), ".ll");
  const outputFile = argv.output || basename;

  fs.writeFileSync(outputFile, module.print());
  console.log(`${outputFile} written`);
  return outputFile;
}

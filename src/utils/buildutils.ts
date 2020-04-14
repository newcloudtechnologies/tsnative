import { execFileSync } from "child_process";
import * as fs from "fs";
import * as llvm from "llvm-node";
import * as path from "path";
import * as ts from "typescript";

export function replaceOrAddExtension(filename: string, extension: string): string {
  const lastDotPosition = filename.lastIndexOf(".");
  const pos = lastDotPosition < 0 ? filename.length : lastDotPosition;
  return filename.substr(0, pos) + extension;
}

export function getOutputBaseName(program: ts.Program): string {
  const fileNames = program.getRootFileNames();
  return fileNames.length === 1 ? path.basename(fileNames[0], ".ts") : "main";
}

export function writeIRToFile(module: llvm.Module, program: ts.Program): string {
  const fileName = replaceOrAddExtension(getOutputBaseName(program), ".ll");
  fs.writeFileSync(fileName, module.print());
  console.log(`${fileName} written`);
  return fileName;
}

export function writeBitcodeToFile(module: llvm.Module, program: ts.Program): string {
  const fileName = replaceOrAddExtension(getOutputBaseName(program), ".bc");
  llvm.writeBitcodeToFile(module, fileName);
  return fileName;
}

export function writeExecutableToFile(
  module: llvm.Module,
  program: ts.Program,
  output: string,
  dependencies: string[]
): void {
  const bitcodeFile = writeBitcodeToFile(module, program);
  const objectFile = replaceOrAddExtension(bitcodeFile, ".o");
  const executableFile = output || replaceOrAddExtension(bitcodeFile, "");
  const optimizationLevel = "-O3";

  try {
    execFileSync("llc", [optimizationLevel, "-relocation-model=pic", "-filetype=obj", bitcodeFile, "-o", objectFile]);
    execFileSync("g++", [
      optimizationLevel,
      objectFile,
      ...dependencies,
      "-o",
      executableFile,
      "-std=c++11",
      "-Werror"
    ]);
  } finally {
    fs.unlinkSync(bitcodeFile);
    fs.unlinkSync(objectFile);
  }
}

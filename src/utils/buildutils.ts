import { execFileSync } from "child_process";
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
  argv: CommanderStatic,
  dependencies: string[]
): void {
  const optimizationLevel = "-O3";
  const basename = getOutputBaseName(program);
  const executableFile = argv.output || basename;

  let bitcodeFile;
  let objectFile;
  let cppOut;

  try {
    if (argv.cbackend) {
      const ir = writeIRToFile(module, program);
      cppOut = replaceOrAddExtension(basename, ".cpp");
      execFileSync("llvm-cbe", [ir, "-o", cppOut]);
      fs.unlinkSync(ir);
      dependencies.unshift(cppOut);
    } else {
      bitcodeFile = writeBitcodeToFile(module, program);
      objectFile = replaceOrAddExtension(basename, ".o");
      execFileSync("llc", [optimizationLevel, "-relocation-model=pic", "-filetype=obj", bitcodeFile, "-o", objectFile]);
    }

    if (objectFile) {
      dependencies.unshift(objectFile);
    }

    const compilerParameters = [
      "-I./node_modules",
      optimizationLevel,
      ...dependencies,
      "-o",
      executableFile,
      "-std=c++11",
      "-Werror",
    ];
    execFileSync(argv.compiler, compilerParameters);
  } finally {
    if (bitcodeFile && fs.existsSync(bitcodeFile)) {
      fs.unlinkSync(bitcodeFile);
    }
    if (cppOut && fs.existsSync(cppOut)) {
      fs.unlinkSync(cppOut);
    }
    if (objectFile && fs.existsSync(objectFile)) {
      fs.unlinkSync(objectFile);
    }
  }
}

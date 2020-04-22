import "module-alias/register";

import { LLVMGenerator } from "@generator";
import * as argv from "commander";
import * as fs from "fs";
import * as llvm from "llvm-node";
import * as path from "path";
// @ts-ignore
import * as SegfaultHandler from "segfault-handler";
import * as ts from "typescript";

import { DEFINITIONS } from "stdlib/constants";

import { injectExternalSymbolsTables, prepareExternalSymbols } from "@mangling";
import { error, writeBitcodeToFile, writeExecutableToFile, writeIRToFile } from "@utils";

SegfaultHandler.registerHandler("ts-llvm-crash.log");

argv
  .option("--printIR", "print LLVM assembly to stdout")
  .option("--emitIR", "write LLVM assembly to file")
  .option("--emitBitcode", "write LLVM bitcode to file")
  .option("--target [value]", "generate code for the given target")
  .option("--output [value]", "specify output file for final executable")
  .option("--tsconfig [value]", "specify tsconfig", path.join(__dirname, "..", "tsconfig.json"))
  .parse(process.argv);

function parseTSConfig(): Promise<any> {
  let tsconfig;
  try {
    tsconfig = JSON.parse(fs.readFileSync(argv.tsconfig).toString());
  } catch (e) {
    error("Failed to parse tsconfig:" + e);
  }

  return Promise.resolve(tsconfig);
}

// entry point
parseTSConfig()
  .then(tsconfig => prepareExternalSymbols(tsconfig.cppDirs))
  .then(result => {
    const { mangledSymbols, demangledSymbols, dependencies } = result;
    injectExternalSymbolsTables(mangledSymbols, demangledSymbols);
    return dependencies;
  })
  .then(main)
  .catch(e => {
    console.log(e.stack);
    process.exit(1);
  });

async function main(dependencies: string[]) {
  const files = argv.args;

  const tsconfig = await parseTSConfig(); // @todo already parsed
  const options: ts.CompilerOptions = tsconfig.compilerOptions;
  options.lib = [DEFINITIONS];
  options.types = [];
  options.traceResolution = true;

  const host = ts.createCompilerHost(options);
  const program = ts.createProgram(files, options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (diagnostics.length > 0) {
    process.stdout.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
    process.exit(1);
  }

  llvm.initializeAllTargetInfos();
  llvm.initializeAllTargets();
  llvm.initializeAllTargetMCs();
  llvm.initializeAllAsmParsers();
  llvm.initializeAllAsmPrinters();

  const llvmModule = new LLVMGenerator(program).emitProgram();

  if (argv.target) {
    const targetTriple = argv.target;
    const target = llvm.TargetRegistry.lookupTarget(targetTriple);
    const targetMachine = target.createTargetMachine(targetTriple, "generic");
    llvmModule.dataLayout = targetMachine.createDataLayout();
    llvmModule.targetTriple = targetTriple;
  }

  if (argv.printIR) {
    process.stdout.write(llvmModule.print());
  }

  if (argv.emitIR) {
    writeIRToFile(llvmModule, program);
  }

  if (argv.emitBitcode) {
    writeBitcodeToFile(llvmModule, program);
  }

  if (!argv.printIR && !argv.emitIR && !argv.emitBitcode) {
    writeExecutableToFile(llvmModule, program, argv.output, dependencies);
  }
}

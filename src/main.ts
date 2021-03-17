import "module-alias/register";

import { LLVMGenerator } from "@generator";
import * as argv from "commander";
import * as fs from "fs";
import * as llvm from "llvm-node";
import * as path from "path";
import * as SegfaultHandler from "segfault-handler";
import * as ts from "typescript";

import { STDLIB, DEFINITIONS, UTILITY_DEFINITIONS } from "std-typescript-llvm/constants";

import { injectExternalSymbolsTables, prepareExternalSymbols } from "@mangling";
import { error, writeBitcodeToFile, writeExecutableToFile, writeIRToFile } from "@utils";
import { TemplateInstantiator } from "@cpp";
import { Preprocessor } from "@preprocessing";

SegfaultHandler.registerHandler("ts-llvm-crash.log");

argv
  .option("--printIR", "print LLVM assembly to stdout")
  .option("--emitIR", "write LLVM assembly to file")
  .option("--emitBitcode", "write LLVM bitcode to file")
  .option("--target [value]", "generate code for the given target")
  .option("--output [value]", "specify output file for final executable")
  .option("--tsconfig [value]", "specify tsconfig", path.join(__dirname, "..", "tsconfig.json"))
  .option("--compiler [value]", "specify C++ compiler", "g++")
  .option("--cbackend", "use CBackend instead of llc")
  .option("-L, --libs <items>", "specify external libraries (comma separated list)", (value: string) => {
    return value.split(",");
  })
  .parse(process.argv);

function parseTSConfig(): any {
  let tsconfig;
  try {
    tsconfig = JSON.parse(fs.readFileSync(argv.tsconfig).toString());
  } catch (e) {
    error("Failed to parse tsconfig:" + e);
  }

  return tsconfig;
}

// entry point
main().catch((e) => {
  console.log(e.stack);
  TemplateInstantiator.cleanup();
  process.exit(1);
});

async function main() {
  const files = argv.args;

  const tsconfig = parseTSConfig();
  const options: ts.CompilerOptions = tsconfig.compilerOptions;
  const libs: string[] = [];
  options.lib = [DEFINITIONS, UTILITY_DEFINITIONS];
  options.types = [];

  if (!options.strict) {
    console.warn(
      "It seems like strict mode is not enabled in tsconfig.json. Strict mode will be enforced by compiler and MAY require your code to be changed accordingly."
    );
    options.strict = true;
  }

  const host = ts.createCompilerHost(options);
  const program = new Preprocessor(files, options, host).program;

  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (tsconfig.libs) {
    for (const it of tsconfig.libs) {
      libs.push(path.resolve(path.dirname(argv.tsconfig), it));
    }
  }

  if (argv.libs) {
    const list = argv.libs as string[];
    list.forEach((v: string, i: number, a: string[]) => {
      a[i] = v.trim();
    });
    libs.push(...list);
  }

  libs.push(STDLIB);

  if (diagnostics.length > 0) {
    process.stdout.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
    process.exit(1);
  }

  llvm.initializeAllTargetInfos();
  llvm.initializeAllTargets();
  llvm.initializeAllTargetMCs();
  llvm.initializeAllAsmParsers();
  llvm.initializeAllAsmPrinters();

  const { mangledSymbols, demangledSymbols, dependencies } = await prepareExternalSymbols(tsconfig.cppDirs, libs);

  const templateInstantiator = new TemplateInstantiator(program, tsconfig, demangledSymbols);
  const instantiationResult = await templateInstantiator.instantiate();
  if (instantiationResult) {
    mangledSymbols.push(...instantiationResult.mangledSymbols);
    demangledSymbols.push(...instantiationResult.demangledSymbols);
    dependencies.push(...instantiationResult.dependencies);
  }

  injectExternalSymbolsTables(mangledSymbols, demangledSymbols);

  let llvmModule;
  try {
    llvmModule = new LLVMGenerator(program).createModule();
  } catch (e) {
    console.log(files);
    console.log(e);
    TemplateInstantiator.cleanup();
    process.exit(1);
  }

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
    writeExecutableToFile(llvmModule, program, argv, dependencies);
  }

  TemplateInstantiator.cleanup();
}

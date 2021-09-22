import { LLVMGenerator } from "./generator";
import * as argv from "commander";
import * as fs from "fs";
import * as llvm from "llvm-node";
import * as path from "path";
import * as SegfaultHandler from "segfault-handler";
import * as ts from "typescript";

import { NUMERIC, DEFINITIONS, UTILITY_DEFINITIONS, GC_DEFINITION, STUBS, ITERABLE } from "../std/constants";

import { injectExternalSymbolsTables, prepareExternalSymbols } from "./mangling";
import { Build } from "./buildutils/build";
import { TemplateInstantiator } from "./cppintegration/templateinstantiator";
import { Preprocessor } from "./preprocessing";

SegfaultHandler.registerHandler("ts-llvm-crash.log");

argv
  .option("--printIR", "print LLVM assembly to stdout")
  .option("--emitIR", "write LLVM assembly to file")
  .option("--processTemplateClasses", "instantiate template classes")
  .option("--processTemplateFunctions", "instantiate template functions")
  .option("--templatesOutputDir [value]", "specify path to instantiated templates", "")
  .option("--target [value]", "generate code for the given target")
  .option("--output [value]", "specify output file for final executable")
  .option("--tsconfig [value]", "specify tsconfig", path.join(__dirname, "..", "..", "tsconfig.json"))
  .option("--demangledTables <items>", "specify demangled symbol files (comma separated list)", (value: string) => {
    return value.split(",");
  })
  .option("--mangledTables <items>", "specify mangled symbol files (comma separated list)", (value: string) => {
    return value.split(",");
  })
  .option(
    "--includeDirs <items>",
    "specify dirs with c++ headers for templates instantiation (comma separated list)",
    (value: string) => {
      return value.split(",");
    }
  )
  .parse(process.argv);

function parseTSConfig(): any {
  let tsconfig;
  try {
    tsconfig = JSON.parse(fs.readFileSync(argv.tsconfig).toString());
  } catch (e) {
    throw new Error("Failed to parse tsconfig:" + e);
  }

  return tsconfig;
}

// entry point
main().catch((e) => {
  console.log(e.stack);
  process.exit(1);
});

async function main() {
  const files = argv.args;

  const tsconfig = parseTSConfig();
  const options: ts.CompilerOptions = tsconfig.compilerOptions;
  const demangledTables: string[] = [];
  const mangledTables: string[] = [];
  const includeDirs: string[] = [];
  options.lib = [STUBS, NUMERIC, DEFINITIONS, UTILITY_DEFINITIONS, GC_DEFINITION, ITERABLE];
  options.types = [];

  if (!options.strict) {
    console.warn(
      "It seems like strict mode is not enabled in tsconfig.json. Strict mode will be enforced by compiler and MAY require your code to be changed accordingly."
    );
    options.strict = true;
  }

  if (!options.experimentalDecorators) {
    console.warn(
      "It seems like experimental decorators support is not enabled in tsconfig.json. It will be enforced by compiler."
    );
    options.experimentalDecorators = true;
  }

  options.baseUrl = path.resolve(path.dirname(argv.tsconfig));

  const host = ts.createCompilerHost(options);
  const preprocessor = new Preprocessor(files, options, host);
  const program = preprocessor.program;

  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (argv.demangledTables) {
    const list = argv.demangledTables as string[];
    list.forEach((v: string, i: number, a: string[]) => {
      a[i] = v.trim();
    });
    demangledTables.push(...list);
  }

  if (argv.mangledTables) {
    const list = argv.mangledTables as string[];
    list.forEach((v: string, i: number, a: string[]) => {
      a[i] = v.trim();
    });
    mangledTables.push(...list);
  }

  if (argv.includeDirs) {
    const list = argv.includeDirs as string[];
    list.forEach((v: string, i: number, a: string[]) => {
      a[i] = v.trim();
    });
    includeDirs.push(...list);
  }

  if (diagnostics.length > 0) {
    preprocessor.cleanup();
    process.stdout.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
    process.exit(1);
  }

  llvm.initializeAllTargetInfos();
  llvm.initializeAllTargets();
  llvm.initializeAllTargetMCs();
  llvm.initializeAllAsmParsers();
  llvm.initializeAllAsmPrinters();

  // generate template classes
  if (argv.processTemplateClasses) {
    const templateInstantiator = new TemplateInstantiator(
      program,
      includeDirs,
      argv.templatesOutputDir,
      demangledTables,
      mangledTables
    );
    templateInstantiator.instantiateClasses();
    preprocessor.cleanup();
    return;
  }

  // generate template functions
  if (argv.processTemplateFunctions) {
    const templateInstantiator = new TemplateInstantiator(
      program,
      includeDirs,
      argv.templatesOutputDir,
      demangledTables,
      mangledTables
    );
    templateInstantiator.instantiateFunctions();
    preprocessor.cleanup();
    return;
  }

  preprocessor.cleanup();

  const { demangledSymbols, mangledSymbols } = await prepareExternalSymbols(demangledTables, mangledTables);

  injectExternalSymbolsTables(mangledSymbols, demangledSymbols);

  let llvmModule;
  try {
    llvmModule = new LLVMGenerator(program).createModule();
  } catch (e) {
    console.log(files);
    console.log(e);
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
    new Build().writeIRToFile(llvmModule, program, argv);
  }
}

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


// sanity check
let stdlib: any;
try {
  stdlib = require('std/constants');
} catch (e) {
  throw new Error('Failed to load std: missing NODE_PATH env var?\n' + e);
}

import { LLVMGenerator } from "./generator";
import * as argv from "commander";
import * as fs from "fs";
import * as llvm from "llvm-node";
import * as path from "path";
import * as ts from "typescript";
import { Build } from "./buildutils/build";
import { TemplateInstantiator } from "./cppintegration/templateinstantiator";
import { initCXXSymbols } from "./mangling";

var pjson = require('../package.json');
var version_string = pjson.version + ' (Based on Node.js ' + process.version + ")"

argv
  .name('compiler') // TODO: get binary name from env?
  .description('Typescript Native Compiler')
  .version(version_string)
  .option("--printIR", "print LLVM assembly to stdout")
  .option("--emitIR", "write LLVM assembly to file")
  .option("--processTemplateClasses", "instantiate template classes")
  .option("--processTemplateFunctions", "instantiate template functions")
  .option("--templatesOutputDir [value]", "specify path to instantiated templates", "")
  .option("--target <absolute path>", "generate code for the given target")
  .option("--build <absolute path>", "specify build dir")
  .option("--baseUrl <absolute path>", "specify base dir")
  .option("--tsconfig <absolute path>", "specify tsconfig")
  .option("--trace", "enable tracing")
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
  .option("--debug", "Generate debug information")
  .option("--runEventLoop <[lock|oneshot]>", "Run event loop and lock execution (lock) or exit immediately (oneshot)")
  .option("--enableOptimizations", "[True | False] If true, it disables all unnecessary allocations")
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

// compiler requires source files to follow imports relations
// create fake program from single entry point to get properly ordered source files
function getFullProgramSources(rootNames: readonly string[], options: ts.CompilerOptions, host?: ts.CompilerHost) {
  const program = ts.createProgram(rootNames, options, host);
  return program.getSourceFiles().map((file) => file.fileName);
}

// entry point
main().catch((e) => {
  console.log(e.stack);
  process.exit(1);
});

async function main() {
  // print command line
  const files = argv.args;
  console.log(process.argv.join(" "))

  const tsconfig = parseTSConfig();
  const options: ts.CompilerOptions = tsconfig.compilerOptions;
  const demangledTables: string[] = [];
  const mangledTables: string[] = [];
  const includeDirs: string[] = [];
  options.lib = [
    stdlib.STUBS,
    stdlib.NUMERIC,
    stdlib.STRING_DEFINITION,
    stdlib.ARRAY_DEFINITION,
    stdlib.OBJECT_DEFINITION,
    stdlib.UNDEFINED_DEFINITION,
    stdlib.NULL_DEFINITION,
    stdlib.NUMBER_DEFINITION,
    stdlib.BOOLEAN_DEFINITION,
    stdlib.UNION_DEFINITION,
    stdlib.SET_DEFINITION,
    stdlib.MAP_DEFINITION,
    stdlib.TUPLE_DEFINITION,
    stdlib.CLOSURE_DEFINITION,
    stdlib.CONSOLE_DEFINITION,
    stdlib.GC_DEFINITION,
    stdlib.ITERABLE_DEFINITION,
    stdlib.STRING_ITERATOR_DEFINITION,
    stdlib.MAP_ITERATOR_DEFINITION,
    stdlib.SET_ITERATOR_DEFINITION,
    stdlib.DATE_DEFINITION,
    stdlib.MATH_DEFINITION,
    stdlib.RUNTIME_DEFINITION,
    stdlib.DIAGNOSTICS_DEFINITION,
    stdlib.MEMORY_DIAGNOSTICS_DEFINITION,
    stdlib.SET_INTERVAL_DEFINITION,
    stdlib.SET_TIMEOUT_DEFINITION,
    stdlib.EVENT_LOOP_DEFINITION,
    stdlib.PROMISE_DEFINITION,
    stdlib.PARSE_INT_DEFINITION,
    stdlib.PARSE_FLOAT_DEFINITION,
  ];
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

  if (!options.allowUnreachableCode) {
    console.warn("It seems like unreachable code is not forbidden by tsconfig.json. It will be enforced by compiler.");
    options.allowUnreachableCode = false;
  }

  if (argv.baseUrl) {
    options.baseUrl = path.resolve(argv.baseUrl);
    console.info("baseUrl is set to " + options.baseUrl);
  } else {
    options.baseUrl = path.resolve(path.dirname(argv.tsconfig));
    console.warn("baseUrl argument is not provided. Using default value: " + options.baseUrl);
  }

  if (argv.trace) {
    // TODO: other diagnostics options (diagnostics,explainFiles,extendedDiagnostics,generateCpuProfile,listEmittedFiles,listFiles)
    options.traceResolution = true
  }

  const host = ts.createCompilerHost(options);

  const sources = getFullProgramSources(files, options, host);
  const program = ts.createProgram(sources, options, host);

  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (argv.demangledTables && argv.mangledTables) {
    demangledTables.push(...(argv.demangledTables as string[]).map((value) => value.trim()));
    mangledTables.push(...(argv.mangledTables as string[]).map((value) => value.trim()));
  }

  if (argv.includeDirs) {
    const list = argv.includeDirs as string[];
    list.forEach((v: string, i: number, a: string[]) => {
      a[i] = v.trim();
    });
    const unique = list.filter((elem, index, self) => {
      return index === self.indexOf(elem);
    });
    includeDirs.push(...unique);
  }

  if (diagnostics.length > 0) {
    process.stdout.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
    process.exit(1);
  }

  llvm.initializeAllTargetInfos();
  llvm.initializeAllTargets();
  llvm.initializeAllTargetMCs();
  llvm.initializeAllAsmParsers();
  llvm.initializeAllAsmPrinters();

  initCXXSymbols(demangledTables, mangledTables);

  // generate template classes
  if (argv.processTemplateClasses) {
    const templateInstantiator = new TemplateInstantiator(
      program,
      includeDirs,
      argv.templatesOutputDir
    );
    templateInstantiator.instantiateClasses();
    return;
  }

  // generate template functions
  if (argv.processTemplateFunctions) {
    const templateInstantiator = new TemplateInstantiator(
      program,
      includeDirs,
      argv.templatesOutputDir
    );
    templateInstantiator.instantiateFunctions();
    return;
  }

  let llvmModule;
  try {
    llvmModule = new LLVMGenerator(program, argv.runEventLoop, argv.enableOptimizations, argv.debug).init().createModule();
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
    const dotTsFiles = process.argv.filter((s) => { return s.endsWith(".ts"); });
    const outputName = dotTsFiles.length !== 0 ? dotTsFiles[0] : "a.ts";
    new Build().writeIRToFile(llvmModule, outputName, argv);
  }
}

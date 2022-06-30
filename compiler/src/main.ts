import { LLVMGenerator } from "./generator";
import * as argv from "commander";
import * as fs from "fs";
import * as llvm from "llvm-node";
import * as path from "path";
import * as ts from "typescript";
import { injectExternalSymbolsTables, prepareExternalSymbols } from "./mangling";
import { Build } from "./buildutils/build";
import { TemplateInstantiator } from "./cppintegration/templateinstantiator";
import { Preprocessor } from "./preprocessing";

var pjson = require('../package.json');
var version_string = pjson.version + ' (Based on Node.js ' + process.version + ")"

const stdlib = require("std/constants");

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
  // print command line
  console.log(process.argv.join(" "))

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
    stdlib.MATH_DEFINITION
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
  const preprocessor = new Preprocessor(files, options, host, argv.build);
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
    return;
  }

  const { demangledSymbols, mangledSymbols } = await prepareExternalSymbols(demangledTables, mangledTables);

  injectExternalSymbolsTables(mangledSymbols, demangledSymbols);

  let llvmModule;
  try {
    llvmModule = new LLVMGenerator(program, argv.debug).createModule();
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

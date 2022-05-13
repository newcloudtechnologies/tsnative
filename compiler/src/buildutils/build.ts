import * as fs from "fs";
import * as llvm from "llvm-node";
import * as path from "path";
import * as ts from "typescript";
import { CommanderStatic } from "commander";

export class Build {
  private replaceOrAddExtension(filename: string, extension: string): string {
    const lastDotPosition = filename.lastIndexOf(".");
    const pos = lastDotPosition < 0 ? filename.length : lastDotPosition;
    return filename.substr(0, pos) + extension;
  }

  private getOutputBaseName(program: ts.Program): string {
    const fileNames = program.getRootFileNames();

    // entry file is last item in the list
    return path.basename(fileNames[fileNames.length - 1], ".ts");
  }

  writeIRToFile(module: llvm.Module, program: ts.Program, argv: CommanderStatic): string {
    const basename = this.replaceOrAddExtension(this.getOutputBaseName(program), ".ll");

    const outputFile = argv.build ? path.join(argv.build, path.sep, basename) : basename;

    fs.writeFileSync(outputFile, module.print());
    console.log(`${outputFile} written`);
    return outputFile;
  }
}

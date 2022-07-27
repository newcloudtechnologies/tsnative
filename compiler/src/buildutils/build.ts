import * as fs from "fs";
import * as llvm from "llvm-node";
import * as path from "path";
import { CommanderStatic } from "commander";

export class Build {
  private replaceOrAddExtension(filename: string, extension: string): string {
    const lastDotPosition = filename.lastIndexOf(".");
    const pos = lastDotPosition < 0 ? filename.length : lastDotPosition;
    return filename.substr(0, pos) + extension;
  }

  writeIRToFile(module: llvm.Module, targetPath: string, argv: CommanderStatic): string {
    const basename = this.replaceOrAddExtension(path.basename(targetPath, ".ts"), ".ll");

    const outputFile = argv.build ? path.join(argv.build, path.sep, basename) : basename;
    
    fs.writeFileSync(outputFile, module.print());
    console.log(`${outputFile} written`);
    return outputFile;
  }
}

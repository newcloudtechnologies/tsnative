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

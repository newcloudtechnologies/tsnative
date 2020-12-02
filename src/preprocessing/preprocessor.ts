/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import * as ts from "typescript";
import { TSObjectConsoleLogPass } from "@preprocessing";

export class Preprocessor {
  private readonly generatedProgram: ts.Program;

  constructor(files: string[], options: ts.CompilerOptions, host: ts.CompilerHost) {
    this.generatedProgram = new TSObjectConsoleLogPass(files, options, host).program;
  }

  get program() {
    return this.generatedProgram;
  }
}

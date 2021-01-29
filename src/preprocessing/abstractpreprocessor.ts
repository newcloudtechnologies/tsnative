/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { LLVMGenerator } from "@generator";
import * as ts from "typescript";

export abstract class AbstractPreprocessor {
  protected next: AbstractPreprocessor | undefined;
  protected generator: LLVMGenerator;
  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }
  abstract handle(node: ts.Node, sourceFile: ts.SourceFile): ts.Node;
  setNext(preprocessor: AbstractPreprocessor): void {
    this.next = preprocessor;
  }
}

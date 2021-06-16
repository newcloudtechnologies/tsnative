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

class PrepocessorUtils {
  isSyntheticNode(node: ts.Node) {
    return node.pos === -1 && node.end === -1;
  }

  getParentFromOriginal(node: ts.Node): ts.Node | undefined {
    // @ts-ignore
    let original = node.original;
    while (original) {
      if (original.parent) {
        return original.parent;
      }

      original = original.original;
    }

    return undefined;
  }
}

export abstract class AbstractPreprocessor {
  protected generator: LLVMGenerator;
  protected utils = new PrepocessorUtils();

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  abstract transformer: ts.TransformerFactory<ts.SourceFile>;
}

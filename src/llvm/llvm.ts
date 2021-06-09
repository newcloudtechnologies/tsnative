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
import { LLVMFunction } from "./function";

export class LLVM {
  readonly function: LLVMFunction;

  constructor(generator: LLVMGenerator) {
    this.function = new LLVMFunction(generator);
  }
}

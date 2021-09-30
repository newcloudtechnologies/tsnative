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

import { LLVMGenerator } from "../generator";
import { TypeChecker } from "./typechecker";
import { TSArray } from "./array";
import { TSTuple } from "./tuple";

export class TS {
  readonly checker: TypeChecker;
  readonly array: TSArray;
  readonly tuple: TSTuple;

  constructor(generator: LLVMGenerator) {
    this.checker = new TypeChecker(generator.program.getTypeChecker(), generator);
    this.array = new TSArray(generator);
    this.tuple = new TSTuple(generator);
  }
}

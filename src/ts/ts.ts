/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { LLVMGenerator } from "../generator";
import { TypeChecker } from "./typechecker";
import { TSArray } from "./array";
import { TSTuple } from "./tuple";
import { TSIterableIterator } from "./iterableiterator";
import { TSIterator } from "./iterator";

export class TS {
  readonly checker: TypeChecker;
  readonly array: TSArray;
  readonly tuple: TSTuple;
  readonly iterator: TSIterator;
  readonly iterableIterator: TSIterableIterator;

  constructor(generator: LLVMGenerator) {
    this.checker = new TypeChecker(generator.program.getTypeChecker(), generator);
    this.array = new TSArray(generator);
    this.tuple = new TSTuple(generator);
    this.iterator = new TSIterator(generator);
    this.iterableIterator = new TSIterableIterator(generator);
  }
}

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

import * as ts from "typescript";

import { LLVMGenerator } from "@generator";
import { TypeChecker } from "./typechecker";

export class TS {
  readonly checker: TypeChecker;

  constructor(checker: ts.TypeChecker, generator: LLVMGenerator) {
    this.checker = new TypeChecker(checker, generator);
  }
}

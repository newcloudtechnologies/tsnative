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
import { Closure, LazyClosure } from "./closure";
import { Intersection } from "./intersection";
import { Union } from "./union";

export class Types {
  readonly union: Union;
  readonly intersection: Intersection;
  readonly closure: Closure;
  readonly lazyClosure: LazyClosure;

  constructor(generator: LLVMGenerator) {
    this.union = new Union(generator);
    this.intersection = new Intersection(generator);
    this.closure = new Closure(generator);
    this.lazyClosure = new LazyClosure(generator);
  }
}

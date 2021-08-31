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

import { SIZEOF_STRING, SIZEOF_ARRAY, SIZEOF_TSCLOSURE, SIZEOF_MAP, SIZEOF_SET } from "../cppintegration";
import { LLVMType } from "../llvm/type";

export class SizeOf {
  getByLLVMType(type: LLVMType): number | undefined {
    if (type.isString()) {
      return SIZEOF_STRING;
    } else if (type.isArray()) {
      return SIZEOF_ARRAY;
    } else if (type.isClosure()) {
      return SIZEOF_TSCLOSURE;
    } else if (type.isMap()) {
      return SIZEOF_MAP;
    } else if (type.isSet()) {
      return SIZEOF_SET;
    }
    return;
  }

  getByName(name: string): number | undefined {
    if (name === "string") {
      return SIZEOF_STRING;
    } else if (name.startsWith("Array__")) {
      return SIZEOF_ARRAY;
    } else if (name.startsWith("TSClosure__class")) {
      return SIZEOF_TSCLOSURE;
    } else if (name.startsWith("Map__")) {
      return SIZEOF_MAP;
    } else if (name.startsWith("Set__")) {
      return SIZEOF_SET;
    }
    return;
  }
}

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

import { checkIfLLVMString, checkIfLLVMArray, isTSClosureType } from "@utils";
import { SIZEOF_STRING, SIZEOF_ARRAY, SIZEOF_TSCLOSURE } from "@cpp";

export class SizeOf {
  static getByLLVMType(type: llvm.Type): number | undefined {
    if (checkIfLLVMString(type)) {
      return SIZEOF_STRING;
    } else if (checkIfLLVMArray(type)) {
      return SIZEOF_ARRAY;
    } else if (isTSClosureType(type)) {
      return SIZEOF_TSCLOSURE;
    }
    return;
  }

  static getByName(name: string): number | undefined {
    if (name === "string") {
      return SIZEOF_STRING;
    } else if (name.startsWith("Array__")) {
      return SIZEOF_ARRAY;
    } else if (name.startsWith("TSClosure__class")) {
      return SIZEOF_TSCLOSURE;
    }
    return;
  }
}

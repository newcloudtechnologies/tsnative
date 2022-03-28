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

import { SIZEOF_STRING, SIZEOF_ARRAY, SIZEOF_TSCLOSURE, SIZEOF_MAP, SIZEOF_SET, SIZEOF_TUPLE } from "../cppintegration";
import { LLVMType } from "../llvm/type";
import { SIZEOF_BOOLEAN, SIZEOF_NULL, SIZEOF_NUMBER, SIZEOF_OBJECT, SIZEOF_UNDEFINED, SIZEOF_UNION } from "./constants";

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
    } else if (type.isTuple()) {
      return SIZEOF_TUPLE;
    } else if (type.isUndefined()) {
      return SIZEOF_UNDEFINED;
    } else if (type.isNull()) {
      return SIZEOF_NULL;
    } else if (type.isObject()) {
      return SIZEOF_OBJECT;
    } else if (type.isTSNumber()) {
      return SIZEOF_NUMBER;
    }
    return;
  }

  getByName(name: string): number | undefined {
    switch (name) {
      case "String":
        return SIZEOF_STRING;
      case "Number":
        return SIZEOF_NUMBER;
      case "Array":
        return SIZEOF_ARRAY;
      case "Closure":
        return SIZEOF_TSCLOSURE;
      case "Map":
        return SIZEOF_MAP;
      case "Set":
        return SIZEOF_SET;
      case "Tuple":
        return SIZEOF_TUPLE;
      case "Object":
        return SIZEOF_OBJECT;
      case "Null":
        return SIZEOF_NULL;
      case "Undefined":
        return SIZEOF_UNDEFINED;
      case "Boolean":
        return SIZEOF_BOOLEAN;
      case "Union":
        return SIZEOF_UNION;

      default:
        return;
    }
  }
}

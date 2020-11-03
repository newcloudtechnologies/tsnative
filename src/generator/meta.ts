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

import { error } from "@utils";
import { Type } from "typescript";

type PropsMap = Map<string, number>;
class UnionMeta {
  name: string;
  type: llvm.Type;
  props: string[];
  propsMap: PropsMap;

  constructor(name: string, type: llvm.Type, props: string[], propsMap: PropsMap) {
    this.name = name;
    this.type = type;
    this.props = props;
    this.propsMap = propsMap;
  }
}

class IntersectionMeta {
  name: string;
  type: llvm.Type;
  props: string[];

  constructor(name: string, type: llvm.Type, props: string[]) {
    this.name = name;
    this.type = type;
    this.props = props;
  }
}

class StructMeta {
  name: string;
  type: llvm.Type;
  props: string[];

  constructor(name: string, type: llvm.Type, props: string[]) {
    this.name = name;
    this.type = type;
    this.props = props;
  }
}

class ObjectMeta {
  name: string;
  type: llvm.StructType;
  props: string[];

  constructor(name: string, type: llvm.StructType, props: string[]) {
    this.name = name;
    this.type = type;
    this.props = props;
  }
}

export class MetaInfoStorage {
  readonly unionMetaInfoStorage: UnionMeta[] = [];
  readonly intersectionMetaInfoStorage: IntersectionMeta[] = [];
  readonly structMetaInfoStorage: StructMeta[] = [];
  readonly objectMetaInfoStorage: ObjectMeta[] = [];

  registerUnionMeta(name: string, type: llvm.Type, props: string[], propsMap: PropsMap) {
    this.unionMetaInfoStorage.push(new UnionMeta(name, type, props, propsMap));
  }

  getUnionMeta(name: string) {
    const meta = this.unionMetaInfoStorage.find((value) => value.name === name);
    if (!meta) {
      error(`No union meta found for '${name}'`);
    }
    return meta;
  }

  registerIntersectionMeta(name: string, type: llvm.Type, props: string[]) {
    this.intersectionMetaInfoStorage.push(new IntersectionMeta(name, type, props));
  }

  getIntersectionMeta(name: string) {
    const meta = this.intersectionMetaInfoStorage.find((value) => value.name === name);
    if (!meta) {
      error(`No intersection meta found for '${name}'`);
    }
    return meta;
  }

  registerStructMeta(name: string, type: llvm.Type, props: string[]) {
    this.structMetaInfoStorage.push(new StructMeta(name, type, props));
  }

  getStructMeta(name: string) {
    const meta = this.structMetaInfoStorage.find((value) => value.name === name);
    if (!meta) {
      error(`No struct meta found for '${name}'`);
    }
    return meta;
  }

  registerObjectMeta(name: string, type: llvm.StructType, props: string[]) {
    this.objectMetaInfoStorage.push(new ObjectMeta(name, type, props));
  }

  getObjectMeta(name: string) {
    const meta = this.objectMetaInfoStorage.find((value) => value.name === name);
    if (!meta) {
      error(`No object meta found for '${name}'`);
    }
    return meta;
  }

  try<T>(getter: (name: string) => T, name: string) {
    try {
      const meta = getter.call(this, name);
      return meta;
    } catch (_) {
      return undefined;
    }
  }
}

export class GenericTypeMapper {
  readonly genericTypenameTypeMap = new Map<string, Type>();

  register(name: string, type: Type) {
    this.genericTypenameTypeMap.set(name, type);
  }

  get(name: string) {
    const type = this.genericTypenameTypeMap.get(name);
    if (!type) {
      error(`Generic typename '${name} is not registered'`);
    }

    return type;
  }
}

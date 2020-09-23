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

type PropsMap = Map<string, number>;
class UnionMeta {
  name: string;
  type: llvm.Type;
  propsMap: PropsMap;

  constructor(name: string, type: llvm.Type, propsMap: PropsMap) {
    this.name = name;
    this.type = type;
    this.propsMap = propsMap;
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
  readonly objectMetaInfoStorage: ObjectMeta[] = [];

  registerUnionMeta(name: string, type: llvm.Type, propsMap: PropsMap) {
    this.unionMetaInfoStorage.push(new UnionMeta(name, type, propsMap));
  }

  getUnionMeta(name: string) {
    return this.unionMetaInfoStorage.find((value) => value.name === name);
  }

  registerObjectMeta(name: string, type: llvm.StructType, props: string[]) {
    this.objectMetaInfoStorage.push(new ObjectMeta(name, type, props));
  }

  getObjectMeta(name: string) {
    return this.objectMetaInfoStorage.find((value) => value.name === name);
  }
}

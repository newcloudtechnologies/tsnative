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

import { Environment } from "@scope";
import { error } from "@utils";
import * as ts from "typescript";
import * as crypto from "crypto";

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

class ClosureParametersMetaStorage {
  readonly storage = new Map<string, Map<string, ts.FunctionDeclaration>>();
}

class FunctionExpressionEnvStorage {
  readonly storage = new Map<string, Environment>();
}

class ClosureEnvironmentStorage {
  readonly storage = new Map<llvm.Value, Environment>();
}

export class MetaInfoStorage {
  readonly unionMetaInfoStorage: UnionMeta[] = [];
  readonly intersectionMetaInfoStorage: IntersectionMeta[] = [];
  readonly structMetaInfoStorage: StructMeta[] = [];
  readonly objectMetaInfoStorage: ObjectMeta[] = [];
  readonly closureParametersMeta = new ClosureParametersMetaStorage();
  readonly functionExpressionEnv = new FunctionExpressionEnvStorage();
  readonly closureEnvironment = new ClosureEnvironmentStorage();

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

  registerClosureParameter(
    parentFunction: string,
    closureParameter: string,
    closureFunctionDeclaration: ts.FunctionDeclaration
  ) {
    const knownClosureParameters = this.closureParametersMeta.storage.get(parentFunction);
    if (!knownClosureParameters) {
      const closuresForParentFunction = new Map<string, ts.FunctionDeclaration>();
      closuresForParentFunction.set(closureParameter, closureFunctionDeclaration);
      this.closureParametersMeta.storage.set(parentFunction, closuresForParentFunction);
    } else {
      knownClosureParameters.set(closureParameter, closureFunctionDeclaration);
      this.closureParametersMeta.storage.set(parentFunction, knownClosureParameters);
    }
  }

  getClosureParameterDeclaration(parentFunction: string, closureParameter: string) {
    const knownClosureParameters = this.closureParametersMeta.storage.get(parentFunction);
    if (!knownClosureParameters) {
      error(`No closure parameters registered for '${parentFunction}'`);
    }

    const declaration = knownClosureParameters.get(closureParameter);
    if (!declaration) {
      error(`No declaration registered for '${closureParameter}'`);
    }

    return declaration;
  }

  registerFunctionEnvironment(declaration: ts.Declaration, env: Environment) {
    this.functionExpressionEnv.storage.set(
      crypto.createHash("sha256").update(declaration.getText()).digest("hex"),
      env
    );
  }

  getFunctionEnvironment(declaration: ts.Declaration): Environment {
    const hash = crypto.createHash("sha256").update(declaration.getText()).digest("hex");
    const stored = this.functionExpressionEnv.storage.get(hash);
    if (!stored) {
      error(`No environment registered`);
    }

    return stored;
  }

  registerClosureEnvironment(closure: llvm.Value, environment: Environment) {
    this.closureEnvironment.storage.set(closure, environment);
  }

  getClosureEnvironment(closure: llvm.Value) {
    const environment = this.closureEnvironment.storage.get(closure);
    if (!environment) {
      error("No environment registered");
    }
    return environment;
  }

  try<A, T>(getter: (_: A) => T, arg: A) {
    try {
      const meta = getter.call(this, arg);
      return meta;
    } catch (_) {
      return undefined;
    }
  }
}

export class GenericTypeMapper {
  readonly genericTypenameTypeMap = new Map<string, ts.Type>();

  register(name: string, type: ts.Type) {
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

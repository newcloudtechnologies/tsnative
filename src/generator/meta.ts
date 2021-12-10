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

import * as crypto from "crypto";
import * as ts from "typescript";

import { Environment, Prototype } from "../scope";
import { TSType } from "../ts/type";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";
import { Declaration } from "../ts/declaration";

type PropsMap = Map<string, number>;
class UnionMeta {
  name: string;
  type: LLVMType;
  props: string[];
  propsMap: PropsMap;

  constructor(name: string, type: LLVMType, props: string[], propsMap: PropsMap) {
    this.name = name;
    this.type = type;
    this.props = props;
    this.propsMap = propsMap;
  }
}

class IntersectionMeta {
  name: string;
  type: LLVMType;
  props: string[];

  constructor(name: string, type: LLVMType, props: string[]) {
    this.name = name;
    this.type = type;
    this.props = props;
  }
}

class StructMeta {
  name: string;
  type: LLVMType;
  props: string[];

  constructor(name: string, type: LLVMType, props: string[]) {
    this.name = name;
    this.type = type;
    this.props = props;
  }
}

class ObjectMeta {
  name: string;
  type: LLVMStructType;
  props: string[];

  constructor(name: string, type: LLVMStructType, props: string[]) {
    this.name = name;
    this.type = type;
    this.props = props;
  }
}

class ClosureParametersMetaStorage {
  readonly storage = new Map<string, Map<string, Declaration>>();
}

class FunctionExpressionEnvStorage {
  readonly storage = new Map<string, Environment>();
}

class ClosureEnvironmentStorage {
  readonly storage = new Map<LLVMValue, Environment>();
}

class ParameterPrototypeStorage {
  readonly storage = new Map<string, Prototype>();
}

class ClassDeclarationTypeMapperStorage {
  readonly storage = new Map<ts.Declaration, GenericTypeMapper>();
}

export class MetaInfoStorage {
  readonly unionMetaInfoStorage: UnionMeta[] = [];
  readonly intersectionMetaInfoStorage: IntersectionMeta[] = [];
  readonly structMetaInfoStorage: StructMeta[] = [];
  readonly objectMetaInfoStorage: ObjectMeta[] = [];
  readonly closureParametersMeta = new ClosureParametersMetaStorage();
  readonly functionExpressionEnv = new FunctionExpressionEnvStorage();
  readonly closureEnvironment = new ClosureEnvironmentStorage();
  readonly parameterPrototype = new ParameterPrototypeStorage();
  readonly classDeclarationTypeMapper = new ClassDeclarationTypeMapperStorage();

  registerUnionMeta(name: string, type: LLVMType, props: string[], propsMap: PropsMap) {
    this.unionMetaInfoStorage.push(new UnionMeta(name, type, props, propsMap));
  }

  getUnionMeta(name: string) {
    const meta = this.unionMetaInfoStorage.find((value) => value.name === name);
    if (!meta) {
      throw new Error(`No union meta found for '${name}'`);
    }
    return meta;
  }

  registerIntersectionMeta(name: string, type: LLVMType, props: string[]) {
    this.intersectionMetaInfoStorage.push(new IntersectionMeta(name, type, props));
  }

  getIntersectionMeta(name: string) {
    const meta = this.intersectionMetaInfoStorage.find((value) => value.name === name);
    if (!meta) {
      throw new Error(`No intersection meta found for '${name}'`);
    }
    return meta;
  }

  registerStructMeta(name: string, type: LLVMType, props: string[]) {
    this.structMetaInfoStorage.push(new StructMeta(name, type, props));
  }

  getStructMeta(name: string) {
    const meta = this.structMetaInfoStorage.find((value) => value.name === name);
    if (!meta) {
      throw new Error(`No struct meta found for '${name}'`);
    }
    return meta;
  }

  registerObjectMeta(name: string, type: LLVMStructType, props: string[]) {
    this.objectMetaInfoStorage.push(new ObjectMeta(name, type, props));
  }

  getObjectMeta(name: string) {
    const meta = this.objectMetaInfoStorage.find((value) => value.name === name);
    if (!meta) {
      throw new Error(`No object meta found for '${name}'`);
    }
    return meta;
  }

  registerClosureParameter(parentFunction: string, closureParameter: string, closureFunctionDeclaration: Declaration) {
    const knownClosureParameters = this.closureParametersMeta.storage.get(parentFunction);
    if (!knownClosureParameters) {
      const closuresForParentFunction = new Map<string, Declaration>();
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
      throw new Error(`No closure parameters registered for '${parentFunction}'`);
    }

    const declaration = knownClosureParameters.get(closureParameter);
    if (!declaration) {
      throw new Error(`No declaration registered for '${closureParameter}'`);
    }

    return declaration;
  }

  registerFunctionEnvironment(declaration: Declaration, env: Environment) {
    this.functionExpressionEnv.storage.set(
      crypto.createHash("sha256").update(declaration.getText()).digest("hex"),
      env
    );
  }

  getFunctionEnvironment(declaration: Declaration): Environment {
    const hash = crypto.createHash("sha256").update(declaration.getText()).digest("hex");
    const stored = this.functionExpressionEnv.storage.get(hash);
    if (!stored) {
      throw new Error(`No environment registered for '${declaration.getText()}'`);
    }

    return stored;
  }

  registerClosureEnvironment(closure: LLVMValue, environment: Environment) {
    this.closureEnvironment.storage.set(closure, environment);
  }

  getClosureEnvironment(closure: LLVMValue) {
    const environment = this.closureEnvironment.storage.get(closure);
    if (!environment) {
      throw new Error("No environment registered");
    }
    return environment;
  }

  registerParameterPrototype(parameter: string, prototype: Prototype) {
    this.parameterPrototype.storage.set(parameter, prototype);
  }

  getParameterPrototype(parameter: string) {
    const prototype = this.parameterPrototype.storage.get(parameter);
    if (!prototype) {
      throw new Error(`No prototype registered for '${parameter}'`);
    }
    return prototype;
  }

  registerClassTypeMapper(declaration: Declaration, mapper: GenericTypeMapper) {
    this.classDeclarationTypeMapper.storage.set(declaration.unwrapped, mapper);
  }

  getClassTypeMapper(declaration: Declaration) {
    const mapper = this.classDeclarationTypeMapper.storage.get(declaration.unwrapped);
    if (!mapper) {
      throw new Error(`No type mapper registered for '${declaration.getText()}'`);
    }
    return mapper;
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
  private readonly genericTypenameTypeMap = new Map<string, TSType>();
  private parent: GenericTypeMapper | undefined;

  setParent(parent: GenericTypeMapper) {
    this.parent = parent;
  }

  register(name: string, type: TSType) {
    if (this.genericTypenameTypeMap.has(name)) {
      throw new Error(`Generic type '${name}' already registered`);
    }
    this.genericTypenameTypeMap.set(name, type);
  }

  get(name: string): TSType {
    let type = this.genericTypenameTypeMap.get(name);
    if (!type) {
      if (!this.parent) {
        throw new Error(`Generic typename '${name}' is not registered`);
      }

      type = this.parent.get(name);
    }

    return type;
  }

  mergeTo(base: GenericTypeMapper) {
    for (const [key, value] of this.genericTypenameTypeMap) {
      base.genericTypenameTypeMap.set(key, value);
    }
  }
}

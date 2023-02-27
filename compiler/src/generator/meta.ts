/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
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

import { Environment } from "../scope";
import { TSType } from "../ts/type";
import { LLVMValue } from "../llvm/value";
import { Declaration } from "../ts/declaration";
import { LLVMGenerator } from "./generator";

class ClosureParametersMetaStorage {
  readonly storage = new Map<string, Map<string, Declaration>>();
}

class FunctionExpressionEnvStorage {
  readonly storage = new Map<string, Environment>();
}

class ClassDeclarationTypeMapperStorage {
  readonly storage = new Map<ts.Declaration, GenericTypeMapper>();
}

class FixedArgsCountStorage {
  readonly storage = new Map<number, number>();
}

class SuperCallTracker {
  value = false;
}

export class MetaInfoStorage {
  private readonly closureParametersMeta = new ClosureParametersMetaStorage();
  private readonly functionExpressionEnv = new FunctionExpressionEnvStorage();
  private readonly superCallTracker = new SuperCallTracker();
  private readonly classDeclarationTypeMapper = new ClassDeclarationTypeMapperStorage();
  private readonly fixedArgs = new FixedArgsCountStorage();
  private currentClassDeclaration: Declaration | undefined;

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

  registerFixedArgsCount(closure: LLVMValue, count: number) {
    this.fixedArgs.storage.set(closure.address, count);
  }

  getFixedArgsCount(closure: LLVMValue) {
    const count = this.fixedArgs.storage.get(closure.address);
    if (typeof count === "undefined") {
      return 0;
    }
    return count;
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

  enterSuperCall() {
    this.superCallTracker.value = true;
  }

  exitSuperCall() {
    this.superCallTracker.value = false;
  }

  inSuperCall() {
    return this.superCallTracker.value;
  }

  setCurrentClassDeclaration(declaration: Declaration) {
    this.currentClassDeclaration = declaration;
  }

  resetCurrentClassDeclaration() {
    this.currentClassDeclaration = undefined;
  }

  getCurrentClassDeclaration() {
    return this.currentClassDeclaration;
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

  static tryGetMapperForGenericClassMethod(expression: ts.Expression, generator: LLVMGenerator) {
    let parentFunction = expression.parent;

    while (parentFunction && !ts.isFunctionLike(parentFunction)) {
      parentFunction = parentFunction.parent;
    }

    if (!parentFunction) {
      return;
    }

    const parentFunctionDeclaration = Declaration.create(parentFunction, generator);
    if (!parentFunctionDeclaration.isMethod()) {
      return;
    }

    const parentClass = parentFunctionDeclaration.parent;
    if (!ts.isClassDeclaration(parentClass)) {
      throw new Error(
        `Generic-typed parameters/return type allowed only for class methods. Error at: '${expression.getText()}'`
      );
    }

    const parentClassDeclaration = Declaration.create(parentClass, generator);
    if (!parentClassDeclaration.typeParameters) {
      return;
    }

    return generator.meta.getClassTypeMapper(parentClassDeclaration);
  }
}

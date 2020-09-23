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

import { error, getAliasedSymbolIfNecessary, getEnvironmentType, getStructType, InternalNames } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { LLVMGenerator } from "@generator";
import { TypeMangler } from "@mangling";

export class Environment {
  varNames: string[];
  rawData: llvm.Value[];

  data: llvm.ConstantStruct;
  allocated: llvm.Value;

  parent: Environment | undefined;

  constructor(
    varNames: string[],
    data: llvm.ConstantStruct,
    rawData: llvm.Value[],
    allocated: llvm.Value,
    parent?: Environment
  ) {
    this.varNames = varNames;
    this.rawData = rawData;
    this.data = data;
    this.allocated = allocated;
    this.parent = parent;
  }
}

export function injectUndefined(scope: Scope, context: llvm.LLVMContext) {
  const declarationLLVMType = llvm.Type.getInt8Ty(context);
  const undef = llvm.UndefValue.get(declarationLLVMType);
  scope.set("undefined", undef as llvm.Value);
}

export function setLLVMFunctionScope(fn: llvm.Function, scope: Scope) {
  llvm.verifyFunction(fn);

  // Function declaration may be in scope with same name.
  // @todo: overwrite?
  if (!scope.get(fn.name)) {
    scope.set(fn.name, fn);
  }
}

export function addClassScope(
  expression: ts.Expression | ts.Declaration,
  parentScope: Scope,
  generator: LLVMGenerator
): void {
  const thisType = generator.checker.getTypeAtLocation(expression) as ts.ObjectType;
  const declaration = getAliasedSymbolIfNecessary(thisType.symbol, generator.checker)
    .valueDeclaration as ts.ClassDeclaration;
  const mangledTypename: string = TypeMangler.mangle(thisType, generator.checker, declaration);

  if (parentScope.get(mangledTypename)) {
    return;
  }

  const type = getStructType(thisType, declaration, generator).getPointerTo();
  const scope = new Scope(mangledTypename, undefined, { declaration, type });
  parentScope.set(mangledTypename, scope);
  for (const method of declaration.members.filter((member) => !ts.isPropertyDeclaration(member))) {
    generator.handleNode(method, scope);
  }
}

export class HeapVariableDeclaration {
  allocated: llvm.Value;
  initializer: llvm.Value;
  name: string;
  declaration: ts.VariableDeclaration | undefined;

  constructor(allocated: llvm.Value, initializer: llvm.Value, name: string, declaration?: ts.VariableDeclaration) {
    this.allocated = allocated;
    this.initializer = initializer;
    this.name = name;
    this.declaration = declaration;
  }
}

export function createEnvironment(
  scope: Scope,
  environmentVariables: string[],
  generator: LLVMGenerator,
  functionData?: { args: llvm.Value[]; signature: ts.Signature },
  outerEnv?: Environment
) {
  const map = new Map<string, { type: llvm.Type; allocated: llvm.Value }>();

  if (functionData) {
    const argsTypes = functionData.args.map((arg) => {
      if (!arg.type.isPointerTy()) {
        error(`Argument expected to be of PointerType, got '${arg.type.toString()}'`);
      }
      return arg.type;
    });

    functionData.signature.getParameters().forEach((parameter, index) => {
      if (!argsTypes[index]) {
        // ignore optional parameters that were not provided
        return;
      }

      const allocated = functionData.args[index];
      map.set(parameter.escapedName.toString(), { type: argsTypes[index], allocated });
    });
  }

  const context = populateContext(generator, scope, environmentVariables);
  context.forEach((value) => {
    if (value.name === InternalNames.Environment) {
      return;
    }

    if (!map.has(value.name)) {
      map.set(value.name, { type: value.allocated.type, allocated: value.allocated });
    }
  });

  if (outerEnv) {
    const data = (scope.get(InternalNames.Environment) as llvm.Value) || outerEnv.data;

    if (data) {
      const envElementType = data.type.isPointerTy()
        ? ((data.type as llvm.PointerType).elementType as llvm.StructType)
        : (data.type as llvm.StructType);
      const types: llvm.Type[] = [];
      for (let i = 0; i < envElementType.numElements; ++i) {
        const elementType = envElementType.getElementType(i);
        if (!elementType.isPointerTy()) {
          error(`Outer environment element expected to be of PointerType, got '${elementType.toString()}'`);
        }
        types.push(envElementType.getElementType(i));
      }

      const outerValues: llvm.Value[] = [];
      for (let i = 0; i < envElementType.numElements; ++i) {
        const extracted = data.type.isPointerTy()
          ? generator.builder.createLoad(
              generator.builder.createInBoundsGEP(data, [
                llvm.ConstantInt.get(generator.context, 0),
                llvm.ConstantInt.get(generator.context, i),
              ])
            )
          : generator.xbuilder.createSafeExtractValue(data, [i]);
        outerValues.push(extracted);
      }

      outerEnv.varNames
        .filter((name) => name !== InternalNames.Environment)
        .forEach((value, index) => {
          map.set(value, { type: types[index], allocated: outerValues[index] });
        });
    }
  }

  const names = Array.from(map.keys());
  const types = Array.from(map.values()).map((value) => value.type);
  const allocations = Array.from(map.values()).map((value) => value.allocated);

  const environmentDataType = getEnvironmentType(types, generator);
  const environmentData = allocations.reduce(
    (acc, allocation, idx) => generator.xbuilder.createSafeInsert(acc, allocation, [idx]),
    llvm.Constant.getNullValue(environmentDataType)
  ) as llvm.Constant;

  const environmentAlloca = generator.gc.allocate(environmentDataType);
  generator.xbuilder.createSafeStore(environmentData, environmentAlloca);

  return new Environment(names, environmentData, allocations, environmentAlloca, outerEnv);
}

export function populateContext(generator: LLVMGenerator, scope: Scope, environmentVariables: string[]) {
  const context: HeapVariableDeclaration[] = [];

  scope.map.forEach((scopeVal, key) => {
    if (scopeVal instanceof Scope) {
      // prevent potentially endless recursion
      scope.map.delete(key);
      context.push(...populateContext(generator, scopeVal, environmentVariables));
      return;
    }

    if (environmentVariables.indexOf(key) === -1 && key !== InternalNames.Environment) {
      return;
    }

    if (scopeVal instanceof HeapVariableDeclaration) {
      scopeVal.name = key;
      context.push(scopeVal);
    } else if (scopeVal instanceof llvm.Value) {
      context.push(new HeapVariableDeclaration(scopeVal, scopeVal, key));
    }
  });

  if (scope.parent) {
    context.push(...populateContext(generator, scope.parent, environmentVariables));
  }

  return context;
}

export type FunctionDeclarationScopeEnvironment = {
  declaration: ts.FunctionDeclaration;
  scope: Scope;
  env?: Environment;
};

export type ScopeValue = llvm.Value | HeapVariableDeclaration | Scope | ts.Type | FunctionDeclarationScopeEnvironment;

export function isFunctionDeclarationScopeEnvironment(value: ScopeValue) {
  return "declaration" in value && "scope" in value && "env" in value;
}

export interface ThisData {
  readonly declaration: ts.ClassDeclaration | ts.InterfaceDeclaration | undefined;
  readonly type: llvm.StructType | llvm.PointerType;
}

export class Scope {
  map: Map<string, ScopeValue>;

  readonly name: string | undefined;
  readonly thisData: ThisData | undefined;
  readonly parent: Scope | undefined;

  constructor(name: string | undefined, parent?: Scope, data?: ThisData) {
    this.map = new Map<string, ScopeValue>();
    this.name = name;
    this.parent = parent;
    this.thisData = data;
  }

  get(identifier: string): ScopeValue | undefined {
    return this.map.get(identifier);
  }

  tryGetThroughParentChain(identifier: string, ignoreTopLevel?: boolean): ScopeValue | undefined {
    const value = this.map.get(identifier);

    if (value) {
      return value;
    } else if (!value && this.parent && (this.parent.name === InternalNames.FunctionScope || !ignoreTopLevel)) {
      return this.parent.tryGetThroughParentChain(identifier, ignoreTopLevel);
    }

    return;
  }

  set(identifier: string, value: ScopeValue) {
    if (!this.map.get(identifier)) {
      return this.map.set(identifier, value);
    }

    error(`Identifier '${identifier}' already exists. Use 'Scope.overwrite' instead of 'Scope.set'`);
  }

  overwrite(identifier: string, value: ScopeValue) {
    if (this.map.get(identifier)) {
      return this.map.set(identifier, value);
    }

    error(`Identifier '${identifier}' being overwritten not found in symbol table`);
  }
}

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

import * as ts from "typescript";
import { GenericTypeMapper, LLVMGenerator } from "../generator";

import { TSType } from "../ts/type";
import { flatten } from "lodash";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMConstant, LLVMValue } from "../llvm/value";
import { Declaration } from "../ts/declaration";
import { Signature } from "../ts/signature";
import { LLVMFunction } from "../llvm/function";
import { GC } from "../tsbuiltins/gc";

export class Environment {
  private readonly pVariables: string[];
  private pAllocated: LLVMValue;
  private readonly pLLVMType: LLVMStructType;
  private readonly pGenerator: LLVMGenerator;
  private pFixedArgsCount: number = 0;

  constructor(variables: string[], allocated: LLVMValue, llvmType: LLVMStructType, generator: LLVMGenerator) {
    if (!allocated.type.isPointer() || !allocated.type.getPointerElementType().isIntegerType(8)) {
      throw new Error(`Expected allocated environment to be of i8*, got '${allocated.type.toString()}'`);
    }

    this.pVariables = variables;
    this.pAllocated = allocated;
    this.pLLVMType = llvmType;
    this.pGenerator = generator;
  }

  get untyped() {
    return this.pAllocated;
  }

  set untyped(allocated: LLVMValue) {
    if (!allocated.type.isPointer() || !allocated.type.getPointerElementType().isIntegerType(8)) {
      throw new Error(`Expected allocated environment to be of i8*, got '${allocated.type.toString()}'`);
    }

    this.pAllocated = allocated;
  }

  get voidStar() {
    return LLVMType.getInt8Type(this.pGenerator).getPointer();
  }

  get typed() {
    return this.pGenerator.builder.createBitCast(this.pAllocated, this.pLLVMType.getPointer());
  }

  get type() {
    return this.pLLVMType;
  }

  get variables() {
    return this.pVariables;
  }

  getVariableIndex(variable: string) {
    return this.pVariables.indexOf(variable);
  }

  get fixedArgsCount() {
    return this.pFixedArgsCount;
  }

  set fixedArgsCount(count: number) {
    this.pFixedArgsCount = count;
  }

  static merge(base: Environment, envs: Environment[], generator: LLVMGenerator) {
    const baseValues = [];

    const envValue = generator.builder.createLoad(base.typed);
    for (let i = 0; i < base.type.numElements; ++i) {
      const value = generator.builder.createSafeExtractValue(envValue, [i]);
      baseValues.push(value);
    }

    const values = flatten(
      envs.map((e) => {
        const envValues = [];

        const structValue = generator.builder.createLoad(e.typed);
        for (let i = 0; i < e.type.numElements; ++i) {
          const value = generator.builder.createSafeExtractValue(structValue, [i]);
          envValues.push(value);
        }

        return envValues;
      })
    );

    const names = flatten(envs.map((e) => e.variables));

    const allVariables = base.variables.concat(names);
    const uniqueIndexes = allVariables.reduce((acc, variable, index) => {
      if (allVariables.indexOf(variable) === index) {
        acc.push(index);
      }
      return acc;
    }, new Array<number>());
    const mergedVariableNames = uniqueIndexes.reduce((acc, index) => {
      acc.push(allVariables[index]);
      return acc;
    }, new Array<string>());

    const mergedValues = baseValues.concat(values).filter((_, index) => uniqueIndexes.includes(index));
    const mergedEnvironmentType = LLVMStructType.get(
      generator,
      mergedValues.map((v) => v.type)
    );
    const allocatedMergedEnvironment = generator.gc.allocate(mergedEnvironmentType);

    for (let i = 0; i < mergedValues.length; ++i) {
      const elementPtr = generator.builder.createSafeInBoundsGEP(allocatedMergedEnvironment, [0, i]);
      generator.builder.createSafeStore(mergedValues[i], elementPtr);
    }

    return new Environment(
      mergedVariableNames,
      generator.builder.asVoidStar(allocatedMergedEnvironment),
      mergedEnvironmentType,
      generator
    );
  }

  static getEnvironmentType(types: LLVMType[], generator: LLVMGenerator) {
    if (types.some((type) => !type.isPointer())) {
      throw new Error(
        `Expected all the types to be of PointerType, got:\n${types.map((type) => "  " + type.toString()).join(",\n")}`
      );
    }

    const environmentName =
      "env__(" +
      types.reduce((acc, curr) => {
        return acc + "_" + curr.toString().replace(/\"/g, "");
      }, "") +
      ")";

    const existingType = generator.module.getTypeByName(environmentName);

    if (existingType) {
      return LLVMType.make(existingType, generator) as LLVMStructType;
    }

    const envType = LLVMStructType.create(generator, environmentName);
    envType.setBody(types);

    return envType;
  }
}

export function setLLVMFunctionScope(
  fn: LLVMValue,
  scope: Scope,
  generator: LLVMGenerator,
  source: ts.Expression | Declaration
) {
  LLVMFunction.verify(fn, source);

  // Function declaration may be in scope with same name.
  // @todo: overwrite?
  if (!scope.get(fn.unwrapped.name)) {
    scope.set(fn.unwrapped.name, LLVMValue.create(fn.unwrapped, generator));
  }
}

export function addClassScope(
  expression: ts.Expression | ts.Declaration,
  parentScope: Scope,
  generator: LLVMGenerator
): void {
  let thisType: TSType;
  if (ts.isArrayLiteralExpression(expression)) {
    thisType = generator.ts.array.getType(expression);
  } else if (
    ts.isVariableDeclaration(expression) &&
    expression.initializer &&
    ts.isArrayLiteralExpression(expression.initializer)
  ) {
    thisType = generator.ts.array.getType(expression.initializer);
  } else {
    thisType = generator.ts.checker.getTypeAtLocation(expression).getApparentType();
  }

  if (thisType.isSymbolless()) {
    return;
  }

  const declaration = thisType.getSymbol().declarations.find((decl) => decl.isClass());

  if (!declaration) {
    return;
  }

  const llvmType = generator.symbolTable.withLocalScope((scope) => {
    if (declaration.typeParameters) {
      const declaredTypes = declaration.typeParameters.map((parameter) =>
        generator.ts.checker.getTypeAtLocation(parameter).toString()
      );
      const actualTypes = thisType.getTypeGenericArguments();

      declaredTypes.forEach((typename, index) => {
        scope.typeMapper.register(typename, actualTypes[index]);
      });

      generator.meta.registerClassTypeMapper(declaration, scope.typeMapper);
    }

    return thisType.getLLVMType();
  }, generator.symbolTable.currentScope);

  if (!llvmType.isPointer()) {
    throw new Error("Expected pointer");
  }

  let mangledTypename = thisType.mangle();
  const declarationNamespace = declaration.getNamespace();
  mangledTypename = declarationNamespace.concat(mangledTypename).join(".");

  const name = declaration.name!.getText();
  if (parentScope.get(mangledTypename)) {
    return;
  }

  const tsType = generator.ts.checker.getTypeAtLocation(declaration.unwrapped);
  const scope = new Scope(name, mangledTypename, generator, false, parentScope, { declaration, llvmType, tsType });

  parentScope.set(mangledTypename, scope);
}

export class HeapVariableDeclaration {
  allocated: LLVMValue;
  initializer: LLVMValue;
  name: string;
  declaration: ts.VariableDeclaration | undefined;

  constructor(allocated: LLVMValue, initializer: LLVMValue, name: string, declaration?: ts.VariableDeclaration) {
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
  functionData?: { args: LLVMValue[]; signature: Signature | undefined },
  outerEnv?: Environment,
  preferLocalThis?: boolean
) {
  const map = new Map<string, { type: LLVMType; allocated: LLVMValue }>();

  if (functionData?.signature) {
    const argsTypes = functionData.args.map((arg, index) => {
      if (!arg.type.isPointer()) {
        throw new Error(
          `Argument at index ${index} expected to be of PointerType, got '${arg.type.toString()}' (signature: ${functionData.signature!.toString()}))`
        );
      }
      return arg.type;
    });

    const parameters = functionData.signature.getParameters();

    argsTypes.forEach((argType, index) => {
      if (!parameters[index]) {
        // ignore optional parameters that were not provided
        return;
      }

      let parameterName = parameters[index].escapedName.toString();
      // Note about 'escapedText' from tsc: Text of identifier, but if the identifier begins with two underscores, this will begin with three;
      // Cut leading underscore
      if (parameterName.startsWith("___")) {
        parameterName = parameterName.substring(1);
      }

      const allocated = functionData.args[index];
      map.set(parameterName, { type: argType, allocated });
    });
  }

  const context = populateContext(generator, scope, environmentVariables);

  context.forEach((value) => {
    if (!map.has(value.name)) {
      map.set(value.name, { type: value.allocated.type, allocated: value.allocated });
    }
  });

  if (outerEnv) {
    const data = generator.builder.createLoad(outerEnv.typed);

    const parameters = functionData?.signature?.getParameters().map((parameter) => parameter.escapedName.toString());
    const outerEnvValuesIndexes = [];
    for (let i = 0; i < outerEnv.variables.length; ++i) {
      const variableName = outerEnv.variables[i];

      if (!environmentVariables.includes(variableName)) {
        continue;
      }

      if (parameters?.includes(variableName)) {
        continue;
      }

      if (variableName === generator.internalNames.This && typeof preferLocalThis !== "undefined" && preferLocalThis) {
        continue;
      }

      outerEnvValuesIndexes.push(i);
    }

    const outerValues: LLVMValue[] = [];
    for (const index of outerEnvValuesIndexes) {
      const extracted = generator.builder.createSafeExtractValue(data, [index]);
      outerValues.push(extracted);
    }

    for (let i = 0; i < outerEnvValuesIndexes.length; ++i) {
      const value = outerValues[i];
      map.set(outerEnv.variables[outerEnvValuesIndexes[i]], { type: value.type, allocated: value });
    }
  }

  const names = Array.from(map.keys());
  const types = Array.from(map.values()).map((value) => value.type);

  const allocations = Array.from(map.values()).map((value) => value.allocated);

  const environmentDataType = Environment.getEnvironmentType(types, generator);
  const environmentData = allocations.reduce(
    (acc, allocation, idx) => generator.builder.createSafeInsert(acc, allocation, [idx]),
    LLVMConstant.createNullValue(environmentDataType, generator)
  );

  const environmentAlloca = generator.gc.allocate(environmentDataType);
  generator.builder.createSafeStore(environmentData, environmentAlloca);

  const env = new Environment(names, generator.builder.asVoidStar(environmentAlloca), environmentDataType, generator);

  return env;
}

function populateStaticContext(scope: Scope, environmentVariables: string[]) {
  const staticContext: HeapVariableDeclaration[] = [];

  scope.thisData?.staticProperties?.forEach((value, key) => {
    const idx = environmentVariables.findIndex((variable) => {
      if (variable === key) {
        return true;
      }

      const [identifier, property] = variable.split(".");
      return (identifier === scope.name || identifier === scope.mangledName) && property === key;
    });

    if (idx === -1) {
      return;
    }

    if (value instanceof HeapVariableDeclaration) {
      value.name = environmentVariables[idx];
      staticContext.push(value);
    } else if (value instanceof LLVMValue) {
      staticContext.push(new HeapVariableDeclaration(value, value, environmentVariables[idx]));
    }
  });

  return staticContext;
}

export function populateContext(
  generator: LLVMGenerator,
  root: Scope,
  environmentVariables: string[],
  seenScopes: Scope[] = []
) {
  const context: HeapVariableDeclaration[] = [];

  const addToContextRecursively = (value: ScopeValue, key: string, variables: string[]) => {
    if (key === "undefined") {
      return;
    }

    const index = variables.findIndex((variable) => {
      if (variable === key || (key.startsWith(variable + "__class") && value instanceof Scope)) {
        return true;
      }

      if (value instanceof Scope && variable.includes(".")) {
        const [identifier, property] = variable.split(".");
        return value.name === identifier && (value.get(property) || value.getStatic(property));
      }

      return false;
    });

    if (value instanceof Scope && !seenScopes.includes(value) && !value.isNamespace) {
      seenScopes.push(value);
      value.map.forEach((v, k) => {
        addToContextRecursively(v, k, variables);
      });

      context.push(...populateStaticContext(value, variables));

      if (value.parent && !seenScopes.includes(value.parent)) {
        context.push(...populateContext(generator, value.parent, variables, seenScopes));
      }
    }

    if (index === -1) {
      return;
    }

    if (value instanceof HeapVariableDeclaration) {
      context.push(value);
    } else if (value instanceof LLVMValue) {
      context.push(new HeapVariableDeclaration(value, value, key));
    }
  };

  context.push(...populateStaticContext(root, environmentVariables));
  root.map.forEach((value, key) => addToContextRecursively(value, key, environmentVariables));

  const isPropertyAccess = (value: string) => value.includes(".");
  const propertyAccesses = environmentVariables.filter(isPropertyAccess).reduce((acc, value) => {
    const parts = value.split(".");
    acc.push(parts);
    return acc;
  }, new Array<string[]>());

  const findPropertyAccess = (
    scope: Scope,
    values: string[],
    seen: Scope[] = []
  ): LLVMValue | HeapVariableDeclaration | Scope | undefined => {
    if (values.length === 0) {
      return;
    }

    if (values.length === 1) {
      return scope.get(values[0]);
    }

    if (values.length > 1) {
      if (scope.name === values[0]) {
        seen.push(scope);
        values.shift();
        return findPropertyAccess(scope, values, seen);
      }

      for (const [name, value] of scope.map) {
        if (value instanceof Scope && !seen.includes(value)) {
          seen.push(value);

          let previousHead: string | undefined;

          if (name === values[0]) {
            previousHead = values.shift();
          }

          const maybeFound = findPropertyAccess(value, values, seen);
          if (!maybeFound && previousHead) {
            values.unshift(previousHead);
            continue;
          }

          if (maybeFound) {
            return maybeFound;
          }
        }
      }
    }

    return undefined;
  };

  propertyAccesses.forEach((values) => {
    const key = values.join(".");
    const value = findPropertyAccess(root, values);

    if (value instanceof HeapVariableDeclaration && !context.includes(value)) {
      value.name = key;
      context.push(value);
    } else if (value instanceof LLVMValue) {
      context.push(new HeapVariableDeclaration(value, value, key));
    }
  });

  if (root.parent && !seenScopes.includes(root.parent)) {
    seenScopes.push(root.parent);
    context.push(...populateContext(generator, root.parent, environmentVariables, seenScopes));
  }

  return context;
}

export type ScopeValue = LLVMValue | HeapVariableDeclaration | Scope;

export interface ThisData {
  readonly declaration: Declaration | undefined;
  readonly llvmType: LLVMType;
  readonly tsType: TSType;
  readonly staticProperties?: Map<string, LLVMValue>;
}

export class Scope {
  map: Map<string, ScopeValue>;
  private localVariables: Set<LLVMValue>;

  readonly name: string | undefined;
  readonly mangledName: string | undefined;
  readonly thisData: ThisData | undefined;
  readonly parent: Scope | undefined;
  typeMapper: GenericTypeMapper;

  readonly isNamespace: boolean;

  private generator: LLVMGenerator;

  constructor(name: string | undefined, 
              mangledName: string | undefined, 
              generator : LLVMGenerator,
              isNamespace: boolean = false, 
              parent?: Scope, 
              data?: ThisData) {
    this.generator = generator;
    this.map = new Map<string, ScopeValue>();
    this.name = name;
    this.mangledName = mangledName;
    this.parent = parent;
    this.thisData = data;
    this.localVariables = new Set<LLVMValue>();

    this.typeMapper = new GenericTypeMapper();
    if (parent && parent.typeMapper) {
      this.typeMapper.setParent(parent.typeMapper);
    }

    this.isNamespace = isNamespace;
  }

  private addRoot(value: ScopeValue) {
    if (value instanceof LLVMValue) {
      const v = value as LLVMValue;
      this.generator.gc.addRoot(v);
    }
    else if (value instanceof HeapVariableDeclaration) {
      const heapValue = value as HeapVariableDeclaration;
      this.generator.gc.addRoot(heapValue.allocated);
    }
  }

  private removeRoot(value: ScopeValue) {
    if (value instanceof LLVMValue) {
      const v = value as LLVMValue;
      this.generator.gc.removeRoot(v);
    }
    else if (value instanceof HeapVariableDeclaration) {
      const heapValue = value as HeapVariableDeclaration;
      this.generator.gc.removeRoot(heapValue.allocated);
    }
  }

  private removeLocalRoots() {
    for (const localVar of this.localVariables) {
      this.removeRoot(localVar);
    }
  }

  deinitialize() {
    this.removeLocalRoots();
  }

  initializeVariablesAndFunctionDeclarations(root: ts.Node, generator: LLVMGenerator) {
    const initializeFrom = (node: ts.Node) => {
      // ignore nested blocks and modules/namespaces
      if (ts.isBlock(node) || ts.isModuleBlock(node)) {
        return;
      }

      // ignore destructuring assignment since no scope values actually creating for them
      if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name)) {
        return;
      }

      // ignore counters
      if (ts.isVariableDeclarationList(node) && ts.isIterationStatement(node.parent, false)) {
        return;
      }

      node.forEachChild(initializeFrom);

      // only interested in variables and functions declarations
      if (!ts.isVariableDeclaration(node) && !ts.isFunctionDeclaration(node)) {
        return;
      }

      if (!node.name) {
        return;
      }

      const tsType = generator.ts.checker.getTypeAtLocation(node);
      if (!tsType.isSupported()) {
        // mkrv @todo resolve generic type
        return;
      }

      const llvmType = tsType.getLLVMType();
      const allocated = generator.gc.allocateObject(llvmType.getPointerElementType());
      // Inplace allocated is same as allocated for now
      const inplaceAllocated = generator.ts.obj.createInplace(allocated, undefined);
      this.addLocalVariable(allocated);

      const name = node.name.getText();

      if (this.get(name)) {
        this.overwrite(name, inplaceAllocated);
      } else {
        this.set(name, inplaceAllocated);
      }
    }

    root.forEachChild(initializeFrom);
  }

  // Shit code, should be private.
  // It is used to add cloned initializers into local variables to remove roots after all
  addLocalVariable(variable: ScopeValue) {
    if (variable instanceof LLVMValue) {
      const v = variable as LLVMValue;
      this.localVariables.add(v);
    }
    else if (variable instanceof HeapVariableDeclaration) {
      const heapValue = variable as HeapVariableDeclaration;
      this.localVariables.add(heapValue.allocated);
    }
  }

  get(identifier: string): ScopeValue | undefined {
    let result: ScopeValue | undefined;

    result = this.map.get(identifier);

    if (!result) {
      for (const [_, value] of this.map) {
        if (value instanceof Scope) {
          if (value.mangledName === identifier) {
            result = value;
            break;
          }
        }
      }
    }

    return result;
  }

  getStatic(identifier: string) {
    return this.thisData?.staticProperties?.get(identifier);
  }

  names(): string[] {
    const result: string[] = [];
    for (const it of this.map) {
      result.push(it[0]);
    }

    if (this.thisData?.staticProperties) {
      for (const [name] of this.thisData.staticProperties) {
        result.push(name);
      }
    }

    return result;
  }

  tryGetThroughParentChain(identifier: string): ScopeValue | undefined {
    const value = this.map.get(identifier);

    if (value) {
      return value;
    } else if (!value && this.parent) {
      return this.parent.tryGetThroughParentChain(identifier);
    }

    return;
  }

  set(identifier: string, value: ScopeValue) {
    if (!this.get(identifier)) {
      this.addRoot(value); 
      return this.map.set(identifier, value);
    }

    throw new Error(`Identifier '${identifier}' already exists. Use 'Scope.overwrite' instead of 'Scope.set'`);
  }

  overwrite(identifier: string, newValue: ScopeValue) {
    const oldValue = this.get(identifier);
    if (oldValue) {
      this.removeRoot(oldValue);
      this.addRoot(newValue);
      return this.map.set(identifier, newValue);
    }

    throw new Error(`Identifier '${identifier}' being overwritten not found in symbol table`);
  }

  overwriteThroughParentChain(identifier: string, newValue: ScopeValue) {
    const oldValue = this.get(identifier);
    if (oldValue) {
      this.removeRoot(oldValue);
      this.addRoot(newValue);
      this.map.set(identifier, newValue);

      return;
    } else if (this.parent) {
      this.parent.overwriteThroughParentChain(identifier, newValue);
      return;
    }

    throw new Error(`Identifier '${identifier}' being overwritten not found in symbol table`);
  }

  remove(identifier: string) {
    const scopedValue = this.get(identifier);
    if (scopedValue) {
      this.removeRoot(scopedValue);
    }
    this.map.delete(identifier);
  }

  withThisKeeping<R>(action: () => R): R {
    const originalThis = this.get("this");

    const result = action();
    this.remove("this");

    if (!originalThis) {
      return result;
    }

    if (!(originalThis instanceof LLVMValue)) {
      return result;
    }

    const isFakeThis = originalThis.type.isIntegerType(1);
    if (isFakeThis) {
      return result;
    }

    this.set("this", originalThis);

    return result;
  }

  dump(pad = 0, seen: Scope[] = []) {
    console.log("--".repeat(pad), this.name, this.mangledName);

    for (const [key, value] of this.map) {
      if (!(value instanceof Scope)) {
        console.log("--".repeat(pad + 1), key, value instanceof LLVMValue ? "(llvm value)" : "(heap variable)");
      } else if (!seen.includes(value)) {
        seen.push(value);
        value.dump(pad + 1, seen);
      }
    }

    if (this.parent && !seen.includes(this.parent)) {
      this.parent.dump(++pad, seen);
    }
  }
}

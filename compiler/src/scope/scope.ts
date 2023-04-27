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

import * as ts from "typescript";
import { GenericTypeMapper, LLVMGenerator } from "../generator";

import { TSType } from "../ts/type";
import { flatten } from "lodash";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { LLVMConstant, LLVMValue } from "../llvm/value";
import { Declaration } from "../ts/declaration";
import { Signature } from "../ts/signature";
import { LLVMFunction } from "../llvm/function";

export class Environment {
  private readonly pVariables: string[];
  private readonly pParameterNames: string[];
  private pAllocated: LLVMValue;
  private readonly pLLVMType: LLVMStructType;
  private readonly pGenerator: LLVMGenerator;
  private pFixedArgsCount: number = 0;

  constructor(variables: string[], parameterNames: string[], allocated: LLVMValue, llvmType: LLVMStructType, generator: LLVMGenerator) {
    if (!allocated.type.isPointer() || !allocated.type.getPointerElementType().isIntegerType(8)) {
      throw new Error(`Expected allocated environment to be of i8*, got '${allocated.type.toString()}'`);
    }

    this.pVariables = variables;
    this.pParameterNames = parameterNames;
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

  get parameterNames() {
    return this.pParameterNames;
  }

  isParameter(name: string): boolean {
    return this.pParameterNames.includes(name);
  }

  isParameterIndex(index: number): boolean {
    return this.isParameter(this.pVariables[index]);
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

    const mergedParameterNames: string[] = [];

    envs.forEach((e) => {
      mergedParameterNames.push(...e.pParameterNames)
    })

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
      mergedParameterNames,
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
    const makeRoot = false;
    scope.set(fn.unwrapped.name, LLVMValue.create(fn.unwrapped, generator), makeRoot);
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

  const parameterNames = functionData?.signature?.getParameters().map((param) => param.escapedName.toString()) || [];

  if (functionData?.signature) {
    const argsTypes = functionData.args.map((arg, index) => {
      if (arg.type.getPointerLevel() > 2) {
        throw new Error(
          `Argument at index ${index} expected to be of PointerType **, got '${arg.type.toString()}' (signature: ${functionData.signature!.toString()}))`
        );
      }

      return arg.type;
    });

    argsTypes.forEach((argType, index) => {
      if (!parameterNames[index]) {
        // ignore optional parameters that were not provided
        return;
      }

      let parameterName = parameterNames[index];
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

    const outerEnvValuesIndexes = [];
    for (let i = 0; i < outerEnv.variables.length; ++i) {
      const variableName = outerEnv.variables[i];

      if (!environmentVariables.includes(variableName)) {
        continue;
      }

      if (parameterNames?.includes(variableName)) {
        continue;
      }

      if (variableName === generator.internalNames.This && typeof preferLocalThis !== "undefined" && preferLocalThis) {
        continue;
      }

      outerEnvValuesIndexes.push(i);
    }

    const outerValues: LLVMValue[] = [];
    for (const index of outerEnvValuesIndexes) {
      let extracted = generator.builder.createSafeExtractValue(data, [index]);

      // @todo: remove pointer level check
      if (extracted.type.getPointerLevel() === 2 && outerEnv.isParameterIndex(index)) {
        extracted = generator.builder.createLoad(extracted);
        const mem = generator.gc.allocate(extracted.type);
        generator.builder.createSafeStore(extracted, mem);
        extracted = mem;
      }

      outerValues.push(extracted);
    }

    for (let i = 0; i < outerEnvValuesIndexes.length; ++i) {
      const value = outerValues[i];
      map.set(outerEnv.variables[outerEnvValuesIndexes[i]], { type: value.type, allocated: value });
    }
  }

  const names = Array.from(map.keys());
  const types = Array.from(map.values()).map((value) => {
    if (value.type.getPointerLevel() === 1) {
      return value.type.getPointer();
    }
    return value.type;
  });

  let allocations = [];
  for (const [_, value] of map) {
    let allocationPtrPtr = value.allocated;
    if (allocationPtrPtr.type.getPointerLevel() === 1) {
      allocationPtrPtr = generator.gc.allocate(value.allocated.type);
      generator.builder.createSafeStore(value.allocated, allocationPtrPtr);
    }

    allocations.push(allocationPtrPtr);
  }

  const environmentDataType = Environment.getEnvironmentType(types, generator);
  const environmentData = allocations.reduce(
    (acc, allocation, idx) => generator.builder.createSafeInsert(acc, allocation, [idx]),
    LLVMConstant.createNullValue(environmentDataType, generator)
  );

  const environmentAlloca = generator.gc.allocate(environmentDataType);
  generator.builder.createSafeStore(environmentData, environmentAlloca);

  return new Environment(names, parameterNames, generator.builder.asVoidStar(environmentAlloca), environmentDataType, generator);
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

  readonly name: string | undefined;
  readonly mangledName: string | undefined;
  readonly thisData: ThisData | undefined;
  readonly parent: Scope | undefined;
  typeMapper: GenericTypeMapper;

  readonly isNamespace: boolean;

  private generator: LLVMGenerator;
  private isHoisted = false;
  private isDeinitialized = false;

  constructor(name: string | undefined,
    mangledName: string | undefined,
    generator: LLVMGenerator,
    isNamespace: boolean = false,
    parent?: Scope,
    data?: ThisData) {
    this.generator = generator;
    this.map = new Map<string, ScopeValue>();
    this.name = name;
    this.mangledName = mangledName;
    this.parent = parent;
    this.thisData = data;
    this.isHoisted = false;

    this.typeMapper = new GenericTypeMapper();
    if (parent && parent.typeMapper) {
      this.typeMapper.setParent(parent.typeMapper);
    }

    this.isNamespace = isNamespace;
  }

  isAmbientSourceFile() {
    return this.name?.endsWith(".d.ts");
  }

  deinitialize() {
    if (this.isDeinitialized) {
      return;
    }

    for (const identifier of this.map.keys()) {
      const value = this.get(identifier);
      if (!value || value instanceof Scope) {
        continue
      }

      const ptrPtr = value instanceof HeapVariableDeclaration ? value.allocated : value;
      if (ptrPtr.type.getPointerLevel() == 2) {
        this.generator.gc.removeRoot(ptrPtr);
      }
    }

    this.isDeinitialized = true;
  }

  initializeVariablesAndFunctionDeclarations(root: ts.Node, generator: LLVMGenerator) {
    if (this.isHoisted) {
      return;
    }

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
      const inplaceAllocatedPtr = generator.ts.obj.createInplace(allocated);

      const inplaceAllocatedPtrPtr = generator.gc.allocate(inplaceAllocatedPtr.type);
      generator.builder.createSafeStore(inplaceAllocatedPtr, inplaceAllocatedPtrPtr);

      const name = node.name.getText();

      this.set(name, inplaceAllocatedPtrPtr);
    }

    root.forEachChild(initializeFrom);
    this.isHoisted = true;
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

  setOrAssign(identifier: string, valuePtr: ScopeValue, makeRoot: boolean = true) {
    if (this.get(identifier)) {
      this.assign(identifier, valuePtr);
    }
    else {
      this.set(identifier, valuePtr, makeRoot);
    }
  }

  set(identifier: string, value: ScopeValue, makeRoot: boolean = true) {
    if (this.get(identifier)) {
      throw new Error(`Identifier '${identifier}' already exists. Use 'Scope.assign' instead of 'Scope.set'`);
    }

    if (value instanceof Scope) {
      this.map.set(identifier, value);
      return;
    }

    const extractedValue = value instanceof HeapVariableDeclaration ? value.allocated : value;

    if (extractedValue.type.getPointerLevel() === 2) {

      if (makeRoot) {
        this.generator.gc.addRoot(extractedValue, identifier, this.name);
      }

      this.map.set(identifier, extractedValue);
      return;
    }
    else if (extractedValue.type.getPointerLevel() === 1) {
      const vPtrPtr = this.generator.gc.allocate(extractedValue.type);
      this.generator.builder.createSafeStore(extractedValue, vPtrPtr);
  
      this.map.set(identifier, vPtrPtr);

      if (makeRoot) {
        this.generator.gc.addRoot(vPtrPtr, identifier, this.name);
      }
    }
    else {
      this.map.set(identifier, extractedValue);
    }
  }

  replace(identifier: string, newValue: LLVMValue) {
    if (!this.get(identifier)) {
      throw new Error(`Identifier '${identifier}' does not exist.`);
    }

    if (newValue.type.getPointerLevel() !== 2) {
      throw new Error(`newValue of '${identifier}' is not **: ${newValue.type.toString()}`);
    }
    this.map.set(identifier, newValue);
  }

  assign(identifier: string, value: ScopeValue) {
    const valuePtrPtr = this.get(identifier);
    if (!valuePtrPtr) {
      throw new Error(`Identifier '${identifier}' being overwritten not found in symbol table`);
    }

    if (value instanceof Scope) {
      this.map.set(identifier, value);
      return;
    }

    if (!(valuePtrPtr instanceof LLVMValue)) {
      throw new Error(`Identifier '${identifier}' is not LLVMValue(**) inside of a scope`);
    }

    if (valuePtrPtr.type.getPointerLevel() != 2) {
      throw new Error(`Identifier '${identifier}' assignment failed: valuePtrPtr is not **`);
    }

    const actualVal = value instanceof HeapVariableDeclaration ? value.allocated : value;
    if (actualVal.type.getPointerLevel() != 1) {
      throw new Error(`Identifier '${identifier}' assignment failed: or actualVal is not *: ${actualVal.type.toString()}`);
    }

    if (actualVal.type.isClosure()) {
      // New value may be a bound function, have to store its meta
      const fixedArgsCount = this.generator.meta.getFixedArgsCount(actualVal);
      this.generator.meta.registerFixedArgsCount(valuePtrPtr, fixedArgsCount);
    }

    this.generator.builder.createSafeStore(actualVal, valuePtrPtr);
  }

  assignThroughParentChain(identifier: string, value: ScopeValue) {
    if (this.map.get(identifier)) {
      this.assign(identifier, value);
      return;
    } else if (this.parent) {
      this.parent.assignThroughParentChain(identifier, value);
      return;
    }

    throw new Error(`Identifier '${identifier}' being overwritten not found in symbol table`);
  }

  remove(identifier: string) {
    const value = this.get(identifier);
    if (value && !(value instanceof Scope)) {
      const ptrPtr = value instanceof HeapVariableDeclaration ? value.allocated : value;
      this.generator.gc.removeRoot(ptrPtr);
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

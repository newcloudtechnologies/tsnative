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

import {
  error,
  getAliasedSymbolIfNecessary,
  getDeclarationNamespace,
  getEnvironmentType,
  getStructType,
  InternalNames,
  tryResolveGenericTypeIfNecessary,
  unwrapPointerType,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { GenericTypeMapper, LLVMGenerator } from "@generator";
import { TypeMangler } from "@mangling";

import { cloneDeep } from "lodash";
import { getArrayType } from "@handlers";

export class Environment {
  private readonly pVariables: string[];
  private pAllocated: llvm.Value;
  private readonly pLLVMType: llvm.PointerType;
  private readonly pGenerator: LLVMGenerator;

  constructor(variables: string[], allocated: llvm.Value, llvmType: llvm.PointerType, generator: LLVMGenerator) {
    if (!allocated.type.isPointerTy() || !allocated.type.elementType.isIntegerTy(8)) {
      error(`Expected allocated environment to be of i8*, got '${allocated.type.toString()}'`);
    }

    if (!llvmType.elementType.isStructTy()) {
      error(`Expected llvmType to be of llvm.StructType*, got '${llvmType.toString()}'`);
    }

    this.pVariables = variables;
    this.pAllocated = allocated;
    this.pLLVMType = llvmType;
    this.pGenerator = generator;
  }

  get untyped() {
    return this.pAllocated;
  }

  set untyped(allocated: llvm.Value) {
    if (!allocated.type.isPointerTy() || !allocated.type.elementType.isIntegerTy(8)) {
      error(`Expected allocated environment to be of i8*, got '${allocated.type.toString()}'`);
    }

    this.pAllocated = allocated;
  }

  get voidStar() {
    return llvm.Type.getInt8PtrTy(this.pGenerator.context);
  }

  get typed() {
    return this.pGenerator.builder.createBitCast(this.pAllocated, this.pLLVMType);
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
  let thisType;
  if (ts.isArrayLiteralExpression(expression)) {
    thisType = getArrayType(expression, generator);
  } else if (
    ts.isVariableDeclaration(expression) &&
    expression.initializer &&
    ts.isArrayLiteralExpression(expression.initializer)
  ) {
    thisType = getArrayType(expression.initializer, generator);
  } else {
    thisType = tryResolveGenericTypeIfNecessary(
      generator.checker.getApparentType(generator.checker.getTypeAtLocation(expression)),
      generator
    );
  }

  if (!thisType.symbol) {
    return;
  }

  const declaration = getAliasedSymbolIfNecessary(thisType.symbol, generator.checker)
    .valueDeclaration as ts.ClassDeclaration;

  if (!declaration || !declaration.members) {
    return;
  }

  let mangledTypename: string = TypeMangler.mangle(thisType, generator.checker, declaration);
  const namespace: string[] = getDeclarationNamespace(declaration);
  mangledTypename = namespace.concat(mangledTypename).join(".");

  if (parentScope.get(mangledTypename)) {
    return;
  }

  const llvmType = getStructType(thisType, declaration, generator).getPointerTo();
  const tsType = generator.checker.getTypeAtLocation(declaration as ts.Node);
  const scope = new Scope(declaration.name!.getText(), mangledTypename, undefined, { declaration, llvmType, tsType });
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

    const parameters = functionData.signature.getParameters();

    argsTypes.forEach((argType, index) => {
      if (!parameters[index]) {
        // ignore optional parameters that were not provided
        return;
      }

      const allocated = functionData.args[index];
      map.set(parameters[index].escapedName.toString(), { type: argType, allocated });
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
    const data = (scope.get(InternalNames.Environment) as llvm.Value) || outerEnv.typed;

    if (data) {
      const envElementType = unwrapPointerType(data.type) as llvm.StructType;
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
          ? generator.builder.createLoad(generator.xbuilder.createSafeInBoundsGEP(data, [0, i]))
          : generator.xbuilder.createSafeExtractValue(data, [i]);
        outerValues.push(extracted);
      }

      outerEnv.variables
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

  return new Environment(
    names,
    generator.xbuilder.asVoidStar(environmentAlloca),
    environmentAlloca.type as llvm.PointerType,
    generator
  );
}

export function populateContext(generator: LLVMGenerator, scope: Scope, environmentVariables: string[]) {
  const context: HeapVariableDeclaration[] = [];

  // Prevent original scope modification.
  scope = cloneDeep(scope);

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

  if (scope.thisData && scope.thisData.staticProperties) {
    scope.thisData.staticProperties.forEach((scopeVal, key) => {
      const pred = (v: string) => {
        let result = false;

        if (v === key) {
          result = true;
        } else if (v.includes(".")) {
          const parts = v.split(".");

          if (parts[0] === scope.name && parts[1] === key) {
            result = true;
          }
        }

        return result;
      };

      const idx = environmentVariables.findIndex(pred);

      if (idx === -1 && key !== InternalNames.Environment) {
        return;
      }

      if (scopeVal instanceof HeapVariableDeclaration) {
        scopeVal.name = environmentVariables[idx];
        context.push(scopeVal);
      } else if (scopeVal instanceof llvm.Value) {
        context.push(new HeapVariableDeclaration(scopeVal, scopeVal, environmentVariables[idx]));
      }
    });
  }

  if (scope.parent) {
    context.push(...populateContext(generator, scope.parent, environmentVariables));
  }

  return context;
}

export interface FunctionDeclarationScopeEnvironment {
  declaration: ts.FunctionDeclaration;
  scope: Scope;
}

export type ScopeValue = llvm.Value | HeapVariableDeclaration | Scope | FunctionDeclarationScopeEnvironment;

export function isFunctionDeclarationScopeEnvironment(value: ScopeValue) {
  return "declaration" in value && "scope" in value;
}

export interface ThisData {
  readonly declaration: ts.ClassDeclaration | ts.InterfaceDeclaration | undefined;
  readonly llvmType: llvm.PointerType;
  readonly tsType: ts.Type;
  readonly staticProperties?: Map<string, llvm.Value>;
}

export class Scope {
  map: Map<string, ScopeValue>;

  readonly name: string | undefined;
  readonly mangledName: string | undefined;
  readonly thisData: ThisData | undefined;
  readonly parent: Scope | undefined;
  readonly typeMapper: GenericTypeMapper | undefined;

  constructor(name: string | undefined, mangledName: string | undefined, parent?: Scope, data?: ThisData) {
    this.map = new Map<string, ScopeValue>();
    this.name = name;
    this.mangledName = mangledName;
    this.parent = parent;
    this.thisData = data;

    if (name === InternalNames.FunctionScope) {
      this.typeMapper = new GenericTypeMapper();
    }

    if (parent && parent.typeMapper) {
      this.typeMapper = parent.typeMapper;
    }
  }

  get(identifier: string): ScopeValue | undefined {
    let result: ScopeValue | undefined;

    result = this.map.get(identifier);

    if (!result) {
      for (const [_, value] of this.map) {
        if (value instanceof Scope) {
          const s: Scope = value;
          if (s.name === identifier || s.mangledName === identifier) {
            result = s;
            break;
          }
        }
      }
    }

    return result;
  }

  getStatic(identifier: string): llvm.Value | undefined {
    let result: llvm.Value | undefined;

    if (!result && this.thisData && this.thisData.staticProperties) {
      result = this.thisData!.staticProperties!.get(identifier);
    }

    return result;
  }

  names(): string[] {
    const result: string[] = [];
    for (const it of this.map) {
      result.push(it[0]);
    }

    if (this.thisData && this.thisData.staticProperties) {
      for (const [name] of this.thisData!.staticProperties!) {
        result.push(name);
      }
    }

    return result;
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

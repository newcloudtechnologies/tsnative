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

import { LLVMGenerator } from "@generator";
import { FunctionMangler } from "@mangling";
import { setLLVMFunctionScope, addClassScope, Scope, HeapVariableDeclaration, Environment } from "@scope";
import {
  createLLVMFunction,
  error,
  getAliasedSymbolIfNecessary,
  getLLVMType,
  checkIfMethod,
  isValueTy,
  zip,
  isTypeDeclared,
  getGenericsToActualMapFromSignature,
  getArgumentTypes,
  getReturnType,
  handleFunctionArgument,
  tryResolveGenericTypeIfNecessary,
  checkIfFunction,
  InternalNames,
  getEnvironmentType,
  getClosureType,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { getFunctionDeclarationScope } from "@handlers";
import { SysVFunctionHandler } from "./functionhandler_sysv";

export class FunctionHandler extends AbstractExpressionHandler {
  private readonly sysVFunctionHandler: SysVFunctionHandler;

  constructor(generator: LLVMGenerator) {
    super(generator);
    this.sysVFunctionHandler = new SysVFunctionHandler(generator);
  }

  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PropertyAccessExpression:
        return this.handleGetAccessExpression(expression as ts.PropertyAccessExpression);
      case ts.SyntaxKind.CallExpression:
        return this.generator.symbolTable.withLocalScope(
          (callScope: Scope) => this.handleCallExpression(expression as ts.CallExpression, callScope, env),
          this.generator.symbolTable.currentScope,
          InternalNames.FunctionScope
        );
      case ts.SyntaxKind.ArrowFunction:
        return this.generator.symbolTable.withLocalScope(
          (callScope: Scope) => this.handleArrowFunction(expression as ts.ArrowFunction, callScope),
          this.generator.symbolTable.currentScope,
          InternalNames.FunctionScope
        );
      case ts.SyntaxKind.NewExpression:
        return this.handleNewExpression(expression as ts.NewExpression);
      case ts.SyntaxKind.FunctionExpression:
        return this.handleFunctionExpression(
          expression as ts.FunctionExpression,
          this.generator.symbolTable.currentScope
        ).closure;
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleArrowFunction(expression: ts.ArrowFunction, callScope: Scope): llvm.Value {
    const callContext: HeapVariableDeclaration[] = [];
    callScope.parent?.map.forEach((scopeVal, key) => {
      if (scopeVal instanceof HeapVariableDeclaration) {
        scopeVal.allocated.name = key;
        callContext.push(scopeVal);
      }
    });

    const types = callContext.map((value) => value.initializer.type.getPointerTo());

    const environmentDataType = getEnvironmentType(types, this.generator);
    const environmentDataPointerType = environmentDataType.getPointerTo();

    const signature = this.generator.checker.getSignatureFromDeclaration(expression)!;
    const tsReturnType: ts.Type = this.generator.checker.getReturnTypeOfSignature(signature);
    const tsArgumentTypes = expression.parameters.map(this.generator.checker.getTypeAtLocation);

    const allocations = callContext.map((value) => value.allocated);
    const names = callContext.map((value) => value.allocated.name);

    let environmentData = llvm.Constant.getNullValue(environmentDataType);
    allocations.forEach((v, i) => {
      environmentData = this.generator.builder.createInsertValue(environmentData, v, [i], names[i]) as llvm.Constant;
    });

    const env = new Environment(names, environmentData, allocations);

    let llvmReturnType;
    if (checkIfFunction(tsReturnType)) {
      const { functionType } = this.getNestedFunctionEnvironmentAndType(
        expression,
        expression.body,
        tsReturnType,
        [],
        env
      );

      llvmReturnType = functionType!;
    } else {
      llvmReturnType = getLLVMType(tsReturnType, expression, this.generator);
    }

    const llvmArgumentTypes = tsArgumentTypes.map((arg) => {
      return getLLVMType(arg, expression, this.generator, environmentDataPointerType);
    });

    llvmArgumentTypes.unshift(environmentDataPointerType);

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, "", this.generator.module);

    this.handleFunctionBody(llvmReturnType, undefined, expression, fn, env);
    const closureType = getClosureType([fn.type, environmentDataPointerType], this.generator);
    return this.makeClosure(closureType, [], fn, callContext);
  }

  private getNestedFunctionEnvironmentAndType(
    expression: ts.Expression,
    functionBody: ts.ConciseBody,
    tsReturnType: ts.Type,
    args: llvm.Value[],
    env: Environment
  ) {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope((bodyScope) => {
        let functionContext: HeapVariableDeclaration[] | undefined;
        let functionType: llvm.Type | undefined;
        const dummyBlock = llvm.BasicBlock.create(this.generator.context, "dummy", this.generator.currentFunction);
        this.generator.builder.setInsertionPoint(dummyBlock);

        functionBody.forEachChild((node) => {
          if (ts.isReturnStatement(node) && node.expression && ts.isFunctionExpression(node.expression)) {
            const context: HeapVariableDeclaration[] = [];
            bodyScope.map.forEach((scopeVal, key) => {
              if (scopeVal instanceof HeapVariableDeclaration) {
                scopeVal.allocated.name = key;
                context.push(scopeVal);
              }
            });

            functionContext = context;

            const types = context.map((value) => value.initializer.type.getPointerTo());
            if (args.length > 0) {
              types.push(...args.map((a) => a.type.getPointerTo()));
            }

            const envType = getEnvironmentType(types, this.generator);
            const closurePointerType = envType.getPointerTo();
            functionType = getLLVMType(tsReturnType, expression, this.generator, closurePointerType);
          } else {
            this.generator.handleNode(node, bodyScope, env);
          }
        });

        dummyBlock.eraseFromParent();
        return { context: functionContext, functionType };
      }, this.generator.symbolTable.currentScope);
    });
  }

  private handleGetAccessExpression(expression: ts.PropertyAccessExpression): llvm.Value {
    const thisType = this.generator.checker.getTypeAtLocation(expression.expression);
    const symbol = this.generator.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol!.valueDeclaration as ts.GetAccessorDeclaration;

    const { isExternalSymbol, qualifiedName } = FunctionMangler.mangle(
      valueDeclaration,
      expression,
      thisType,
      [],
      this.generator
    );

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleGetAccessExpression(expression, qualifiedName);
    }

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = parentScope.thisData!.type;
    const returnType: ts.Type = this.generator.checker.getTypeAtLocation(expression);
    const llvmReturnType = getLLVMType(returnType, expression, this.generator);
    const llvmArgumentTypes = [isValueTy(llvmThisType) ? llvmThisType : llvmThisType.getPointerTo()];

    const { fn, existing } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
    );
    const body = valueDeclaration.body;
    if (body && !existing) {
      this.handleFunctionBody(llvmReturnType, thisType, valueDeclaration, fn);
      setLLVMFunctionScope(fn, parentScope);
    }

    const thisValue = this.generator.handleExpression(expression.expression);
    const args = [thisValue];

    return this.generator.builder.createCall(fn, args);
  }

  private handleCallExpression(expression: ts.CallExpression, callScope: Scope, outerEnv?: Environment): llvm.Value {
    const functionName = expression.expression.getText();
    const knownValue = this.generator.symbolTable.currentScope.tryGetThroughParentChain(
      functionName,
      false
    ) as llvm.Value;

    // Function is already stored in some variable
    if (knownValue) {
      const args = expression.arguments
        .map((argument) => handleFunctionArgument(argument, this.generator, outerEnv))
        .map((value) => {
          if (value.name?.startsWith(InternalNames.Closure)) {
            // Ignore closures as parameters for now. Use a closure function as parameter instead
            const closure = this.generator.builder.createLoad(value);
            const closureFunction = this.generator.builder.createExtractValue(closure, [0]);
            return closureFunction;
          }

          return value;
        });

      if (knownValue.name?.startsWith(InternalNames.Closure)) {
        // Handle closure. Get a closure function and pass its data as argument + actual args
        const closure = this.generator.builder.createLoad(knownValue);
        const closureFunction = this.generator.builder.createExtractValue(closure, [0]);
        const closureFunctionData = this.generator.builder.createExtractValue(closure, [1]);
        return this.generator.builder.createCall(closureFunction, [closureFunctionData, ...args]);
      } else {
        const environmentPointer = callScope.tryGetThroughParentChain(InternalNames.Environment) as llvm.Value;

        if (!environmentPointer) {
          error(`Environment not found during ${functionName} handling`);
        }

        // Prepare stub environment since every function has an environment as first argument
        const envType = getEnvironmentType([], this.generator);
        const envAlloca = this.generator.builder.createAlloca(envType!);
        args.unshift(envAlloca);

        const environment = this.generator.builder.createLoad(environmentPointer);
        // @todo: seek in the parent chain up to top level
        const index = outerEnv!.varNames.indexOf(functionName);

        if (index > -1) {
          // Function was found in environment (likely it was passed as an argument). Call it
          const fnPointer = this.generator.builder.createExtractValue(environment, [index]);
          const fn = this.generator.builder.createLoad(fnPointer);
          return this.generator.builder.createCall(fn, args);
        } else {
          // Seek function in scope
          const fn = callScope.tryGetThroughParentChain(functionName) as llvm.Value;
          if (!fn) {
            error(`Function ${functionName} not found in environment nor call scope`);
          }
          return this.generator.builder.createCall(fn, args);
        }
      }
    }

    const argumentTypes = getArgumentTypes(expression, this.generator);
    const isMethod = checkIfMethod(expression.expression, this.generator.checker);
    let thisType: ts.Type | undefined;
    if (isMethod) {
      const methodReference = expression.expression as ts.PropertyAccessExpression;
      thisType = this.generator.checker.getTypeAtLocation(methodReference.expression);
    }

    const symbol = this.generator.checker.getTypeAtLocation(expression.expression).symbol;
    const valueDeclaration = getAliasedSymbolIfNecessary(symbol, this.generator.checker)
      .valueDeclaration as ts.FunctionLikeDeclaration;

    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration as ts.SignatureDeclaration)!;
    if (valueDeclaration.typeParameters?.length) {
      const map = getGenericsToActualMapFromSignature(signature, expression, this.generator);
      for (const typename in map) {
        if (map.hasOwnProperty(typename)) {
          const knownType = Boolean(this.generator.symbolTable.currentScope.tryGetThroughParentChain(typename));
          if (!knownType) {
            this.generator.symbolTable.currentScope.set(typename, map[typename]);
          }
        }
      }
    }

    const { isExternalSymbol, qualifiedName } = FunctionMangler.mangle(
      valueDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator
    );

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleCallExpression(expression, qualifiedName, outerEnv);
    }

    const callContext: HeapVariableDeclaration[] = [];
    callScope.parent?.map.forEach((scopeVal, key) => {
      if (scopeVal instanceof HeapVariableDeclaration) {
        scopeVal.allocated.name = key;
        callContext.push(scopeVal);
      }
    });

    const args = expression.arguments.map((argument) => {
      const value = handleFunctionArgument(argument, this.generator, outerEnv);
      if (value.name?.startsWith(InternalNames.Closure)) {
        const closure = this.generator.builder.createLoad(value);
        const closureFunction = this.generator.builder.createExtractValue(closure, [0]);
        return closureFunction;
      } else {
        return value;
      }
    });
    const types = callContext.map((value) => value.initializer.type.getPointerTo());

    if (args.length > 0) {
      types.push(...args.map((a) => a.type.getPointerTo()));
    }
    const environmentDataType = getEnvironmentType(types, this.generator);
    const environmentDataPointerType = environmentDataType.getPointerTo();
    let environmentData = llvm.Constant.getNullValue(environmentDataType);

    const allocations = callContext.map((value) => value.allocated);

    if (args.length > 0) {
      allocations.push(
        ...args.map((a) => {
          const alloca = this.generator.gc.allocate(a.type);
          this.generator.builder.createStore(a, alloca);
          return alloca;
        })
      );
    }

    const names = callContext.map((value) => value.allocated.name);
    if (args.length > 0) {
      names.push(...signature.getParameters().map((p) => p.escapedName.toString()));
    }

    allocations.forEach((v, i) => {
      environmentData = this.generator.builder.createInsertValue(environmentData, v, [i], names[i]) as llvm.Constant;
    });

    const env = new Environment(names, environmentData, allocations);

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = thisType ? parentScope.thisData!.type : undefined;

    const environmentAlloca = this.generator.gc.allocate(environmentDataType);
    this.generator.builder.createStore(environmentData, environmentAlloca);

    let innerFunctionContext: HeapVariableDeclaration[] | undefined;
    const returnType = getReturnType(expression, this.generator);
    let llvmReturnType: llvm.Type;
    if (checkIfFunction(returnType)) {
      const { context, functionType } = this.getNestedFunctionEnvironmentAndType(
        expression,
        valueDeclaration.body!,
        returnType,
        args,
        env
      );
      innerFunctionContext = context!;
      llvmReturnType = functionType!;
    } else {
      llvmReturnType = getLLVMType(returnType, expression, this.generator);
    }

    const llvmArgumentTypes = argumentTypes.map((argumentType) => {
      const type = getLLVMType(argumentType, expression, this.generator);
      return isValueTy(type) ? type : type.getPointerTo();
    });

    if (llvmThisType) {
      llvmArgumentTypes.unshift(llvmThisType);
    } else {
      llvmArgumentTypes.unshift(environmentDataPointerType);
    }

    const { fn, existing } = createLLVMFunction(
      llvmReturnType!,
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
    );
    const body = valueDeclaration.body;

    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      const val = this.generator.handleExpression(propertyAccess.expression);
      args.unshift(val);
    } else {
      args.unshift(environmentAlloca);
    }

    if (body && !existing) {
      const innerFn = this.handleFunctionBody(llvmReturnType!, thisType!, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope);

      if (checkIfFunction(returnType)) {
        this.generator.builder.createCall(fn, args);
        const contextTypes = innerFunctionContext!.map((value) => value.initializer.type.getPointerTo());
        // ignore environment argument
        if (args.length > 1) {
          contextTypes.push(...args.slice(1).map((a) => a.type.getPointerTo()));
        }

        const innerEnvironmentDataType = getEnvironmentType(contextTypes, this.generator);
        const innerEnvironmentDataPointerType = innerEnvironmentDataType.getPointerTo();
        const closureType = getClosureType([llvmReturnType!, innerEnvironmentDataPointerType], this.generator);
        return this.makeClosure(closureType, args, innerFn!, innerFunctionContext!);
      }
    }

    return this.generator.builder.createCall(fn, args);
  }

  private makeClosure(
    closureType: llvm.Type,
    args: llvm.Value[],
    fn: llvm.Function,
    fnContext: HeapVariableDeclaration[]
  ) {
    const types = fnContext!.map((value) => value.initializer.type.getPointerTo());

    // ignore environment argument
    if (args.length > 1) {
      types.push(...args.slice(1).map((a) => a.type.getPointerTo()));
    }

    const environmentDataType = (fn.getArguments()[0].type as llvm.PointerType).elementType;
    let environmentData = llvm.Constant.getNullValue(environmentDataType);

    const values = fnContext!.map((value) => value.initializer);

    if (args.length > 1) {
      values.push(...args.slice(1));
    }

    values.forEach((v, i) => {
      const alloca = this.generator.gc.allocate(v.type);
      this.generator.builder.createStore(v, alloca);
      environmentData = this.generator.builder.createInsertValue(environmentData, alloca, [i], v.name) as llvm.Constant;
    });

    const environmentAlloca = this.generator.gc.allocate(environmentDataType);
    this.generator.builder.createStore(environmentData, environmentAlloca);

    let closure = llvm.Constant.getNullValue(closureType);
    closure = this.generator.builder.createInsertValue(closure, fn!, [0]) as llvm.Constant;
    closure = this.generator.builder.createInsertValue(closure, environmentAlloca, [1]) as llvm.Constant;
    const closureAlloca = this.generator.gc.allocate(closureType);
    this.generator.builder.createStore(closure, closureAlloca);

    closureAlloca.name = InternalNames.Closure;
    return closureAlloca;
  }

  private handleNewExpression(expression: ts.NewExpression): llvm.Value {
    const thisType = this.generator.checker.getTypeAtLocation(expression);
    const classDeclaration = getAliasedSymbolIfNecessary(thisType.symbol, this.generator.checker).valueDeclaration;

    if (!ts.isClassDeclaration(classDeclaration)) {
      return error("Expected class declaration");
    }

    const constructorDeclaration = classDeclaration.members.find(ts.isConstructorDeclaration);
    if (!constructorDeclaration) {
      return error(`No constructor provided: ${expression.getText()}`);
    }

    if (!isTypeDeclared(thisType, constructorDeclaration, this.generator)) {
      addClassScope(expression, this.generator.symbolTable.currentScope, this.generator);
    }

    const argumentTypes = expression.arguments?.map(this.generator.checker.getTypeAtLocation) || [];
    const { isExternalSymbol, qualifiedName } = FunctionMangler.mangle(
      constructorDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator
    );

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleNewExpression(expression, qualifiedName);
    }

    const parentScope = getFunctionDeclarationScope(classDeclaration, thisType, this.generator);
    const llvmThisType: llvm.PointerType = parentScope.thisData!.type as llvm.PointerType;

    const parameterTypes = argumentTypes.map((argumentType) => getLLVMType(argumentType, expression, this.generator));
    const { fn: constructor, existing } = createLLVMFunction(
      llvmThisType,
      parameterTypes,
      qualifiedName,
      this.generator.module
    );

    const body = constructorDeclaration.body;
    const args = expression.arguments?.map((argument) => handleFunctionArgument(argument, this.generator)) || [];

    if (body && !existing) {
      this.handleConstructorBody(llvmThisType, constructorDeclaration, constructor);
      setLLVMFunctionScope(constructor, parentScope);
    }

    return this.generator.builder.createCall(constructor, args);
  }

  private handleFunctionExpression(expression: ts.FunctionExpression, scope?: Scope, outerEnvVarNames?: string[]) {
    const symbol = this.generator.checker.getTypeAtLocation(expression).symbol;
    const valueDeclaration = getAliasedSymbolIfNecessary(symbol, this.generator.checker)
      .valueDeclaration as ts.FunctionLikeDeclaration;
    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration)!;
    let tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    tsReturnType = tryResolveGenericTypeIfNecessary(tsReturnType, this.generator);

    const tsArgumentTypes = signature.getDeclaration().parameters.map((parameter) => {
      let tsType = this.generator.checker.getTypeFromTypeNode(parameter.type!);
      tsType = tryResolveGenericTypeIfNecessary(tsType, this.generator);
      return tsType;
    });

    const llvmReturnType = getLLVMType(tsReturnType, expression, this.generator);
    const llvmArgumentTypes = tsArgumentTypes.map((arg) => getLLVMType(arg, expression, this.generator));

    const callContext: HeapVariableDeclaration[] = [];
    scope?.map.forEach((scopeVal, key) => {
      if (scopeVal instanceof HeapVariableDeclaration) {
        scopeVal.allocated.name = key;
        callContext.push(scopeVal);
      }
    });

    const outerEnv = scope?.get(InternalNames.Environment) as llvm.ConstantStruct;
    const allocations = callContext.map((value) => value.allocated);
    const names = callContext.map((value) => value.allocated.name);
    const types = callContext.map((value) => value.initializer.type.getPointerTo());
    if (outerEnv) {
      const envElementType = (outerEnv.type as llvm.PointerType).elementType as llvm.StructType;
      for (let i = 0; i < envElementType.numElements; ++i) {
        types.push(envElementType.getElementType(i) as llvm.PointerType);
      }

      const outerValues = [];
      for (let i = 0; i < envElementType.numElements; ++i) {
        const extracted = this.generator.builder.createExtractValue(this.generator.builder.createLoad(outerEnv), [i]);
        outerValues.push(extracted);
      }

      allocations.push(...outerValues);
      names.push(...outerEnvVarNames!);
    }

    const envType = getEnvironmentType(types, this.generator);
    const envPointerType = envType.getPointerTo();
    let envData = llvm.Constant.getNullValue(envType);

    allocations.forEach((v, i) => {
      envData = this.generator.builder.createInsertValue(envData, v, [i], names[i]) as llvm.Constant;
    });

    const env = new Environment(names, envData, allocations);

    const closureAlloca = this.generator.gc.allocate(envType);
    this.generator.builder.createStore(envData, closureAlloca);

    llvmArgumentTypes.unshift(envPointerType);

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, "", this.generator.module);
    this.handleFunctionBody(llvmReturnType, undefined, expression, fn, env);

    const closureType = getClosureType([fn.type, fn.getArguments()[0].type], this.generator);
    return {
      closure: this.makeClosure(closureType, [], fn!, callContext),
      fn,
    };
  }

  private handleFunctionBody(
    llvmReturnType: llvm.Type,
    thisType: ts.Type | undefined,
    declaration: ts.FunctionLikeDeclaration,
    fn: llvm.Function,
    env?: Environment
  ): llvm.Function | undefined {
    return this.generator.withInsertBlockKeeping((): llvm.Function | undefined => {
      return this.generator.symbolTable.withLocalScope(
        (bodyScope): llvm.Function | undefined => {
          const parameters = this.generator.checker.getSignatureFromDeclaration(declaration)!.parameters;
          const parameterNames = parameters.map((parameter) => parameter.name);

          if (thisType) {
            parameterNames.unshift("this");
          } else {
            parameterNames.unshift(InternalNames.Environment);
          }

          const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", fn);
          this.generator.builder.setInsertionPoint(entryBlock);

          for (const [parameterName, argument] of zip(parameterNames, fn.getArguments())) {
            argument.name = parameterName;
            bodyScope.set(parameterName, argument);
          }

          let nestedFunction: llvm.Function | undefined;
          declaration.body!.forEachChild((node) => {
            if (ts.isReturnStatement(node) && node.expression && ts.isFunctionExpression(node.expression)) {
              const { fn: closureFn } = this.handleFunctionExpression(node.expression, bodyScope, env!.varNames);
              nestedFunction = closureFn;
              this.generator.builder.createRet(closureFn);
              return;
            }

            this.generator.handleNode(
              node,
              bodyScope,
              new Environment(
                env!.varNames,
                bodyScope.get(InternalNames.Environment) as llvm.ConstantStruct,
                env!.rawData
              )
            );
          });

          if (!this.generator.isCurrentBlockTerminated) {
            if (llvmReturnType.isVoidTy()) {
              this.generator.builder.createRetVoid();
            } else {
              error("No return statement in function returning non-void");
            }
          }

          return nestedFunction;
        },
        this.generator.symbolTable.currentScope,
        InternalNames.FunctionScope
      );
    });
  }

  private handleConstructorBody(
    llvmThisType: llvm.PointerType,
    constructorDeclaration: ts.FunctionLikeDeclaration,
    constructor: llvm.Function
  ): void {
    this.generator.withInsertBlockKeeping(() => {
      this.generator.symbolTable.withLocalScope((bodyScope: Scope) => {
        const parameterNames = this.generator.checker
          .getSignatureFromDeclaration(constructorDeclaration)!
          .parameters.map((parameter) => parameter.name);

        for (const [parameterName, argument] of zip(parameterNames, constructor.getArguments())) {
          argument.name = parameterName;
          bodyScope.set(parameterName, argument);
        }

        const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", constructor);
        this.generator.builder.setInsertionPoint(entryBlock);

        const thisValue = this.generator.gc.allocate(llvmThisType.elementType);
        bodyScope.set("this", thisValue);

        constructorDeclaration.body!.forEachChild((node) => this.generator.handleNode(node, bodyScope));

        this.generator.builder.createRet(thisValue);
      }, this.generator.symbolTable.currentScope);
    });
  }
}

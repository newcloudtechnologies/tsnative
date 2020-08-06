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
import {
  setLLVMFunctionScope,
  addClassScope,
  FunctionDeclarationScopeEnvironment,
  Scope,
  HeapVariableDeclaration,
  Environment,
  isFunctionDeclarationScopeEnvironment,
  ScopeValue,
  createEnvironment,
} from "@scope";
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
  InternalNames,
  getEnvironmentType,
  getClosureType,
  checkIfStaticMethod,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { getFunctionDeclarationScope, getFunctionEnvironmentVariables, getLLVMReturnType } from "@handlers";
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
        const call = expression as ts.CallExpression;
        if (call.expression.kind === ts.SyntaxKind.SuperKeyword) {
          return this.handleSuperCall(call, env);
        }

        const functionName = call.expression.getText();

        const knownIndex = env ? env.varNames.indexOf(functionName) : -1;
        if (knownIndex > -1) {
          // Function or closure is defined in current environment. Likely it is a funarg.
          return this.handleEnvironmentKnownFunction(call, knownIndex, env);
        }

        let knownValue = this.generator.symbolTable.currentScope.tryGetThroughParentChain(functionName, false);
        if (!knownValue && ts.isPropertyAccessExpression(call.expression)) {
          // Special case: call object's function property
          const objectName = call.expression.expression.getText();
          const object = this.generator.symbolTable.currentScope.tryGetThroughParentChain(objectName, false);
          if (object && object instanceof HeapVariableDeclaration) {
            if (!object.allocated.type.isPointerTy()) {
              error(`Expected object '${objectName}' type to be a PointerType`);
            }

            const fieldName =
              call.expression.name.getText() +
              "__" +
              this.generator.checker.typeToString(this.generator.checker.getTypeAtLocation(call.expression));

            // Heuristically find object fields...
            const objectFields = this.generator.symbolTable.getObjectName(fieldName);
            if (!objectFields) {
              error(`Cannot find object that contains field ${fieldName}`);
            }

            // ...to figure out field's index
            const fieldIndex = objectFields.split(",").indexOf(fieldName);
            if (fieldIndex === -1) {
              error(`Cannot find ${fieldName} in ${objectFields}`);
            }

            // ...to extract it out
            knownValue = this.generator.builder.createExtractValue(
              object.initializer.type.isPointerTy()
                ? this.generator.builder.createLoad(object.initializer)
                : object.initializer,
              [fieldIndex]
            );
          }
        }

        if (knownValue) {
          // Value found in scope chain. Likely it is a function declaration or a closure.
          return this.handleScopeKnownFunction(call, knownValue, env);
        }

        return this.generator.symbolTable.withLocalScope(
          (callScope: Scope) => this.handleCallExpression(call, callScope, env),
          this.generator.symbolTable.currentScope,
          InternalNames.FunctionScope
        );
      case ts.SyntaxKind.ArrowFunction:
        return this.generator.symbolTable.withLocalScope(
          (scope: Scope) => this.handleArrowFunction(expression as ts.ArrowFunction, scope),
          this.generator.symbolTable.currentScope,
          InternalNames.FunctionScope
        );
      case ts.SyntaxKind.NewExpression:
        return this.handleNewExpression(expression as ts.NewExpression, env);
      case ts.SyntaxKind.FunctionExpression:
        return this.handleFunctionExpression(
          expression as ts.FunctionExpression,
          this.generator.symbolTable.currentScope,
          env
        );
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleScopeKnownFunction(expression: ts.CallExpression, knownFunction: ScopeValue, outerEnv?: Environment) {
    if (isFunctionDeclarationScopeEnvironment(knownFunction)) {
      const declarationScopeEnvironment = knownFunction as FunctionDeclarationScopeEnvironment;
      const call = ts.updateCall(
        expression,
        declarationScopeEnvironment.declaration.name!,
        expression.typeArguments,
        expression.arguments
      );

      if (declarationScopeEnvironment.env && outerEnv) {
        // Merge declaration environment and call environments.

        if (outerEnv.data.type.isPointerTy()) {
          error(`Expected outer environment data to be StructType, got ${outerEnv.data.type.toString()}`);
        }

        if (declarationScopeEnvironment.env.data.type.isPointerTy()) {
          error(
            `Expected declaration scope environment data to be StructType, got ${declarationScopeEnvironment.env.data.type.toString()}`
          );
        }

        const declarationEnvironmentType = declarationScopeEnvironment.env.data.type as llvm.StructType;
        const outerEnvironmentType = outerEnv.data.type as llvm.StructType;

        const mergedTypes = [];
        for (let i = 0; i < declarationEnvironmentType.numElements; ++i) {
          mergedTypes.push(declarationEnvironmentType.getElementType(i));
        }

        for (let i = 0; i < outerEnvironmentType.numElements; ++i) {
          mergedTypes.push(outerEnvironmentType.getElementType(i));
        }

        const mergedEnvironmentType = getEnvironmentType(mergedTypes, this.generator);
        let mergedEnvironmentData = llvm.Constant.getNullValue(mergedEnvironmentType);

        for (let i = 0; i < declarationEnvironmentType.numElements; ++i) {
          const element = this.generator.builder.createExtractValue(declarationScopeEnvironment.env.data, [i]);
          const allocated = this.generator.gc.allocate(element.type);
          this.generator.builder.createStore(
            element.type.isPointerTy() ? this.generator.builder.createLoad(element) : element,
            allocated
          );
          mergedEnvironmentData = this.generator.builder.createInsertValue(mergedEnvironmentData, allocated, [
            i,
          ]) as llvm.Constant;
        }

        for (let i = 0; i < outerEnvironmentType.numElements; ++i) {
          const element = this.generator.builder.createExtractValue(outerEnv.data, [i]);
          const allocated = this.generator.gc.allocate(element.type);
          this.generator.builder.createStore(
            element.type.isPointerTy() ? this.generator.builder.createLoad(element) : element,
            allocated
          );
          mergedEnvironmentData = this.generator.builder.createInsertValue(mergedEnvironmentData, allocated, [
            declarationEnvironmentType.numElements + i,
          ]) as llvm.ConstantStruct;
        }

        declarationScopeEnvironment.env.varNames.push(...outerEnv.varNames);
        declarationScopeEnvironment.env.data = mergedEnvironmentData;
      }

      // Finally make a call.
      return this.handleCallExpression(
        call,
        declarationScopeEnvironment.scope,
        declarationScopeEnvironment.env || outerEnv
      );
    }

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

    const knownValueName = (knownFunction as llvm.Value)?.name;
    const knownValueElementName = (((knownFunction as llvm.Value)?.type as llvm.PointerType)
      ?.elementType as llvm.StructType)?.name;
    if (knownValueName?.startsWith(InternalNames.Closure) || knownValueElementName?.startsWith("cls__")) {
      // Handle closure. Get a closure function and pass its data as argument
      const closure = this.generator.builder.createLoad(knownFunction as llvm.Value);
      const closureFunction = this.generator.builder.createExtractValue(closure, [0]);
      const closureFunctionData = this.generator.builder.createExtractValue(closure, [1]);

      return this.generator.builder.createCall(closureFunction, [closureFunctionData]);
    } else {
      // Seek function in scope
      const fn = this.generator.symbolTable.currentScope.tryGetThroughParentChain(
        expression.expression.getText()
      ) as llvm.Value;
      if (fn) {
        const name = ((fn.type as llvm.PointerType).elementType as llvm.StructType).name;
        if (name?.startsWith("cls__")) {
          const closure = this.generator.builder.createLoad(fn as llvm.Value);
          const closureFunction = this.generator.builder.createExtractValue(closure, [0]);
          const closureFunctionData = this.generator.builder.createExtractValue(closure, [1]);
          return this.generator.builder.createCall(closureFunction, [closureFunctionData]);
        }
        return this.generator.builder.createCall(fn, args);
      }

      error(`Function ${expression.expression.getText()} not found`);
    }
  }

  private handleEnvironmentKnownFunction(expression: ts.CallExpression, knownIndex: number, outerEnv?: Environment) {
    let environment;
    if (outerEnv) {
      environment = outerEnv.data;
    } else {
      const environmentPointer = this.generator.symbolTable.currentScope.tryGetThroughParentChain(
        InternalNames.Environment
      ) as llvm.Value;
      if (!environmentPointer) {
        error(`Environment not found during ${expression.expression.getText()} handling`);
      }

      environment = this.generator.builder.createLoad(environmentPointer);
    }

    const ptr = this.generator.builder.createExtractValue(environment, [knownIndex]);
    if (ptr.type.isPointerTy() && ptr.type.elementType.isFunctionTy()) {
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
      return this.generator.builder.createCall(ptr, args);
    }

    const value = ptr.type.isPointerTy() ? this.generator.builder.createLoad(ptr) : ptr;
    const name = value.type.isPointerTy()
      ? ((value.type as llvm.PointerType).elementType as llvm.StructType).name
      : (value.type as llvm.StructType).name;

    if (name?.startsWith("cls__")) {
      const closure = value.type.isPointerTy() ? this.generator.builder.createLoad(value) : value;
      const closureFunction = this.generator.builder.createExtractValue(closure, [0]);
      const closureFunctionData = this.generator.builder.createExtractValue(closure, [1]);
      return this.generator.builder.createCall(closureFunction, [closureFunctionData]);
    }

    error(`Function ${expression.expression.getText()} not found in environment`);
  }

  private handleSuperCall(expression: ts.CallExpression, env?: Environment) {
    const thisType = this.generator.checker.getTypeAtLocation(expression.expression);
    const symbol = getAliasedSymbolIfNecessary(thisType.symbol, this.generator.checker);
    const valueDeclaration = symbol.declarations[0];

    if (!ts.isClassDeclaration(valueDeclaration)) {
      error("Expected class declaration");
    }

    const constructorDeclaration = valueDeclaration.members.find(ts.isConstructorDeclaration);
    if (!constructorDeclaration) {
      error(`No constructor provided: ${expression.getText()}`);
    }

    const argumentTypes = expression.arguments?.map(this.generator.checker.getTypeAtLocation) || [];
    const { qualifiedName } = FunctionMangler.mangle(
      constructorDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator
    );

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = parentScope.thisData!.type as llvm.PointerType;

    const parameterTypes = argumentTypes.map((argumentType) => getLLVMType(argumentType, expression, this.generator));
    const { fn: constructor, existing } = createLLVMFunction(
      llvmThisType,
      parameterTypes,
      qualifiedName,
      this.generator.module
    );

    const body = constructorDeclaration.body;
    const args = expression.arguments?.map((argument) => handleFunctionArgument(argument, this.generator, env)) || [];
    if (body && !existing) {
      this.handleConstructorBody(llvmThisType, constructorDeclaration, constructor, env);
      setLLVMFunctionScope(constructor, parentScope);
    }

    return this.generator.builder.createCall(constructor, args);
  }

  private handleArrowFunction(expression: ts.ArrowFunction, scope: Scope): llvm.Value {
    const signature = this.generator.checker.getSignatureFromDeclaration(expression)!;
    const tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    const tsArgumentTypes = expression.parameters.map(this.generator.checker.getTypeAtLocation);
    const llvmArgumentTypes = tsArgumentTypes.map((arg) => getLLVMType(arg, expression, this.generator));

    const environmentVariables = getFunctionEnvironmentVariables(expression, signature, this.generator);

    // @todo: these dummy arguments have to be substituted by actual arguments once called!
    const dummyArguments = llvmArgumentTypes.map((type) =>
      llvm.Constant.getNullValue(type.isPointerTy() ? type : type.getPointerTo())
    );
    const env = createEnvironment(scope, environmentVariables, this.generator, { args: dummyArguments, signature });
    const environmentDataPointerType = env.data.type.getPointerTo();

    const llvmReturnType = getLLVMReturnType(tsReturnType, expression, expression.body, this.generator, env);

    const { fn } = createLLVMFunction(llvmReturnType, [environmentDataPointerType], "", this.generator.module);
    this.handleFunctionBody(llvmReturnType, undefined, expression, fn, env);

    return this.makeClosure(fn, environmentDataPointerType);
  }

  private handleGetAccessExpression(expression: ts.PropertyAccessExpression): llvm.Value {
    const symbol = this.generator.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol!.valueDeclaration as ts.GetAccessorDeclaration;

    let thisType;
    if (!checkIfStaticMethod(valueDeclaration)) {
      thisType = this.generator.checker.getTypeAtLocation(expression.expression);
    }

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
    let llvmThisType;
    if (thisType) {
      llvmThisType = parentScope.thisData!.type;
    }
    const returnType = this.generator.checker.getTypeAtLocation(expression);
    const llvmReturnType = getLLVMType(returnType, expression, this.generator);
    const llvmArgumentTypes = [];
    if (llvmThisType) {
      llvmArgumentTypes.push(isValueTy(llvmThisType) ? llvmThisType : llvmThisType.getPointerTo());
    }

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

    const args = [];
    if (llvmThisType) {
      const thisValue = this.generator.handleExpression(expression.expression);
      args.push(thisValue);
    }

    return this.generator.builder.createCall(fn, args);
  }

  private handleCallExpression(expression: ts.CallExpression, scope: Scope, outerEnv?: Environment): llvm.Value {
    const argumentTypes = getArgumentTypes(expression, this.generator);
    const isMethod = checkIfMethod(expression.expression, this.generator.checker);
    let thisType: ts.Type | undefined;
    if (isMethod) {
      const methodReference = expression.expression as ts.PropertyAccessExpression;
      thisType = this.generator.checker.getTypeAtLocation(methodReference.expression);
    }

    let symbol = this.generator.checker.getTypeAtLocation(expression.expression).symbol;
    symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);
    // For the arrow functions as parameters there is no valueDeclaration, so use first declaration instead
    const valueDeclaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;

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

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = thisType && parentScope.thisData ? parentScope.thisData!.type : undefined;

    const args = expression.arguments.map((argument) => handleFunctionArgument(argument, this.generator, outerEnv));

    const environmentVariables = getFunctionEnvironmentVariables(valueDeclaration.body!, signature, this.generator);
    const env = createEnvironment(scope, environmentVariables, this.generator, { args, signature }, outerEnv);

    const tsReturnType = getReturnType(expression, this.generator);
    const llvmReturnType = getLLVMReturnType(tsReturnType, expression, valueDeclaration.body, this.generator, env);

    const llvmArgumentTypes = [];
    if (llvmThisType) {
      llvmArgumentTypes.push(
        ...argumentTypes.map((argumentType) => {
          const type = getLLVMType(argumentType, expression, this.generator);
          return isValueTy(type) ? type : type.getPointerTo();
        })
      );
      llvmArgumentTypes.unshift(llvmThisType);
      llvmArgumentTypes.unshift(env.data.type.getPointerTo());
    } else if (env) {
      llvmArgumentTypes.unshift(env.data.type.getPointerTo());
    }

    const { fn, existing } = createLLVMFunction(
      llvmReturnType!,
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
    );

    // All the actual arguments are passing by environment.
    const callArgs = [];

    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      const val = this.generator.handleExpression(propertyAccess.expression, env);
      callArgs.push(...args);
      callArgs.unshift(val);
      callArgs.unshift(env.allocated!);
    } else if (env) {
      callArgs.unshift(env.allocated!);
    }

    if (valueDeclaration.body && !existing) {
      this.handleFunctionBody(llvmReturnType!, thisType!, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope);
    }

    return this.generator.builder.createCall(fn, callArgs);
  }

  private makeClosure(fn: llvm.Function, environmentType: llvm.Type) {
    const environmentData = llvm.Constant.getNullValue(
      environmentType.isPointerTy() ? environmentType.elementType : environmentType
    );

    const allocatedEnvironment = this.generator.gc.allocate(environmentType);
    this.generator.builder.createStore(environmentData, allocatedEnvironment);

    const closureType = getClosureType([fn.type, environmentType], this.generator);
    let closure = llvm.Constant.getNullValue(closureType);
    closure = this.generator.builder.createInsertValue(closure, fn, [0]) as llvm.Constant;
    closure = this.generator.builder.createInsertValue(closure, allocatedEnvironment, [1]) as llvm.Constant;
    const allocatedClosure = this.generator.gc.allocate(closureType);
    this.generator.builder.createStore(closure, allocatedClosure);

    allocatedClosure.name = InternalNames.Closure;
    return allocatedClosure;
  }

  private handleNewExpression(expression: ts.NewExpression, env?: Environment): llvm.Value {
    const thisType = this.generator.checker.getTypeAtLocation(expression);
    const classDeclaration = getAliasedSymbolIfNecessary(thisType.symbol, this.generator.checker).valueDeclaration;

    if (!ts.isClassDeclaration(classDeclaration)) {
      error("Expected class declaration");
    }

    const constructorDeclaration = classDeclaration.members.find(ts.isConstructorDeclaration);
    if (!constructorDeclaration) {
      // @todo: generate empty constructor
      error(`No constructor provided: ${expression.getText()}`);
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
    const args = expression.arguments?.map((argument) => handleFunctionArgument(argument, this.generator, env)) || [];

    if (body && !existing) {
      this.handleConstructorBody(llvmThisType, constructorDeclaration, constructor, env);
      setLLVMFunctionScope(constructor, parentScope);
    }

    return this.generator.builder.createCall(constructor, args);
  }

  private handleFunctionExpression(expression: ts.FunctionExpression, scope: Scope, outerEnv?: Environment) {
    const symbol = this.generator.checker.getTypeAtLocation(expression).symbol;
    const valueDeclaration = getAliasedSymbolIfNecessary(symbol, this.generator.checker)
      .declarations[0] as ts.FunctionLikeDeclaration;
    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration)!;

    const tsArgumentTypes = signature.getDeclaration().parameters.map((parameter) => {
      const tsType = this.generator.checker.getTypeFromTypeNode(parameter.type!);
      return tryResolveGenericTypeIfNecessary(tsType, this.generator);
    });

    const llvmArgumentTypes = tsArgumentTypes.map((arg) => getLLVMType(arg, expression, this.generator));
    // @todo: these dummy arguments have to be substituted by actual arguments once called!
    const dummyArguments = llvmArgumentTypes.map((type) =>
      llvm.Constant.getNullValue(type.isPointerTy() ? type : type.getPointerTo())
    );

    const environmentVariables = getFunctionEnvironmentVariables(expression.body, signature, this.generator);
    const env = createEnvironment(
      scope,
      environmentVariables,
      this.generator,
      {
        args: dummyArguments,
        signature,
      },
      outerEnv
    );

    const environmentDataPointerType = env.data.type.getPointerTo();

    let tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    tsReturnType = tryResolveGenericTypeIfNecessary(tsReturnType, this.generator);
    const llvmReturnType = getLLVMReturnType(tsReturnType, expression, expression.body!, this.generator, env);

    const { fn } = createLLVMFunction(llvmReturnType, [environmentDataPointerType], "", this.generator.module);
    this.handleFunctionBody(llvmReturnType, undefined, expression, fn, env);

    const args = fn.getArguments();
    if (args.length === 0) {
      error("Expected 'environment' argument");
    } else if (args.length > 1) {
      error("Expected ONLY 'environment' argument");
    }

    return this.makeClosure(fn, environmentDataPointerType);
  }

  private handleFunctionBody(
    llvmReturnType: llvm.Type,
    thisType: ts.Type | undefined,
    declaration: ts.FunctionLikeDeclaration,
    fn: llvm.Function,
    env?: Environment
  ) {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope(
        (bodyScope) => {
          const parameterNames = [];

          if (thisType) {
            const parameters = this.generator.checker.getSignatureFromDeclaration(declaration)!.parameters;
            parameterNames.push(...parameters.map((parameter) => parameter.name));
            parameterNames.unshift("this");
            parameterNames.unshift(InternalNames.Environment);
          } else if (env) {
            parameterNames.unshift(InternalNames.Environment);
          }

          const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", fn);
          this.generator.builder.setInsertionPoint(entryBlock);

          for (const [parameterName, argument] of zip(parameterNames, fn.getArguments())) {
            argument.name = parameterName;
            bodyScope.set(parameterName, argument);
          }

          let bodyEnv: Environment | undefined;
          if (env) {
            let bodyEnvData = bodyScope.get(InternalNames.Environment) as llvm.Value;
            if (!bodyEnvData) {
              error(`Environment not found in body scope of ${fn.name}`);
            }

            if (!bodyEnvData.type.isPointerTy()) {
              error("Function body environment data expected to be of PointerType");
            }

            bodyEnvData = this.generator.builder.createLoad(bodyEnvData);

            bodyEnv = new Environment(
              env!.varNames,
              bodyEnvData as llvm.ConstantStruct,
              env!.rawData,
              env.allocated,
              env
            );
          }

          if (ts.isBlock(declaration.body!) && declaration.body!.statements.length > 0) {
            declaration.body!.forEachChild((node) => {
              if (ts.isReturnStatement(node) && node.expression) {
                if (ts.isFunctionExpression(node.expression)) {
                  const closure = this.handleFunctionExpression(node.expression, bodyScope, bodyEnv);
                  this.generator.builder.createRet(closure);
                  return;
                }
              }

              this.generator.handleNode(node, bodyScope, bodyEnv);
            });
          } else if (ts.isBlock(declaration.body!)) {
            // Empty block
            this.generator.builder.createRetVoid();
          } else {
            const blocklessArrowFunctionReturn = this.generator.handleExpression(
              declaration.body! as ts.Expression,
              bodyEnv
            );
            if (blocklessArrowFunctionReturn.type.isVoidTy()) {
              this.generator.builder.createRetVoid();
            } else {
              this.generator.builder.createRet(blocklessArrowFunctionReturn);
            }
          }

          if (!this.generator.isCurrentBlockTerminated) {
            if (llvmReturnType.isVoidTy()) {
              this.generator.builder.createRetVoid();
            } else {
              error("No return statement in function returning non-void");
            }
          }
        },
        this.generator.symbolTable.currentScope,
        InternalNames.FunctionScope
      );
    });
  }

  private handleConstructorBody(
    llvmThisType: llvm.PointerType,
    constructorDeclaration: ts.FunctionLikeDeclaration,
    constructor: llvm.Function,
    env?: Environment
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

        constructorDeclaration.body!.forEachChild((node) => this.generator.handleNode(node, bodyScope, env));

        this.generator.builder.createRet(thisValue);
      }, this.generator.symbolTable.currentScope);
    });
  }
}

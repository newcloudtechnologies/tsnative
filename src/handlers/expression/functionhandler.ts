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
  checkIfStaticProperty,
  zip,
  isTypeDeclared,
  getGenericsToActualMapFromSignature,
  getArgumentTypes,
  getReturnType,
  handleFunctionArgument,
  tryResolveGenericTypeIfNecessary,
  InternalNames,
  getClosureType,
  checkIfStaticMethod,
  initializeUnion,
  isUnionLLVMType,
  getLLVMValue,
  checkIfFunction,
  isDirtyClosure,
  makeClosureWithEffectiveArguments,
  storeActualArguments,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import {
  getFunctionDeclarationScope,
  getLLVMReturnType,
  getEffectiveArguments,
  getEnvironmentVariablesFromBody,
  getFunctionScopes,
} from "@handlers";
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
        const accessorType = (expr: ts.Expression): ts.SyntaxKind => {
          let result: ts.SyntaxKind | undefined;

          const symbol = this.generator.checker.getSymbolAtLocation(expression)!;

          if (symbol.declarations.length === 1) {
            result = symbol.declarations[0].kind;
          } else if (symbol.declarations.length > 1) {
            if (ts.isBinaryExpression(expr.parent)) {
              const binaryExpression = expr.parent as ts.BinaryExpression;

              if (
                ts.isPropertyAccessExpression(binaryExpression.left) ||
                ts.isPropertyAccessExpression(binaryExpression.right)
              ) {
                result =
                  binaryExpression.operatorToken.kind === ts.SyntaxKind.EqualsToken
                    ? ts.SyntaxKind.SetAccessor
                    : ts.SyntaxKind.GetAccessor;
              } else if (ts.isPropertyAccessExpression(expr)) {
                result = ts.SyntaxKind.GetAccessor;
              }
            } else {
              result = ts.SyntaxKind.GetAccessor;
            }
          }

          if (!result) {
            error("Unreachable");
          }

          return result;
        };

        switch (accessorType(expression)) {
          case ts.SyntaxKind.GetAccessor:
            return this.generator.symbolTable.withLocalScope(
              (callScope: Scope) =>
                this.handleGetAccessExpression(expression as ts.PropertyAccessExpression, callScope, env),
              this.generator.symbolTable.currentScope,
              InternalNames.FunctionScope
            );
          case ts.SyntaxKind.SetAccessor:
            return this.generator.symbolTable.withLocalScope(
              (callScope: Scope) =>
                this.handleSetAccessExpression(expression as ts.PropertyAccessExpression, callScope, env),
              this.generator.symbolTable.currentScope,
              InternalNames.FunctionScope
            );
          default:
            error("Unreachable");
        }

      case ts.SyntaxKind.CallExpression:
        const call = expression as ts.CallExpression;
        if (call.expression.kind === ts.SyntaxKind.SuperKeyword) {
          return this.handleSuperCall(call, env);
        }

        const functionName = call.expression.getText();

        if (env) {
          const knownIndex = env.varNames.indexOf(functionName);
          if (knownIndex > -1) {
            // Function or closure is defined in current environment. Likely it is a funarg.
            return this.handleEnvironmentKnownFunction(call, knownIndex, env);
          }
        }

        let knownValue = this.generator.symbolTable.currentScope.tryGetThroughParentChain(functionName, false);
        if (!knownValue && ts.isPropertyAccessExpression(call.expression)) {
          // Special case: call object's function property
          const objectName = call.expression.expression.getText();
          const objectEnvironmentIndex = env ? env.varNames.indexOf(objectName) : -1;
          const object =
            objectEnvironmentIndex > -1
              ? this.generator.builder.createExtractValue(env!.data, [objectEnvironmentIndex])
              : this.generator.symbolTable.currentScope.tryGetThroughParentChain(objectName, false);

          if (object) {
            const fieldName =
              call.expression.name.getText() +
              "__" +
              this.generator.checker.typeToString(this.generator.checker.getTypeAtLocation(call.expression));

            // Heuristically find object fields...
            const objectFields = this.generator.symbolTable.getObjectName(fieldName);
            if (objectFields) {
              // ...to figure out field's index
              const fieldIndex = objectFields.split(",").indexOf(fieldName);
              if (fieldIndex === -1) {
                error(`Cannot find ${fieldName} in ${objectFields}`);
              }

              if (object instanceof HeapVariableDeclaration) {
                // ...to extract it out
                knownValue = this.generator.builder.createExtractValue(getLLVMValue(object.allocated, this.generator), [
                  fieldIndex,
                ]);
              } else if (object instanceof llvm.Value) {
                // ...to extract it out
                knownValue = this.generator.builder.createExtractValue(getLLVMValue(object, this.generator), [
                  fieldIndex,
                ]);
              }
            }
          }
        }

        if (knownValue) {
          if (knownValue instanceof HeapVariableDeclaration) {
            knownValue = knownValue.allocated;
          }
          // Value found in scope chain. Likely it is a function declaration or a closure.
          if (!(knownValue instanceof llvm.Value && isDirtyClosure(knownValue))) {
            // Ignore `dirty` closures. Handle them as simple call.
            return this.handleScopeKnownFunction(call, knownValue, env);
          }
        }

        return this.generator.symbolTable.withLocalScope(
          (callScope: Scope) => this.handleCallExpression(call, callScope, env),
          this.generator.symbolTable.currentScope,
          InternalNames.FunctionScope
        );
      case ts.SyntaxKind.ArrowFunction:
        return this.generator.symbolTable.withLocalScope(
          (scope: Scope) => this.handleArrowFunction(expression as ts.ArrowFunction, scope, env),
          this.generator.symbolTable.currentScope,
          InternalNames.FunctionScope
        );
      case ts.SyntaxKind.NewExpression:
        return this.handleNewExpression(expression as ts.NewExpression, env);
      case ts.SyntaxKind.FunctionExpression:
        return this.generator.symbolTable.withLocalScope(
          (callScope: Scope) => this.handleFunctionExpression(expression as ts.FunctionExpression, callScope, env),
          this.generator.symbolTable.currentScope,
          InternalNames.FunctionScope
        );
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleScopeKnownFunction(
    expression: ts.CallExpression,
    knownFunction: ScopeValue,
    outerEnv?: Environment
  ): llvm.Value {
    if (isFunctionDeclarationScopeEnvironment(knownFunction)) {
      const declarationScopeEnvironment = knownFunction as FunctionDeclarationScopeEnvironment;
      // Update call with actual declaration.
      const call = ts.updateCall(
        expression,
        declarationScopeEnvironment.declaration.name!,
        expression.typeArguments,
        expression.arguments
      );

      // Make a call.
      return this.generator.symbolTable.withLocalScope(
        (_: Scope) => this.handleCallExpression(call, declarationScopeEnvironment.scope, outerEnv),
        this.generator.symbolTable.currentScope,
        InternalNames.FunctionScope
      );
    }

    let expressionSymbol = this.generator.checker.getTypeAtLocation(expression.expression).symbol;
    expressionSymbol = getAliasedSymbolIfNecessary(expressionSymbol, this.generator.checker);
    const valueDeclaration = expressionSymbol.declarations[0] as ts.FunctionLikeDeclaration;
    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration as ts.SignatureDeclaration)!;
    const signatureParameters = signature.getParameters();

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return expression.arguments
        .map((argument, index) => {
          const value = handleFunctionArgument(argument, index, this.generator, outerEnv);
          const parameterName = signatureParameters[index].escapedName.toString();
          localScope.set(parameterName, value);
          return value;
        })
        .map((value) => {
          if (value.name?.startsWith(InternalNames.Closure)) {
            const closureParameterNames = this.generator.symbolTable.getClosureParameters(
              expression.expression.getText()
            );

            const effectiveArguments = getEffectiveArguments(
              closureParameterNames,
              valueDeclaration,
              this.generator,
              outerEnv
            );
            const environmentData = this.generator.builder.createExtractValue(getLLVMValue(value, this.generator), [1]);
            return makeClosureWithEffectiveArguments(value, effectiveArguments, environmentData, this.generator);
          }

          return value;
        });
    }, this.generator.symbolTable.currentScope);

    const knownValueName = (knownFunction as llvm.Value)?.name;
    const knownValueElementName = (((knownFunction as llvm.Value)?.type as llvm.PointerType)
      ?.elementType as llvm.StructType)?.name;
    if (knownValueName?.startsWith(InternalNames.Closure) || knownValueElementName?.startsWith("cls__")) {
      // Handle closure. Get a closure function and pass its data as argument
      const closure = getLLVMValue(knownFunction as llvm.Value, this.generator);
      const closureFunction = this.generator.builder.createExtractValue(closure, [0]);
      const closureFunctionData = this.generator.builder.createExtractValue(closure, [1]);

      storeActualArguments(args, closureFunctionData, this.generator);

      return this.generator.xbuilder.createSafeCall(closureFunction, [closureFunctionData]);
    } else {
      error(`Function ${expression.expression.getText()} not found`);
    }
  }

  private handleEnvironmentKnownFunction(expression: ts.CallExpression, knownIndex: number, outerEnv: Environment) {
    let expressionSymbol = this.generator.checker.getTypeAtLocation(expression.expression).symbol;
    expressionSymbol = getAliasedSymbolIfNecessary(expressionSymbol, this.generator.checker);
    const valueDeclaration = expressionSymbol.declarations[0] as ts.FunctionLikeDeclaration;
    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration as ts.SignatureDeclaration)!;
    const signatureParameters = signature.getParameters();

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return expression.arguments
        .map((argument, index) => {
          const value = handleFunctionArgument(argument, index, this.generator, outerEnv);
          const parameterName = signatureParameters[index].escapedName.toString();
          localScope.set(parameterName, value);
          return value;
        })
        .map((value) => {
          if (value.name?.startsWith(InternalNames.Closure)) {
            const closureParameterNames = this.generator.symbolTable.getClosureParameters(
              expression.expression.getText()
            );

            const effectiveArguments = getEffectiveArguments(
              closureParameterNames,
              valueDeclaration,
              this.generator,
              outerEnv
            );
            const environmentData = this.generator.builder.createExtractValue(getLLVMValue(value, this.generator), [1]);
            return makeClosureWithEffectiveArguments(value, effectiveArguments, environmentData, this.generator);
          }

          return value;
        });
    }, this.generator.symbolTable.currentScope);

    const ptr = this.generator.builder.createExtractValue(outerEnv.data, [knownIndex]);
    const value = getLLVMValue(ptr, this.generator);
    const name = (value.type as llvm.StructType).name;

    if (name?.startsWith("cls__")) {
      const closureFunction = this.generator.builder.createExtractValue(value, [0]);
      const closureFunctionData = this.generator.builder.createExtractValue(value, [1]);

      storeActualArguments(args, closureFunctionData, this.generator);

      return this.generator.xbuilder.createSafeCall(closureFunction, [closureFunctionData]);
    }

    error(`Function ${expression.expression.getText()} not found in environment`);
  }

  private handleSuperCall(expression: ts.CallExpression, outerEnv?: Environment) {
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

    if (!constructorDeclaration.body) {
      error("Constructor body required");
    }

    const argumentTypes = expression.arguments?.map(this.generator.checker.getTypeAtLocation) || [];
    const { qualifiedName } = FunctionMangler.mangle(
      constructorDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator
    );

    const signature = this.generator.checker.getSignatureFromDeclaration(constructorDeclaration)!;
    const environmentVariables = getEnvironmentVariablesFromBody(
      constructorDeclaration.body,
      signature,
      this.generator
    );
    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);

    const args =
      expression.arguments?.map((argument, index) =>
        handleFunctionArgument(argument, index, this.generator, outerEnv)
      ) || [];
    const env = createEnvironment(parentScope, environmentVariables, this.generator, { args, signature }, outerEnv);

    const llvmThisType = parentScope.thisData!.llvmType as llvm.PointerType;
    const { fn: constructor, existing } = createLLVMFunction(
      llvmThisType,
      [env.allocated.type],
      qualifiedName,
      this.generator.module
    );

    if (!existing) {
      this.handleConstructorBody(llvmThisType, constructorDeclaration, constructor, env);
      setLLVMFunctionScope(constructor, parentScope);
    }

    return this.generator.xbuilder.createSafeCall(constructor, [env.allocated]);
  }

  private handleArrowFunction(expression: ts.ArrowFunction, scope: Scope, outerEnv?: Environment): llvm.Value {
    const signature = this.generator.checker.getSignatureFromDeclaration(expression)!;
    const tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    const tsArgumentTypes = expression.parameters.map(this.generator.checker.getTypeAtLocation);

    this.visitFunctionParameters(expression.parameters);

    if (tsArgumentTypes.some((type) => checkIfFunction(type))) {
      // In this case we cannot predict actual type of environment that will be passed to funarg.
      // Make a `dirty` closure (that is, not `pure` one). Later we will handle a call to it as a simple function call.
      const closureType = getClosureType([], this.generator, true);
      const dummyClosure = llvm.Constant.getNullValue(closureType);
      const allocated = this.generator.gc.allocate(closureType);
      this.generator.xbuilder.createSafeStore(dummyClosure, allocated);
      return allocated;
    }

    const environmentVariables = getEnvironmentVariablesFromBody(expression, signature, this.generator);
    const llvmArgumentTypes = tsArgumentTypes.map((argType) => {
      return getLLVMType(argType, expression, this.generator);
    });

    // these dummy arguments will be substituted by actual arguments once called
    const dummyArguments = llvmArgumentTypes.map((type) =>
      llvm.Constant.getNullValue(type.isPointerTy() ? type : type.getPointerTo())
    );

    const env = createEnvironment(
      scope,
      environmentVariables,
      this.generator,
      { args: dummyArguments, signature },
      outerEnv
    );
    const llvmReturnType = getLLVMReturnType(tsReturnType, expression, expression.body, this.generator, env);

    const environmentDataPointerType = env.allocated.type;

    const { fn } = createLLVMFunction(llvmReturnType, [environmentDataPointerType], "", this.generator.module);

    this.handleFunctionBody(llvmReturnType, undefined, expression, fn, env);

    return this.makeClosure(fn, env);
  }

  private handleGetAccessExpression(
    expression: ts.PropertyAccessExpression,
    scope: Scope,
    outerEnv?: Environment
  ): llvm.Value {
    const symbol = this.generator.checker.getSymbolAtLocation(expression);
    if (!symbol) {
      error("Symbol required");
    }

    let valueDeclaration: ts.GetAccessorDeclaration | undefined;
    for (const it of symbol.declarations) {
      if (it.kind === ts.SyntaxKind.GetAccessor) {
        valueDeclaration = it as ts.GetAccessorDeclaration;
        break;
      }
    }

    if (!valueDeclaration) {
      valueDeclaration = symbol.valueDeclaration as ts.GetAccessorDeclaration;
    }

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
      return this.sysVFunctionHandler.handleGetAccessExpression(expression, qualifiedName, outerEnv);
    }

    if (!valueDeclaration.body) {
      error("Function body required");
    }

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    let llvmThisType;
    if (thisType) {
      llvmThisType = parentScope.thisData!.llvmType;
    }

    const argsToEnv: llvm.Value[] = [];
    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration as ts.SignatureDeclaration)!;
    const environmentVariables = getEnvironmentVariablesFromBody(valueDeclaration.body, signature, this.generator);

    const env = createEnvironment(
      scope,
      environmentVariables,
      this.generator,
      { args: argsToEnv, signature },
      outerEnv
    );

    const tsReturnType = this.generator.checker.getTypeAtLocation(expression);
    const llvmReturnType = getLLVMType(tsReturnType, expression, this.generator);

    const llvmArgumentTypes = [];
    if (llvmThisType) {
      llvmArgumentTypes.unshift(llvmThisType);
      llvmArgumentTypes.unshift(env.allocated.type);
    } else if (env) {
      llvmArgumentTypes.unshift(env.allocated.type);
    }

    const { fn, existing } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName + "__getter",
      this.generator.module
    );

    // All the actual arguments are passing by environment.
    const callArgs = [env.allocated];
    if (llvmThisType) {
      const thisValue = this.generator.handleExpression(expression.expression, env);
      callArgs.push(thisValue);
    }

    if (!existing) {
      this.handleFunctionBody(llvmReturnType, thisType, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope);
    }

    return this.generator.xbuilder.createSafeCall(fn, callArgs);
  }

  private handleSetAccessExpression(
    expression: ts.PropertyAccessExpression,
    scope: Scope,
    outerEnv?: Environment
  ): llvm.Value {
    const symbol = this.generator.checker.getSymbolAtLocation(expression);
    if (!symbol) {
      error("Symbol required");
    }

    const parent = expression.parent as ts.BinaryExpression;

    let valueDeclaration: ts.SetAccessorDeclaration | undefined;
    for (const it of symbol.declarations) {
      if (it.kind === ts.SyntaxKind.SetAccessor) {
        valueDeclaration = it as ts.SetAccessorDeclaration;
        break;
      }
    }

    if (!valueDeclaration) {
      valueDeclaration = symbol.valueDeclaration as ts.SetAccessorDeclaration;
    }

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

    // TODO:
    if (isExternalSymbol) {
      error("Unimplemented");
      //   return this.sysVFunctionHandler.handleSetAccessExpression(expression, qualifiedName, outerEnv);
    }

    if (!valueDeclaration.body) {
      error("Function body required");
    }

    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration as ts.SignatureDeclaration)!;
    const environmentVariables = getEnvironmentVariablesFromBody(valueDeclaration.body, signature, this.generator);

    const argsToEnv: llvm.Value[] = [];
    argsToEnv.push(this.generator.handleExpression(parent.right, outerEnv));

    const env = createEnvironment(
      scope,
      environmentVariables,
      this.generator,
      { args: argsToEnv, signature },
      outerEnv
    );

    const llvmReturnType = llvm.Type.getVoidTy(this.generator.context);

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    let llvmThisType;
    if (thisType) {
      llvmThisType = parentScope.thisData!.llvmType;
    }

    const llvmArgumentTypes = [env.allocated.type];
    if (llvmThisType) {
      llvmArgumentTypes.push(llvmThisType);
    }

    const { fn, existing } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName + "__setter",
      this.generator.module
    );

    // All the actual arguments are passing by environment.
    const callArgs = [env.allocated];
    if (llvmThisType) {
      const thisValue = this.generator.handleExpression(expression.expression, env);
      callArgs.push(thisValue);
    }

    if (!existing) {
      this.handleFunctionBody(llvmReturnType, thisType, valueDeclaration!, fn, env);
      setLLVMFunctionScope(fn, parentScope);
    }

    return this.generator.xbuilder.createSafeCall(fn, callArgs);
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
      const typenameTypeMap = getGenericsToActualMapFromSignature(signature, expression, this.generator);

      typenameTypeMap.forEach((value, key) => {
        this.generator.symbolTable.currentScope.typeMapper!.register(key, value);
      });
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

    if (!valueDeclaration.body) {
      error("Function body required");
    }

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = thisType && parentScope.thisData ? parentScope.thisData!.llvmType : undefined;

    const signatureParameters = signature.getParameters();
    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return expression.arguments
        .map((argument, index) => {
          const value = handleFunctionArgument(argument, index, this.generator, outerEnv);
          const parameterName = signatureParameters[index].escapedName.toString();
          localScope.set(parameterName, value);
          return value;
        })
        .map((value) => {
          if (value.name?.startsWith(InternalNames.Closure)) {
            const closureParameterNames = this.generator.symbolTable.getClosureParameters(
              expression.expression.getText()
            );

            const effectiveArguments = getEffectiveArguments(
              closureParameterNames,
              valueDeclaration,
              this.generator,
              outerEnv
            );
            const environmentData = this.generator.builder.createExtractValue(getLLVMValue(value, this.generator), [1]);
            return makeClosureWithEffectiveArguments(value, effectiveArguments, environmentData, this.generator);
          }

          return value;
        });
    }, this.generator.symbolTable.currentScope);

    const environmentVariables = getEnvironmentVariablesFromBody(valueDeclaration.body, signature, this.generator);

    const innerScopes = getFunctionScopes(valueDeclaration.body, this.generator);
    for (const innerScope of innerScopes) {
      scope.set(
        innerScope.name! +
          "__" +
          Math.random()
            .toString(36)
            .replace(/[^a-z]+/g, "")
            .substr(0, 5),
        innerScope
      );
    }

    const env = createEnvironment(scope, environmentVariables, this.generator, { args, signature }, outerEnv);

    const tsReturnType = getReturnType(expression, this.generator);
    const llvmReturnType = getLLVMReturnType(tsReturnType, expression, valueDeclaration.body!, this.generator, env);

    const llvmArgumentTypes = [env.allocated.type];
    if (llvmThisType) {
      llvmArgumentTypes.push(llvmThisType);
    }

    const { fn, existing } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName,
      this.generator.module
    );

    // All the actual arguments are passing by environment.
    const callArgs = [env.allocated];
    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      const val = this.generator.handleExpression(propertyAccess.expression, env);
      callArgs.push(val);
    }

    if (!existing) {
      this.handleFunctionBody(llvmReturnType, thisType, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope);
    }

    return this.generator.xbuilder.createSafeCall(fn, callArgs);
  }

  private makeClosure(fn: llvm.Function, env: Environment) {
    const closureType = getClosureType([fn.type, env.allocated.type], this.generator, false);
    let closure = llvm.Constant.getNullValue(closureType);

    closure = this.generator.xbuilder.createSafeInsert(closure, fn, [0]) as llvm.Constant;
    closure = this.generator.xbuilder.createSafeInsert(closure, env.allocated, [1]) as llvm.Constant;
    const allocatedClosure = this.generator.gc.allocate(closureType);
    this.generator.xbuilder.createSafeStore(closure, allocatedClosure);

    allocatedClosure.name = InternalNames.Closure;
    return allocatedClosure;
  }

  private handleNewExpression(expression: ts.NewExpression, outerEnv?: Environment): llvm.Value {
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

    const initializers: ts.ExpressionStatement[] = [];

    // iterate properties except static
    for (const memberDecl of classDeclaration.members) {
      if (ts.isPropertyDeclaration(memberDecl)) {
        const propertyDecl = memberDecl as ts.PropertyDeclaration;

        if (propertyDecl.initializer && !checkIfStaticProperty(propertyDecl)) {
          const thisExpr = ts.createThis();
          thisExpr.flags = 0;

          const propAccess = ts.createPropertyAccess(thisExpr, propertyDecl.name as ts.Identifier);
          propAccess.flags = 0;
          thisExpr.parent = propAccess;

          const binExpr = ts.createBinary(propAccess, ts.SyntaxKind.EqualsToken, propertyDecl.initializer);
          binExpr.flags = 0;
          propAccess.parent = binExpr;

          const exprStatement = ts.createExpressionStatement(binExpr);
          exprStatement.flags = 0;
          binExpr.parent = exprStatement;

          exprStatement.parent = constructorDeclaration;

          initializers.push(exprStatement);
        }
      }
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
      return this.sysVFunctionHandler.handleNewExpression(expression, qualifiedName, outerEnv);
    }

    if (!constructorDeclaration.body) {
      error("Constructor body required");
    }

    const args =
      expression.arguments?.map((argument, index) =>
        handleFunctionArgument(argument, index, this.generator, outerEnv)
      ) || [];

    const signature = this.generator.checker.getSignatureFromDeclaration(constructorDeclaration)!;
    const environmentVariables = getEnvironmentVariablesFromBody(
      constructorDeclaration.body,
      signature,
      this.generator
    );
    const parentScope = getFunctionDeclarationScope(classDeclaration, thisType, this.generator);

    const env = createEnvironment(parentScope, environmentVariables, this.generator, { args, signature }, outerEnv);

    if (!parentScope.thisData) {
      error("ThisData required");
    }

    const llvmThisType = parentScope.thisData.llvmType as llvm.PointerType;

    const { fn: constructor, existing } = createLLVMFunction(
      llvmThisType,
      [env.allocated.type],
      qualifiedName,
      this.generator.module
    );

    if (!existing) {
      this.handleConstructorBody(llvmThisType, constructorDeclaration, constructor, env, initializers);
      setLLVMFunctionScope(constructor, parentScope);
    }

    return this.generator.xbuilder.createSafeCall(constructor, [env.allocated]);
  }

  private handleFunctionExpression(expression: ts.FunctionExpression, scope: Scope, outerEnv?: Environment) {
    const symbol = this.generator.checker.getTypeAtLocation(expression).symbol;
    const valueDeclaration = getAliasedSymbolIfNecessary(symbol, this.generator.checker)
      .declarations[0] as ts.FunctionLikeDeclaration;
    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration)!;
    const parameters = signature.getDeclaration().parameters;

    this.visitFunctionParameters(parameters);

    const tsArgumentTypes = parameters.map((parameter) => {
      const tsType = this.generator.checker.getTypeFromTypeNode(parameter.type!);
      return tryResolveGenericTypeIfNecessary(tsType, this.generator);
    });

    if (tsArgumentTypes.some((type) => checkIfFunction(type))) {
      // In this case we cannot predict actual type of environment that will be passed to funarg.
      // Make a `dirty` closure (that is, not `pure` one). Later we will handle a call to it as a simple function call.
      const closureType = getClosureType([], this.generator, true);
      const dummyClosure = llvm.Constant.getNullValue(closureType);
      const allocated = this.generator.gc.allocate(closureType);
      this.generator.xbuilder.createSafeStore(dummyClosure, allocated);
      return allocated;
    }

    const environmentVariables = getEnvironmentVariablesFromBody(expression.body, signature, this.generator);

    const llvmArgumentTypes = tsArgumentTypes.map((argType) => {
      return getLLVMType(argType, expression, this.generator);
    });

    // these dummy arguments will be substituted by actual arguments once called
    const dummyArguments = llvmArgumentTypes.map((type) =>
      llvm.Constant.getNullValue(type.isPointerTy() ? type : type.getPointerTo())
    );

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

    const environmentDataPointerType = env.allocated.type;

    let tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    tsReturnType = tryResolveGenericTypeIfNecessary(tsReturnType, this.generator);
    const llvmReturnType = getLLVMReturnType(tsReturnType, expression, expression.body!, this.generator, env);

    const { fn } = createLLVMFunction(llvmReturnType, [environmentDataPointerType], "", this.generator.module);
    this.handleFunctionBody(llvmReturnType, undefined, expression, fn, env);

    return this.makeClosure(fn, env);
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

          if (env) {
            parameterNames.push(InternalNames.Environment);
          }

          if (thisType) {
            parameterNames.push("this");
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
                  const closure = this.generator.handleExpression(node.expression, bodyEnv);
                  this.generator.xbuilder.createSafeRet(closure);
                  return;
                }

                if (isUnionLLVMType(llvmReturnType)) {
                  let unionRet = this.generator.handleExpression(node.expression, bodyEnv);
                  unionRet = initializeUnion(llvmReturnType as llvm.PointerType, unionRet, this.generator);
                  this.generator.xbuilder.createSafeRet(unionRet);
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
              this.generator.xbuilder.createSafeRet(blocklessArrowFunctionReturn);
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
        this.generator.symbolTable.currentScope.name === InternalNames.FunctionScope
          ? undefined
          : InternalNames.FunctionScope
      );
    });
  }

  private handleConstructorBody(
    llvmThisType: llvm.PointerType,
    constructorDeclaration: ts.FunctionLikeDeclaration,
    constructor: llvm.Function,
    env: Environment,
    initializers?: ts.ExpressionStatement[]
  ): void {
    this.generator.withInsertBlockKeeping(() => {
      this.generator.symbolTable.withLocalScope((bodyScope: Scope) => {
        if (constructor.getArguments().length !== 1) {
          error("Constructor must have one argumet (env)");
        }

        const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", constructor);
        this.generator.builder.setInsertionPoint(entryBlock);

        let bodyEnv: Environment | undefined;
        if (env) {
          const bodyEnvData = constructor.getArguments()[0] as llvm.Value;
          if (!bodyEnvData) {
            error(`Environment not found in body scope`);
          }

          if (!bodyEnvData.type.isPointerTy()) {
            error("Function body environment data expected to be of PointerType");
          }

          bodyEnv = new Environment(
            env.varNames,
            this.generator.builder.createLoad(bodyEnvData) as llvm.ConstantStruct,
            env.rawData,
            bodyEnvData,
            env
          );
        }

        const thisValue = this.generator.gc.allocate(llvmThisType.elementType);
        bodyScope.set("this", thisValue);

        if (initializers) {
          // handle properties initialization first
          initializers.forEach((node) => this.generator.handleNode(node, bodyScope, bodyEnv));
        }

        // handle constructor body
        constructorDeclaration.body!.forEachChild((node) => this.generator.handleNode(node, bodyScope, bodyEnv));

        this.generator.xbuilder.createSafeRet(thisValue);
      }, this.generator.symbolTable.currentScope);
    });
  }

  private visitFunctionParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>) {
    parameters.forEach((parameter) => {
      addClassScope(parameter, this.generator.symbolTable.globalScope, this.generator);
    });
  }
}

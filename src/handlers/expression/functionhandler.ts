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

import { LLVMGenerator, MetaInfoStorage } from "@generator";
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
  isTypeDeclared,
  getGenericsToActualMapFromSignature,
  getArgumentTypes,
  getReturnType,
  tryResolveGenericTypeIfNecessary,
  InternalNames,
  checkIfStaticMethod,
  isUnionLLVMType,
  getLLVMValue,
  checkIfFunction,
  storeActualArguments,
  unwrapPointerType,
  isIntersectionLLVMType,
  getIntersectionSubtypesNames,
  getLLVMTypename,
  getRandomString,
  createTSObjectName,
  isTSClosure,
  isSimilarStructs,
  initializeUnion,
  initializeIntersection,
  isUnionWithUndefinedLLVMType,
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
  getFunctionEnvironmentVariables,
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
          const knownIndex = env.getVariableIndex(functionName);
          if (knownIndex > -1) {
            // Function or closure is defined in current environment. Likely it is a funarg.
            return this.handleEnvironmentKnownFunction(call, knownIndex, env);
          }
        }

        let knownValue = this.generator.symbolTable.currentScope.tryGetThroughParentChain(functionName, false);
        if (!knownValue && ts.isPropertyAccessExpression(call.expression)) {
          // Special case: call object's function property
          const objectName = call.expression.expression.getText();
          const objectEnvironmentIndex = env ? env.getVariableIndex(objectName) : -1;
          const object =
            objectEnvironmentIndex > -1
              ? this.generator.builder.createExtractValue(getLLVMValue(env!.typed, this.generator), [
                  objectEnvironmentIndex,
                ])
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

          return this.handleScopeKnownFunction(call, knownValue, env);
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

    if (!(knownFunction instanceof llvm.Value)) {
      error(`Expected known function '${expression.getText()}' to be llvm.Value`);
    }

    let expressionSymbol = this.generator.checker.getTypeAtLocation(expression.expression).symbol;
    expressionSymbol = getAliasedSymbolIfNecessary(expressionSymbol, this.generator.checker);
    const valueDeclaration = expressionSymbol.declarations[0] as ts.FunctionLikeDeclaration;
    const signature = this.generator.checker.getResolvedSignature(expression);
    if (!signature) {
      error(`Signature not found at '${expression.expression.getText()}'`);
    }

    const args = this.generator.symbolTable
      .withLocalScope((localScope: Scope) => {
        return this.handleCallArguments(expression, valueDeclaration, signature!, localScope, outerEnv);
      }, this.generator.symbolTable.currentScope)
      .map((value) => value.value);

    if (isTSClosure(knownFunction)) {
      return this.handleTSClosureCall(expression, signature, args, valueDeclaration, knownFunction, outerEnv);
    }

    if (unwrapPointerType(knownFunction.type).isFunctionTy()) {
      return this.generator.xbuilder.createSafeCall(knownFunction, args);
    } else {
      error(`Function ${expression.expression.getText()} not found`);
    }
  }

  private handleEnvironmentKnownFunction(expression: ts.CallExpression, knownIndex: number, outerEnv: Environment) {
    const ptr = this.generator.builder.createExtractValue(getLLVMValue(outerEnv.typed, this.generator), [knownIndex]);

    let expressionSymbol = this.generator.checker.getTypeAtLocation(expression.expression).symbol;
    expressionSymbol = getAliasedSymbolIfNecessary(expressionSymbol, this.generator.checker);
    const valueDeclaration = expressionSymbol.declarations[0] as ts.FunctionLikeDeclaration;

    const signature = this.generator.checker.getResolvedSignature(expression);
    if (!signature) {
      error(`Signature not found at '${expression.expression.getText()}'`);
    }

    const args = this.generator.symbolTable
      .withLocalScope((localScope: Scope) => {
        return this.handleCallArguments(expression, valueDeclaration, signature!, localScope, outerEnv);
      }, this.generator.symbolTable.currentScope)
      .map((value) => value.value);

    if (unwrapPointerType(ptr.type).isFunctionTy()) {
      return this.generator.xbuilder.createSafeCall(ptr, args);
    }

    if (isTSClosure(ptr)) {
      return this.handleTSClosureCall(expression, signature, args, valueDeclaration, ptr, outerEnv);
    }

    error(`Function ${expression.expression.getText()} not found in environment`);
  }

  private handleTSClosureCall(
    expression: ts.CallExpression,
    signature: ts.Signature,
    args: llvm.Value[],
    valueDeclaration: ts.FunctionLikeDeclaration,
    closure: llvm.Value,
    outerEnv?: Environment
  ) {
    const tsReturnType = getReturnType(expression, this.generator);
    let llvmReturnType = getLLVMType(tsReturnType, expression, this.generator);

    const types = signature.getParameters().map((p) => {
      const tsType = tryResolveGenericTypeIfNecessary(
        this.generator.checker.getTypeOfSymbolAtLocation(p, expression),
        this.generator
      );
      return getLLVMType(tsType, expression, this.generator);
    });

    const mismatchArgs: { arg: llvm.Value; llvmArgType: llvm.Type }[] = [];

    const adjustedArgs = args.map((arg, index) => {
      const llvmArgType = types[index];
      if (!arg.type.equals(llvmArgType)) {
        if (!isSimilarStructs(arg.type, llvmArgType)) {
          if (isUnionLLVMType(llvmArgType)) {
            arg = initializeUnion(llvmArgType as llvm.PointerType, arg, this.generator);
          } else if (isIntersectionLLVMType(llvmArgType)) {
            arg = initializeIntersection(llvmArgType as llvm.PointerType, arg, this.generator);
          }
        }
      }
      return arg;
    });

    adjustedArgs.forEach((arg, argIndex) => {
      const llvmArgType = types[argIndex];
      if (!arg.type.equals(llvmArgType) && !isSimilarStructs(arg.type, llvmArgType)) {
        mismatchArgs.push({ arg, llvmArgType });
      }
    });

    if (mismatchArgs.length > 0) {
      if (!valueDeclaration.body) {
        let parentFunction = expression.parent;

        if (!parentFunction) {
          error("Unreachable");
        }

        while (parentFunction) {
          if (ts.isFunctionLike(parentFunction)) {
            const hasCalledClosure = parentFunction.parameters.some((parameter) => {
              return parameter.getText().startsWith(expression.expression.getText());
            });
            if (hasCalledClosure) {
              break;
            }
          }

          parentFunction = parentFunction.parent;
        }

        if (!parentFunction || !ts.isFunctionLike(parentFunction)) {
          error("Unreachable");
        }

        if (!parentFunction.name) {
          error(`Function name required at\n${parentFunction.getText()}`);
        }

        valueDeclaration = this.generator.meta.getClosureParameterDeclaration(
          parentFunction.name.getText(),
          expression.expression.getText()
        );
        signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration as ts.SignatureDeclaration)!;
      }

      const returnTypeName = getLLVMTypename(llvmReturnType);
      const canGenerateFunction = mismatchArgs.reduce((can, mismatchArg) => {
        if (isUnionLLVMType(mismatchArg.llvmArgType)) {
          return can && true;
        }

        if (can && isIntersectionLLVMType(mismatchArg.arg.type)) {
          const llvmArgName = getLLVMTypename(mismatchArg.llvmArgType);
          if (llvmArgName === returnTypeName) {
            llvmReturnType = mismatchArg.arg.type;
          }

          const intersectionType = unwrapPointerType(mismatchArg.arg.type) as llvm.StructType;
          const intersectionTypename = getLLVMTypename(intersectionType);
          const intersectionSubtypeNames = getIntersectionSubtypesNames(intersectionType);

          return intersectionSubtypeNames.includes(llvmArgName) || intersectionTypename.includes(llvmArgName);
        }

        return false;
      }, true);

      if (canGenerateFunction) {
        const environmentVariables = getFunctionEnvironmentVariables(expression, signature, this.generator);
        const closureScope = getFunctionDeclarationScope(valueDeclaration, undefined, this.generator);
        const closureEnv = createEnvironment(
          closureScope,
          environmentVariables,
          this.generator,
          { args: adjustedArgs, signature },
          outerEnv
        );

        const { fn } = createLLVMFunction(llvmReturnType, [closureEnv.voidStar], "", this.generator.module);

        this.handleFunctionBody(llvmReturnType, undefined, valueDeclaration, fn, closureEnv);
        llvm.verifyFunction(fn);

        const functionType = this.generator.checker.getTypeAtLocation(expression.expression);
        closure = this.makeClosure(fn, functionType, closureEnv.untyped);
        const closureCall = this.generator.builtinTSClosure.getLLVMCall();

        if (llvmReturnType.isVoidTy()) {
          return this.generator.xbuilder.createSafeCall(closureCall, [closure]);
        }

        llvmReturnType = llvmReturnType.isPointerTy() ? llvmReturnType : llvmReturnType.getPointerTo();
        const callResult = this.generator.xbuilder.createSafeCall(closureCall, [closure]);

        return this.generator.builder.createBitCast(callResult, llvmReturnType);
      }
    }

    const structType = llvm.StructType.get(
      this.generator.context,
      adjustedArgs.map((a) => a.type)
    ).getPointerTo();

    const getEnvironment = this.generator.builtinTSClosure.getLLVMGetEnvironment();
    const environment = this.generator.builder.createBitCast(
      this.generator.xbuilder.createSafeCall(getEnvironment, [closure]),
      structType
    );

    storeActualArguments(adjustedArgs, environment, this.generator);

    const closureCall = this.generator.builtinTSClosure.getLLVMCall();
    if (llvmReturnType.isVoidTy()) {
      return this.generator.xbuilder.createSafeCall(closureCall, [closure]);
    }

    llvmReturnType = llvmReturnType.isPointerTy() ? llvmReturnType : llvmReturnType.getPointerTo();
    const callResult = this.generator.xbuilder.createSafeCall(closureCall, [closure]);

    return this.generator.builder.createBitCast(callResult, llvmReturnType);
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

    const args = expression.arguments?.map((argument) => this.generator.handleExpression(argument, outerEnv)) || [];
    const env = createEnvironment(parentScope, environmentVariables, this.generator, { args, signature }, outerEnv);

    const llvmThisType = parentScope.thisData!.llvmType as llvm.PointerType;
    const { fn: constructor, existing } = createLLVMFunction(
      llvmThisType,
      [env.voidStar],
      qualifiedName,
      this.generator.module
    );

    if (!existing) {
      this.handleConstructorBody(llvmThisType, constructorDeclaration, constructor, env);
      setLLVMFunctionScope(constructor, parentScope);
    }

    return this.generator.xbuilder.createSafeCall(constructor, [env.untyped]);
  }

  private handleArrowFunction(expression: ts.ArrowFunction, scope: Scope, outerEnv?: Environment): llvm.Value {
    const signature = this.generator.checker.getSignatureFromDeclaration(expression)!;
    const tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    const tsArgumentTypes = expression.parameters.map(this.generator.checker.getTypeAtLocation);

    this.visitFunctionParameters(expression.parameters);

    const environmentVariables = getEnvironmentVariablesFromBody(expression, signature, this.generator);
    const llvmArgumentTypes = tsArgumentTypes.map((argType) => {
      if (checkIfFunction(argType)) {
        return this.generator.builtinTSClosure.getLLVMType();
      }
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
    const llvmReturnType = getLLVMReturnType(tsReturnType, expression, this.generator);
    const { fn } = createLLVMFunction(llvmReturnType, [env.voidStar], "", this.generator.module);

    this.handleFunctionBody(llvmReturnType, undefined, expression, fn, env);

    const functionType = this.generator.checker.getTypeAtLocation(expression);
    return this.makeClosure(fn, functionType, env.untyped);
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

    const llvmArgumentTypes = [env.voidStar];
    if (llvmThisType) {
      llvmArgumentTypes.push(llvmThisType);
    }

    const { fn, existing } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName + "__getter",
      this.generator.module
    );

    // All the actual arguments are passing by typeless environment.
    const callArgs = [env.untyped];
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

    const llvmArgumentTypes = [env.voidStar];
    if (llvmThisType) {
      llvmArgumentTypes.push(llvmThisType);
    }

    const { fn, existing } = createLLVMFunction(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName + "__setter",
      this.generator.module
    );

    // All the actual arguments are passing by typeless environment.
    const callArgs = [env.untyped];
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

    let valueDeclaration = symbol.declarations.find((value: ts.Declaration) => {
      const functionLikeDeclaration = value as ts.FunctionLikeDeclaration;
      return functionLikeDeclaration.parameters.length === argumentTypes.length;
    }) as ts.FunctionLikeDeclaration;

    if (!valueDeclaration) {
      valueDeclaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;
    }

    const signature = this.generator.checker.getSignatureFromDeclaration(valueDeclaration as ts.SignatureDeclaration)!;

    if (valueDeclaration.typeParameters?.length) {
      const typenameTypeMap = getGenericsToActualMapFromSignature(signature, expression, this.generator);

      typenameTypeMap.forEach((value, key) => {
        this.generator.symbolTable.currentScope.typeMapper!.register(key, value);
      });
    }

    const thisTypeForMangling = checkIfStaticMethod(valueDeclaration)
      ? this.generator.checker.getTypeAtLocation((expression.expression as ts.PropertyAccessExpression).expression)
      : thisType;

    const { isExternalSymbol, qualifiedName } = FunctionMangler.mangle(
      valueDeclaration,
      expression,
      thisTypeForMangling,
      argumentTypes,
      this.generator
    );

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleCallExpression(expression, qualifiedName, outerEnv);
    }

    if (!valueDeclaration.body) {
      error(`Function body required for '${qualifiedName}'`);
    }

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = thisType && parentScope.thisData ? parentScope.thisData!.llvmType : undefined;

    const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, valueDeclaration, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);
    const args = handledArgs.map((value) => value.value);

    const environmentVariables = getEnvironmentVariablesFromBody(valueDeclaration.body, signature, this.generator);

    const innerScopes = getFunctionScopes(valueDeclaration.body, this.generator);
    for (const innerScope of innerScopes) {
      scope.set(innerScope.name! + "__" + getRandomString(), innerScope);
    }

    const env = createEnvironment(scope, environmentVariables, this.generator, { args, signature }, outerEnv);

    const tsReturnType = getReturnType(expression, this.generator);
    const llvmReturnType = getLLVMReturnType(tsReturnType, expression, this.generator);

    const llvmArgumentTypes = [env.voidStar];
    if (llvmThisType) {
      llvmArgumentTypes.push(llvmThisType);
    }

    const creationResult = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
    let { fn } = creationResult;
    const { existing } = creationResult;

    // All the actual arguments are passing by typeless environment.
    const callArgs = [env.untyped];
    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      const val = this.generator.handleExpression(propertyAccess.expression, env);
      callArgs.push(val);
    }

    if (!existing) {
      this.handleFunctionBody(llvmReturnType, thisType, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope);
    }

    if (handledArgs.some((value) => value.generated)) {
      const type = llvm.FunctionType.get(llvmReturnType, llvmArgumentTypes, false);
      fn = llvm.Function.create(type, llvm.LinkageTypes.ExternalLinkage, qualifiedName, this.generator.module);
      this.handleFunctionBody(llvmReturnType, thisType, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope);
    }

    const callResult = this.generator.xbuilder.createSafeCall(fn, callArgs);

    if (unwrapPointerType(callResult.type).isStructTy()) {
      const name = getLLVMTypename(llvmReturnType);
      const structMeta = this.generator.meta.try(MetaInfoStorage.prototype.getStructMeta, name);
      if (structMeta) {
        callResult.name = createTSObjectName(structMeta.props);
      }
    }

    return callResult;
  }

  private handleCallArguments(
    expression: ts.CallExpression,
    valueDeclaration: ts.FunctionLikeDeclaration,
    signature: ts.Signature,
    scope: Scope,
    outerEnv?: Environment
  ) {
    return expression.arguments
      .map((argument, index) => {
        const value = this.generator.handleExpression(argument, outerEnv);
        const parameterName = signature.getParameters()[index].escapedName.toString();
        scope.set(parameterName, value);
        return { argument, value };
      })
      .map((pair, index) => {
        if (!isTSClosure(pair.value)) {
          return { value: pair.value, generated: false };
        }

        const argumentType = this.generator.checker.getTypeAtLocation(pair.argument);
        if (!argumentType.getSymbol()) {
          return { value: pair.value, generated: false };
        }

        const argumentSymbol = getAliasedSymbolIfNecessary(argumentType.symbol, this.generator.checker);
        const argumentDeclaration = argumentSymbol.declarations[0] as ts.FunctionDeclaration;

        this.generator.meta.registerClosureParameter(
          ts.isPropertyAccessExpression(expression.expression)
            ? expression.expression.name.getText()
            : expression.expression.getText(),
          signature.getParameters()[index].escapedName.toString(),
          argumentDeclaration
        );

        const effectiveArguments = getEffectiveArguments(
          signature.getParameters()[index].escapedName.toString(),
          valueDeclaration.body!,
          this.generator
        );

        return this.handleClosureArgument(
          pair.value,
          pair.argument,
          argumentDeclaration,
          signature,
          effectiveArguments,
          index,
          outerEnv
        );
      });
  }

  private handleClosureArgument(
    value: llvm.Value,
    argument: ts.Expression,
    argumentDeclaration: ts.FunctionDeclaration,
    signature: ts.Signature,
    effectiveArguments: llvm.Value[],
    index: number,
    outerEnv?: Environment
  ) {
    if (argumentDeclaration.parameters.length !== effectiveArguments.length) {
      error(`Expected ${argumentDeclaration.parameters.length} effective arguments, got ${effectiveArguments.length}`);
    }

    let llvmArgTypes: llvm.Type[];
    try {
      llvmArgTypes = argumentDeclaration.parameters
        .map(this.generator.checker.getTypeAtLocation)
        .map((type) => tryResolveGenericTypeIfNecessary(type, this.generator))
        .map((type) => getLLVMType(type, argument, this.generator));
    } catch (e) {
      const fallbackType = this.generator.checker.getTypeAtLocation(signature.declaration!.parameters[index]);
      const fallbackSymbol = getAliasedSymbolIfNecessary(fallbackType.symbol, this.generator.checker);

      llvmArgTypes = (fallbackSymbol.declarations[0] as ts.FunctionDeclaration)!.parameters
        .map(this.generator.checker.getTypeAtLocation)
        .map((type) => tryResolveGenericTypeIfNecessary(type, this.generator))
        .map((type) => getLLVMType(type, argument, this.generator));
    }

    const mismatchArgs: { arg: llvm.Value; llvmArgType: llvm.Type }[] = [];

    effectiveArguments.forEach((arg, argIndex) => {
      const llvmArgType = llvmArgTypes[argIndex];
      if (
        !arg.type.equals(llvmArgType) &&
        !isUnionLLVMType(llvmArgType) &&
        !isUnionLLVMType(arg.type) &&
        !isSimilarStructs(arg.type, llvmArgType)
      ) {
        mismatchArgs.push({ arg, llvmArgType });
      }
    });

    const argumentSignature = this.generator.checker.getSignatureFromDeclaration(argumentDeclaration)!;
    if (mismatchArgs.length > 0) {
      const returnType = getLLVMType(argumentSignature.getReturnType(), argument, this.generator);
      const closure = this.tryCreateMatchingClosure(
        returnType,
        mismatchArgs,
        {
          expression: argument,
          signature: argumentSignature,
          declaration: argumentDeclaration,
        },
        effectiveArguments,
        signature.declaration!.parameters[index].name.getText(),
        outerEnv
      );
      return { value: closure, generated: true };
    } else {
      return { value, generated: false };
    }
  }

  private tryCreateMatchingClosure(
    returnType: llvm.Type,
    mismatchArgs: { arg: llvm.Value; llvmArgType: llvm.Type }[],
    argument: { expression: ts.Expression; signature: ts.Signature; declaration: ts.FunctionLikeDeclaration },
    effectiveArguments: llvm.Value[],
    fnScopeName: string,
    env?: Environment
  ) {
    const returnTypeName = getLLVMTypename(returnType);
    const canGenerateFunction = mismatchArgs.reduce((can, mismatchArg) => {
      if (isUnionLLVMType(mismatchArg.llvmArgType)) {
        return can && true;
      }

      if (can && isIntersectionLLVMType(mismatchArg.arg.type)) {
        const llvmArgName = getLLVMTypename(mismatchArg.llvmArgType);
        if (llvmArgName === returnTypeName) {
          returnType = mismatchArg.arg.type;
        }

        const intersectionType = unwrapPointerType(mismatchArg.arg.type) as llvm.StructType;
        const intersectionTypename = getLLVMTypename(intersectionType);
        const intersectionSubtypeNames = getIntersectionSubtypesNames(intersectionType);

        return intersectionSubtypeNames.includes(llvmArgName) || intersectionTypename.includes(llvmArgName);
      }

      return false;
    }, true);

    if (canGenerateFunction) {
      const environmentVariables = getFunctionEnvironmentVariables(
        argument.expression,
        argument.signature,
        this.generator
      );
      const closureScope = getFunctionDeclarationScope(argument.declaration, undefined, this.generator);
      const closureEnv = createEnvironment(
        closureScope,
        environmentVariables,
        this.generator,
        { args: effectiveArguments, signature: argument.signature },
        env
      );

      const { fn } = createLLVMFunction(returnType, [closureEnv.voidStar], "", this.generator.module);
      this.handleFunctionBody(returnType, undefined, argument.declaration, fn, closureEnv);

      llvm.verifyFunction(fn);
      this.generator.symbolTable.currentScope.overwrite(fnScopeName, fn);

      const functionType = this.generator.checker.getTypeAtLocation(
        ts.isCallExpression(argument.expression) ? argument.expression.expression : argument.expression
      );

      return this.makeClosure(fn, functionType, closureEnv.untyped);
    } else {
      error("Cannot generate function to match effective arguments.");
    }
  }

  private makeClosure(fn: llvm.Function, functionType: ts.Type, env: llvm.Value) {
    const functionDeclaration = functionType.symbol.declarations[0] as ts.FunctionLikeDeclaration;
    return this.generator.builtinTSClosure.createClosure(fn, env, functionDeclaration.parameters.length);
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
      console.log(expression.getText());
      error("Constructor body required");
    }

    const args = expression.arguments?.map((argument) => this.generator.handleExpression(argument, outerEnv)) || [];

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
      [env.voidStar],
      qualifiedName,
      this.generator.module
    );

    if (!existing) {
      this.handleConstructorBody(llvmThisType, constructorDeclaration, constructor, env, initializers);
      setLLVMFunctionScope(constructor, parentScope);
    }

    return this.generator.xbuilder.createSafeCall(constructor, [env.untyped]);
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

    const environmentVariables = getEnvironmentVariablesFromBody(expression.body, signature, this.generator);

    const llvmArgumentTypes = tsArgumentTypes.map((argType) => {
      if (checkIfFunction(argType)) {
        return this.generator.builtinTSClosure.getLLVMType();
      }
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

    let tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    tsReturnType = tryResolveGenericTypeIfNecessary(tsReturnType, this.generator);
    const llvmReturnType = getLLVMReturnType(tsReturnType, expression, this.generator);

    const { fn } = createLLVMFunction(llvmReturnType, [env.voidStar], "", this.generator.module);
    this.handleFunctionBody(llvmReturnType, undefined, expression, fn, env);

    const functionType = this.generator.checker.getTypeAtLocation(expression);
    return this.makeClosure(fn, functionType, env.untyped);
  }

  private withEnvironmentPointerFromArguments<R>(
    action: (env?: Environment) => R,
    args: llvm.Argument[],
    env?: Environment
  ) {
    const sourceEnvironmentPtr = env?.untyped;
    if (env && args.length > 0) {
      env.untyped = args[0];
    }
    const result = action(env);
    if (sourceEnvironmentPtr) {
      env!.untyped = sourceEnvironmentPtr;
    }
    return result;
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
          return this.withEnvironmentPointerFromArguments(
            (environment) => {
              const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", fn);
              this.generator.builder.setInsertionPoint(entryBlock);

              if (thisType) {
                const thisArgIndex = environment ? 1 : 0;
                bodyScope.set("this", fn.getArguments()[thisArgIndex]);
              }

              if (ts.isBlock(declaration.body!) && declaration.body!.statements.length > 0) {
                declaration.body!.forEachChild((node) => {
                  if (ts.isReturnStatement(node) && node.expression) {
                    if (ts.isFunctionExpression(node.expression)) {
                      const closure = this.generator.handleExpression(node.expression, environment);
                      this.generator.xbuilder.createSafeRet(closure);
                      return;
                    }
                  }

                  this.generator.handleNode(node, bodyScope, environment);
                });
              } else if (ts.isBlock(declaration.body!)) {
                // Empty block
                this.generator.builder.createRetVoid();
              } else {
                const blocklessArrowFunctionReturn = this.generator.handleExpression(
                  declaration.body! as ts.Expression,
                  environment
                );

                const currentFn = this.generator.currentFunction;
                const currentFnReturnType = (currentFn.type.elementType as llvm.FunctionType).returnType;
                if (
                  blocklessArrowFunctionReturn.type.isVoidTy() ||
                  (currentFnReturnType.isVoidTy() &&
                    blocklessArrowFunctionReturn.type.isPointerTy() &&
                    blocklessArrowFunctionReturn.type.elementType.isIntegerTy(8))
                ) {
                  this.generator.builder.createRetVoid();
                } else {
                  this.generator.xbuilder.createSafeRet(blocklessArrowFunctionReturn);
                }
              }

              if (!this.generator.isCurrentBlockTerminated) {
                if (llvmReturnType.isVoidTy()) {
                  this.generator.builder.createRetVoid();
                } else {
                  const currentFn = this.generator.currentFunction;
                  const currentFnReturnType = (currentFn.type.elementType as llvm.FunctionType).returnType;

                  // Check if there is switch's default clause terminated by 'return'
                  const currentFunctionBlocks = currentFn.getBasicBlocks();
                  let hasTerminatedSwitchDefaultClause = false;
                  for (const block of currentFunctionBlocks) {
                    if (block.name.startsWith("default")) {
                      hasTerminatedSwitchDefaultClause = Boolean(block.getTerminator());
                    }
                  }

                  if (!this.generator.isCurrentBlockTerminated) {
                    const defaultReturn = this.generator.gc.allocate(unwrapPointerType(currentFnReturnType));

                    /*
                    Every function have implicit 'return undefined' if 'return' is not specified.
                    This makes return type of function to be 'undefined | T' automagically in such a case:

                    function f() {
                      if (smth) {
                        return smth;
                      }
                    }
                    */
                    if (isUnionWithUndefinedLLVMType(currentFnReturnType)) {
                      const marker = this.generator.xbuilder.createSafeInBoundsGEP(defaultReturn, [0, 0]);
                      this.generator.xbuilder.createSafeStore(
                        llvm.ConstantInt.get(this.generator.context, -1, 8),
                        marker
                      );
                    } else if (!hasTerminatedSwitchDefaultClause) {
                      error("No return statement in function returning non-void");
                    }

                    this.generator.xbuilder.createSafeRet(defaultReturn);
                  }
                }
              }
            },
            fn.getArguments(),
            env
          );
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

          bodyEnv = new Environment(env.variables, bodyEnvData, env.type, this.generator);
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

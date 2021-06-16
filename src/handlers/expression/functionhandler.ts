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
  Scope,
  HeapVariableDeclaration,
  Environment,
  ScopeValue,
  createEnvironment,
} from "@scope";
import {
  error,
  checkIfMethod,
  getGenericsToActualMapFromSignature,
  getArgumentTypes,
  InternalNames,
  checkIfStaticMethod,
  storeActualArguments,
  createTSObjectName,
  getAccessorType,
  getRandomString,
  checkIfProperty,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { getDeclarationScope, getLLVMReturnType, getEffectiveArguments, getEnvironmentVariables } from "@handlers";
import { SysVFunctionHandler } from "./functionhandler_sysv";
import { last } from "lodash";
import { Type } from "../../ts/type";
import { LLVMConstant, LLVMConstantInt, LLVMValue } from "../../llvm/value";
import { LLVMStructType, LLVMType } from "../../llvm/type";

export class FunctionHandler extends AbstractExpressionHandler {
  private readonly sysVFunctionHandler: SysVFunctionHandler;

  constructor(generator: LLVMGenerator) {
    super(generator);
    this.sysVFunctionHandler = new SysVFunctionHandler(generator);
  }

  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PropertyAccessExpression:
        switch (getAccessorType(expression, this.generator)) {
          case ts.SyntaxKind.GetAccessor:
            return this.generator.symbolTable.withLocalScope(
              (_) => this.handleGetAccessExpression(expression as ts.PropertyAccessExpression, env),
              this.generator.symbolTable.currentScope,
              InternalNames.FunctionScope
            );
          case ts.SyntaxKind.SetAccessor:
            return this.generator.symbolTable.withLocalScope(
              (_) => this.handleSetAccessExpression(expression as ts.PropertyAccessExpression, env),
              this.generator.symbolTable.currentScope,
              InternalNames.FunctionScope
            );
          default:
            // other property access kinds must be handled in AccessHandler
            error("Unreachable");
        }

      case ts.SyntaxKind.CallExpression:
        const call = expression as ts.CallExpression;
        if (call.expression.kind === ts.SyntaxKind.SuperKeyword) {
          return this.handleSuperCall(call, env);
        }

        if (this.isBindExpression(call)) {
          return this.handleFunctionBind(call, env);
        }

        if (!ts.isIdentifier(call.expression) && !ts.isPropertyAccessExpression(call.expression)) {
          const functionToCall = this.generator.handleExpression(call.expression, env);

          if (functionToCall.type.isPointer() && functionToCall.type.getPointerElementType().isIntegerType(8)) {
            const type = this.generator.ts.checker.getTypeAtLocation(call.expression);
            const valueDeclaration = type.getSymbol().declarations[0] as ts.FunctionLikeDeclaration;
            const signature = this.generator.ts.checker.getResolvedSignature(call);

            const args = this.generator.symbolTable
              .withLocalScope((localScope: Scope) => {
                return this.handleCallArguments(call, valueDeclaration, signature, localScope, env);
              }, this.generator.symbolTable.currentScope)
              .map((value) => value.value);

            const declaredLLVMFunctionType = this.generator.builtinTSClosure.getLLVMType();
            return this.handleTSClosureCall(
              call,
              signature,
              args,
              this.generator.builder.createBitCast(functionToCall, declaredLLVMFunctionType),
              valueDeclaration,
              env
            );
          }
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
              ? this.generator.builder.createSafeExtractValue(env!.typed.getValue(), [objectEnvironmentIndex])
              : this.generator.symbolTable.currentScope.tryGetThroughParentChain(objectName, false);

          if (object) {
            const fieldName =
              call.expression.name.getText() +
              "__" +
              this.generator.ts.checker.getTypeAtLocation(call.expression).toString();

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
                knownValue = this.generator.builder.createSafeExtractValue(object.allocated.getValue(), [fieldIndex]);
              } else if (object instanceof LLVMValue) {
                // ...to extract it out
                knownValue = this.generator.builder.createSafeExtractValue(object.getValue(), [fieldIndex]);
              }
            }
          }
        }

        if (knownValue) {
          if (knownValue instanceof HeapVariableDeclaration) {
            knownValue = knownValue.allocated;
          }

          return this.generator.symbolTable.withLocalScope(
            (_) => this.handleScopeKnownFunction(call, knownValue as ScopeValue, env),
            this.generator.symbolTable.currentScope,
            InternalNames.FunctionScope
          );
        }

        return this.generator.symbolTable.withLocalScope(
          (_) => this.handleCallExpression(call, env),
          this.generator.symbolTable.currentScope,
          InternalNames.FunctionScope
        );
      case ts.SyntaxKind.ArrowFunction:
        return this.generator.symbolTable.withLocalScope(
          (_: Scope) => this.handleArrowFunction(expression as ts.ArrowFunction, env),
          this.generator.symbolTable.currentScope,
          InternalNames.FunctionScope
        );
      case ts.SyntaxKind.NewExpression:
        return this.generator.symbolTable.withLocalScope(
          (_) => this.handleNewExpression(expression as ts.NewExpression, env),
          this.generator.symbolTable.currentScope,
          InternalNames.FunctionScope
        );
      case ts.SyntaxKind.FunctionExpression:
        return this.generator.symbolTable.withLocalScope(
          (_: Scope) => this.handleFunctionExpression(expression as ts.FunctionExpression, env),
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
  ): LLVMValue {
    if (!(knownFunction instanceof LLVMValue)) {
      error(`Expected known function '${expression.getText()}' to be LLVMValue`);
    }

    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = type.getSymbol();

    const valueDeclaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;
    const signature = this.generator.ts.checker.getResolvedSignature(expression);

    if (this.generator.types.lazyClosure.isLazyClosure(knownFunction)) {
      const closureEnv = this.generator.meta.getFunctionEnvironment(valueDeclaration);
      return this.generator.symbolTable.withLocalScope(
        (_) => this.handleCallExpression(expression, closureEnv),
        this.generator.symbolTable.currentScope,
        InternalNames.FunctionScope
      );
    }

    const args = this.generator.symbolTable
      .withLocalScope((localScope: Scope) => {
        return this.handleCallArguments(expression, valueDeclaration, signature!, localScope, outerEnv);
      }, this.generator.symbolTable.currentScope)
      .map((value) => value.value);

    if (this.generator.types.closure.isTSClosure(knownFunction.type)) {
      return this.handleTSClosureCall(expression, signature, args, knownFunction, valueDeclaration, outerEnv);
    }

    if (knownFunction.type.unwrapPointer().isFunction()) {
      return this.generator.builder.createSafeCall(knownFunction, args);
    }

    if (knownFunction.type.isPointer() && knownFunction.type.getPointerElementType().isIntegerType(8)) {
      const declaredLLVMFunctionType = this.generator.builtinTSClosure.getLLVMType();
      return this.handleTSClosureCall(
        expression,
        signature,
        args,
        this.generator.builder.createBitCast(knownFunction, declaredLLVMFunctionType),
        valueDeclaration,
        outerEnv
      );
    }

    error(`Failed to call '${expression.getText()}'`);
  }

  private handleEnvironmentKnownFunction(expression: ts.CallExpression, knownIndex: number, outerEnv: Environment) {
    const ptr = this.generator.builder.createSafeExtractValue(outerEnv.typed.getValue(), [knownIndex]);

    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = type.getSymbol();

    const valueDeclaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;
    const signature = this.generator.ts.checker.getResolvedSignature(expression);

    if (this.generator.types.lazyClosure.isLazyClosure(ptr)) {
      return this.generator.symbolTable.withLocalScope(
        (_) => this.handleCallExpression(expression, outerEnv),
        this.generator.symbolTable.currentScope,
        InternalNames.FunctionScope
      );
    }

    const args = this.generator.symbolTable
      .withLocalScope((localScope: Scope) => {
        return this.handleCallArguments(expression, valueDeclaration, signature!, localScope, outerEnv);
      }, this.generator.symbolTable.currentScope)
      .map((value) => value.value);

    if (ptr.type.unwrapPointer().isFunction()) {
      return this.generator.builder.createSafeCall(ptr, args);
    }

    if (this.generator.types.closure.isOptionalTSClosure(ptr)) {
      const closurePtrPtr = this.generator.builder.createSafeInBoundsGEP(ptr, [0, 1]);
      const closurePtr = this.generator.builder.createLoad(closurePtrPtr);
      return this.handleTSClosureCall(expression, signature, args, closurePtr, valueDeclaration, outerEnv);
    }

    if (this.generator.types.closure.isTSClosure(ptr.type)) {
      return this.handleTSClosureCall(expression, signature, args, ptr, valueDeclaration, outerEnv);
    }

    error(`Function ${expression.expression.getText()} not found in environment`);
  }

  private handleTSClosureCall(
    expression: ts.CallExpression,
    signature: ts.Signature,
    args: LLVMValue[],
    closure: LLVMValue,
    valueDeclaration: ts.FunctionLikeDeclaration | undefined,
    outerEnv?: Environment
  ) {
    const withRestParameters = last(signature.getDeclaration().parameters)?.dotDotDotToken;
    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);

    const tsReturnType = this.generator.ts.checker.getReturnTypeOfSignature(resolvedSignature);
    let llvmReturnType = tsReturnType.getLLVMType();

    const types = withRestParameters
      ? args.map((arg) => arg.type)
      : resolvedSignature.getParameters().map((p) => {
          const tsType = this.generator.ts.checker.getTypeOfSymbolAtLocation(p, expression);
          return tsType.getLLVMType();
        });

    const mismatchArgs: { arg: LLVMValue; llvmArgType: LLVMType }[] = [];

    const adjustedArgs = args.map((arg, index) => {
      const llvmArgType = types[index];
      if (!arg.type.equals(llvmArgType)) {
        if (arg.type.isStructType() && !arg.type.isSameStructs(llvmArgType)) {
          if (this.generator.types.union.isLLVMUnion(llvmArgType)) {
            arg = this.generator.types.union.initialize(llvmArgType, arg);
          } else if (this.generator.types.intersection.isLLVMIntersection(llvmArgType)) {
            arg = this.generator.types.intersection.initialize(llvmArgType, arg);
          }
        }
      }
      return arg;
    });

    adjustedArgs.forEach((arg, argIndex) => {
      const llvmArgType = types[argIndex];
      if (!arg.type.equals(llvmArgType) && arg.type.isStructType() && !arg.type.isSameStructs(llvmArgType)) {
        mismatchArgs.push({ arg, llvmArgType });
      }
    });

    if (mismatchArgs.length > 0) {
      if (!valueDeclaration || !valueDeclaration.body) {
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
        signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration)!;
      }

      const returnTypeName = llvmReturnType.getTypename();
      const canGenerateFunction = mismatchArgs.reduce((can, mismatchArg) => {
        if (this.generator.types.union.isLLVMUnion(mismatchArg.llvmArgType)) {
          return can && true;
        }

        if (can && this.generator.types.intersection.isLLVMIntersection(mismatchArg.arg.type)) {
          const llvmArgName = mismatchArg.llvmArgType.getTypename();
          if (llvmArgName === returnTypeName) {
            llvmReturnType = mismatchArg.arg.type;
          }

          const intersectionType = mismatchArg.arg.type as LLVMStructType;
          const intersectionTypename = intersectionType.getTypename();
          const intersectionSubtypeNames = this.generator.types.intersection.getSubtypesNames(intersectionType);

          return intersectionSubtypeNames.includes(llvmArgName) || intersectionTypename.includes(llvmArgName);
        }

        return false;
      }, true);

      if (canGenerateFunction) {
        if (!outerEnv) {
          error("No environment provided");
        }

        const closureScope = getDeclarationScope(valueDeclaration, undefined, this.generator);

        const environmentVariables = getEnvironmentVariables(
          valueDeclaration.body!,
          signature,
          this.generator,
          closureScope,
          outerEnv
        );

        const e = createEnvironment(
          closureScope,
          environmentVariables,
          this.generator,
          { args: adjustedArgs, signature },
          outerEnv,
          valueDeclaration.body
        );

        const { fn } = this.generator.llvm.function.create(llvmReturnType, [e.voidStar], getRandomString());
        this.handleFunctionBody(llvmReturnType, valueDeclaration, fn, e);
        llvm.verifyFunction(fn.unwrapped as llvm.Function);

        const functionType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
        closure = this.makeClosure(fn, functionType, e);
        const closureCall = this.generator.builtinTSClosure.getLLVMCall();

        if (llvmReturnType.isVoid()) {
          return this.generator.builder.createSafeCall(closureCall, [closure]);
        }

        llvmReturnType = llvmReturnType.isPointer() ? llvmReturnType : llvmReturnType.getPointer();
        const callResult = this.generator.builder.createSafeCall(closureCall, [closure]);

        return this.generator.builder.createBitCast(callResult, llvmReturnType);
      }
    }

    const closureEnvironment = this.generator.meta.try(MetaInfoStorage.prototype.getClosureEnvironment, closure);
    let environmentStructType;
    if (closureEnvironment) {
      environmentStructType = closureEnvironment.type;
    } else {
      environmentStructType = LLVMStructType.get(
        this.generator,
        adjustedArgs.map((a) => a.type)
      ).getPointer();
    }

    const getEnvironment = this.generator.builtinTSClosure.getLLVMGetEnvironment();
    const environment = this.generator.builder.createBitCast(
      this.generator.builder.createSafeCall(getEnvironment, [closure]),
      environmentStructType
    );

    storeActualArguments(adjustedArgs, environment, this.generator, closureEnvironment?.fixedArgsCount);

    const closureCall = this.generator.builtinTSClosure.getLLVMCall();
    if (llvmReturnType.isVoid()) {
      return this.generator.builder.createSafeCall(closureCall, [closure]);
    }

    llvmReturnType = llvmReturnType.isPointer() ? llvmReturnType : llvmReturnType.getPointer();
    const callResult = this.generator.builder.createSafeCall(closureCall, [closure]);

    return this.generator.builder.createBitCast(callResult, llvmReturnType);
  }

  private handleSuperCall(expression: ts.CallExpression, outerEnv?: Environment) {
    const thisType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = thisType.getSymbol();
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

    const argumentTypes = expression.arguments?.map((arg) => this.generator.ts.checker.getTypeAtLocation(arg)) || [];
    const { qualifiedName } = FunctionMangler.mangle(
      constructorDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator
    );

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(constructorDeclaration)!;
    const parentScope = getDeclarationScope(valueDeclaration, thisType, this.generator);
    if (!parentScope.thisData) {
      error("This data required");
    }

    const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, constructorDeclaration, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);
    const args = handledArgs.map((value) => value.value);

    const environmentVariables = getEnvironmentVariables(
      constructorDeclaration.body,
      signature,
      this.generator,
      parentScope
    );

    // Memory to initialization is provided by outer environment. Force its usage by mention it in variables list.
    environmentVariables.push(InternalNames.This);
    const env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv,
      constructorDeclaration.body
    );

    const llvmThisType = parentScope.thisData.llvmType;
    const { fn: constructor, existing } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      [env.voidStar],
      qualifiedName
    );

    if (!existing) {
      this.handleConstructorBody(constructorDeclaration, constructor, env);
      setLLVMFunctionScope(constructor, parentScope, this.generator);
    }

    this.generator.builder.createSafeCall(constructor, [env.untyped]);

    return this.generator.builder.createBitCast(
      this.generator.builder.createSafeInBoundsGEP(env.typed, [env.getVariableIndex(InternalNames.This)]),
      llvmThisType
    );
  }

  private handleArrowFunction(expression: ts.ArrowFunction, outerEnv?: Environment): LLVMValue {
    const type = this.generator.ts.checker.getTypeAtLocation(expression);
    const symbol = type.getSymbol();

    const declaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;
    const signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);

    const parameters = signature.getDeclaration().parameters;

    if (!declaration.typeParameters) {
      this.visitFunctionParameters(parameters);
    }

    const tsArgumentTypes = !declaration.typeParameters
      ? parameters.map((parameter) => {
          return this.generator.ts.checker.getTypeAtLocation(parameter);
        })
      : [];

    const llvmArgumentTypes = tsArgumentTypes.map((argType) => {
      return argType.getLLVMType();
    });

    const scope = getDeclarationScope(expression, undefined, this.generator);
    const environmentVariables = getEnvironmentVariables(expression.body, signature, this.generator, scope, outerEnv);

    // Arrow functions do not bind their own 'this', instead, they inherit the one from the parent scope
    try {
      if (this.generator.symbolTable.get(InternalNames.This)) {
        environmentVariables.push(InternalNames.This);
      }
      // Ignore empty catch block
      // tslint:disable-next-line
    } catch (_) { }

    // these dummy arguments will be substituted by actual arguments once called
    const dummyArguments = llvmArgumentTypes.map((t) =>
      LLVMConstant.createNullValue(t.isPointer() ? t : t.getPointer(), this.generator)
    );

    const env = createEnvironment(
      scope,
      environmentVariables,
      this.generator,
      { args: dummyArguments, signature },
      outerEnv,
      expression.body
    );
    this.generator.meta.registerFunctionEnvironment(expression, env);

    if (
      (declaration.typeParameters ||
        llvmArgumentTypes.some((argType) => this.generator.types.closure.isTSClosure(argType))) &&
      this.generator.types.closure.canCreateLazyClosure(expression)
    ) {
      return this.generator.types.lazyClosure.create;
    }

    const tsReturnType = this.generator.ts.checker.getReturnTypeOfSignature(signature);
    const llvmReturnType = getLLVMReturnType(tsReturnType);

    const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], getRandomString());

    this.handleFunctionBody(llvmReturnType, expression, fn, env);
    llvm.verifyFunction(fn.unwrapped as llvm.Function);

    const functionType = this.generator.ts.checker.getTypeAtLocation(expression);
    return this.makeClosure(fn, functionType, env);
  }

  private handleGetAccessExpression(expression: ts.PropertyAccessExpression, outerEnv?: Environment): LLVMValue {
    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol.declarations.find(ts.isGetAccessorDeclaration);
    if (!valueDeclaration) {
      error("No get accessor declaration found");
    }

    let thisType;
    if (!checkIfStaticMethod(valueDeclaration)) {
      thisType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
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

    const parentScope = getDeclarationScope(
      valueDeclaration,
      this.generator.ts.checker.getTypeAtLocation(expression.expression),
      this.generator
    );

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);

    const environmentVariables = getEnvironmentVariables(
      valueDeclaration.body,
      signature,
      this.generator,
      parentScope,
      outerEnv
    );

    let llvmThisType;
    if (thisType) {
      llvmThisType = parentScope.thisData!.llvmType;

      const thisValue = this.generator.handleExpression(expression.expression, outerEnv);
      if (!parentScope.get(InternalNames.This)) {
        parentScope.set(InternalNames.This, thisValue);
      } else {
        parentScope.overwrite(InternalNames.This, thisValue);
      }

      environmentVariables.push(InternalNames.This);
    }

    const env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      undefined,
      outerEnv,
      valueDeclaration.body
    );

    const tsReturnType = this.generator.ts.checker.getTypeAtLocation(expression);
    const llvmReturnType = getLLVMReturnType(tsReturnType);

    const llvmArgumentTypes = [env.voidStar];
    if (llvmThisType) {
      llvmArgumentTypes.push(llvmThisType);
    }

    const { fn, existing } = this.generator.llvm.function.create(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName + "__getter"
    );

    // All the actual arguments are passing by typeless environment.
    const callArgs = [env.untyped];
    if (llvmThisType) {
      const thisValue = parentScope.get(InternalNames.This);
      if (!(thisValue instanceof LLVMValue)) {
        error("'this' is not an LLVMValue");
      }

      callArgs.push(thisValue);
    }

    if (!existing) {
      this.handleFunctionBody(llvmReturnType, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope, this.generator);
    }

    return this.generator.builder.createSafeCall(fn, callArgs);
  }

  private handleSetAccessExpression(expression: ts.PropertyAccessExpression, outerEnv?: Environment): LLVMValue {
    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol.declarations.find(ts.isSetAccessorDeclaration);
    if (!valueDeclaration) {
      error("No set accessor declaration found");
    }

    let thisType;
    if (!checkIfStaticMethod(valueDeclaration)) {
      thisType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
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

    const parentScope = getDeclarationScope(
      valueDeclaration,
      this.generator.ts.checker.getTypeAtLocation(expression.expression),
      this.generator
    );

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);
    const environmentVariables = getEnvironmentVariables(
      valueDeclaration.body,
      signature,
      this.generator,
      parentScope,
      outerEnv
    );

    let llvmThisType;
    if (thisType) {
      llvmThisType = parentScope.thisData!.llvmType;
      environmentVariables.push(InternalNames.This);
    }

    const parent = expression.parent as ts.BinaryExpression;
    const args = [this.generator.handleExpression(parent.right, outerEnv)];

    const env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv,
      valueDeclaration.body
    );

    const llvmArgumentTypes = [env.voidStar];
    if (llvmThisType) {
      llvmArgumentTypes.push(llvmThisType);

      const thisValue = this.generator.handleExpression(expression.expression, env);
      if (!parentScope.get(InternalNames.This)) {
        parentScope.set(InternalNames.This, thisValue);
      } else {
        parentScope.overwrite(InternalNames.This, thisValue);
      }

      environmentVariables.push(InternalNames.This);
    }

    const llvmReturnType = LLVMType.getVoidType(this.generator);
    const { fn, existing } = this.generator.llvm.function.create(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName + "__setter"
    );

    // All the actual arguments are passing by typeless environment.
    const callArgs = [env.untyped];
    if (llvmThisType) {
      const thisValue = parentScope.get(InternalNames.This);
      if (!(thisValue instanceof LLVMValue)) {
        error("'this' is not an LLVMValue");
      }

      callArgs.push(thisValue);
    }

    if (!existing) {
      this.handleFunctionBody(llvmReturnType, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope, this.generator);
    }

    return this.generator.builder.createSafeCall(fn, callArgs);
  }

  isBindExpression(expression: ts.CallExpression) {
    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = type.getSymbol();
    const valueDeclaration = symbol.declarations[0];

    return (
      ts.isInterfaceDeclaration(valueDeclaration.parent) &&
      valueDeclaration.parent.name?.escapedText === "CallableFunction" &&
      symbol.name === "bind"
    );
  }

  private handleFunctionBind(expression: ts.CallExpression, outerEnv?: Environment) {
    if (!ts.isPropertyAccessExpression(expression.expression)) {
      error("Expected property access expression");
    }

    const argumentTypes = getArgumentTypes(expression, this.generator);

    const bindable = expression.expression.expression;
    const bindableSymbol = this.generator.ts.checker.getTypeAtLocation(bindable).getSymbol();

    let bindableValueDeclaration = bindableSymbol.declarations.find((value: ts.Declaration) => {
      const functionLikeDeclaration = value as ts.FunctionLikeDeclaration;
      return functionLikeDeclaration.parameters.length === argumentTypes.length;
    }) as ts.FunctionLikeDeclaration;

    if (!bindableValueDeclaration) {
      bindableValueDeclaration = bindableSymbol.declarations[0] as ts.FunctionLikeDeclaration;
    }

    if (!bindableValueDeclaration.body) {
      error("No function declaration body found");
    }

    const bindableSignature = this.generator.ts.checker.getSignatureFromDeclaration(
      bindableValueDeclaration as ts.SignatureDeclaration
    )!;

    const thisArg = this.generator.handleExpression(expression.arguments[0], outerEnv);
    const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(
        expression,
        bindableValueDeclaration,
        bindableSignature,
        localScope,
        outerEnv,
        true
      );
    }, this.generator.symbolTable.currentScope);
    const args = handledArgs.map((value) => value.value);

    const environmentVariables = getEnvironmentVariables(
      bindableValueDeclaration.body,
      bindableSignature,
      this.generator,
      this.generator.symbolTable.currentScope,
      outerEnv
    );

    if (!this.generator.symbolTable.currentScope.get(InternalNames.This)) {
      this.generator.symbolTable.currentScope.set(InternalNames.This, thisArg);
    } else {
      this.generator.symbolTable.currentScope.overwrite(InternalNames.This, thisArg);
    }

    const parameters = bindableSignature.getDeclaration().parameters;

    const tsArgumentTypes = !bindableValueDeclaration.typeParameters
      ? parameters.map((parameter) => {
          return this.generator.ts.checker.getTypeAtLocation(parameter);
        })
      : [];

    const llvmArgumentTypes = tsArgumentTypes.map((argType) => {
      return argType.getLLVMType();
    });

    const fixesArgsCount = args.length;

    if (bindableSignature.getParameters().length !== fixesArgsCount) {
      // these dummy arguments will be substituted by actual arguments once called
      const dummyArguments = llvmArgumentTypes
        .slice(fixesArgsCount)
        .map((t) => LLVMConstant.createNullValue(t.isPointer() ? t : t.getPointer(), this.generator));

      args.push(...dummyArguments);
    }

    environmentVariables.push(InternalNames.This);
    const e = createEnvironment(
      this.generator.symbolTable.currentScope,
      environmentVariables,
      this.generator,
      {
        args,
        signature: bindableSignature,
      },
      outerEnv,
      bindableValueDeclaration.body
    );
    e.fixedArgsCount = fixesArgsCount;

    const tsReturnType = this.generator.ts.checker.getReturnTypeOfSignature(bindableSignature);
    const llvmReturnType = getLLVMReturnType(tsReturnType);

    const { fn } = this.generator.llvm.function.create(llvmReturnType, [e.voidStar], getRandomString());

    this.handleFunctionBody(llvmReturnType, bindableValueDeclaration, fn, e);
    llvm.verifyFunction(fn.unwrapped as llvm.Function);

    const functionType = this.generator.ts.checker.getTypeAtLocation(bindable);
    return this.makeClosure(fn, functionType, e);
  }

  private handleCallExpression(expression: ts.CallExpression, outerEnv?: Environment): LLVMValue {
    const argumentTypes = getArgumentTypes(expression, this.generator);
    const isMethod = checkIfMethod(expression.expression, this.generator.ts.checker);
    let thisType;
    if (isMethod) {
      const methodReference = expression.expression as ts.PropertyAccessExpression;
      thisType = this.generator.ts.checker.getTypeAtLocation(methodReference.expression);
    }

    const symbol = this.generator.ts.checker.getTypeAtLocation(expression.expression).getSymbol();
    let valueDeclaration = symbol.declarations.find((value: ts.Declaration) => {
      const functionLikeDeclaration = value as ts.FunctionLikeDeclaration;
      return functionLikeDeclaration.parameters.length === argumentTypes.length;
    }) as ts.FunctionLikeDeclaration;

    if (!valueDeclaration) {
      // For the arrow functions as parameters there is no valueDeclaration, so use first declaration instead
      valueDeclaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(
      valueDeclaration as ts.SignatureDeclaration
    );

    if (valueDeclaration.typeParameters) {
      const typenameTypeMap = getGenericsToActualMapFromSignature(signature, expression, this.generator);

      typenameTypeMap.forEach((value, key) => {
        this.generator.symbolTable.currentScope.typeMapper.register(key, value);
      });
    }

    const thisTypeForMangling = checkIfStaticMethod(valueDeclaration)
      ? this.generator.ts.checker.getTypeAtLocation((expression.expression as ts.PropertyAccessExpression).expression)
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

    if (ts.isPropertyAccessExpression(expression.expression)) {
      const propertySymbol = this.generator.ts.checker.getSymbolAtLocation(expression.expression.name);

      const isProperty = checkIfProperty(propertySymbol);
      if (isProperty) {
        const callable = this.generator.handleExpression(expression.expression, outerEnv);

        if (this.generator.types.closure.isTSClosure(callable.type)) {
          const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
            return this.handleCallArguments(expression, valueDeclaration, signature, localScope, outerEnv);
          }, this.generator.symbolTable.currentScope);
          const args = handledArgs.map((value) => value.value);

          return this.handleTSClosureCall(expression, signature, args, callable, undefined, outerEnv);
        }

        error(`Unhandled call '${expression.getText()}'`);
      }
    }

    if (!valueDeclaration.body) {
      error(`Function body required for '${qualifiedName}'`);
    }

    const parentScope = getDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = parentScope.thisData?.llvmType;

    const environmentVariables = getEnvironmentVariables(
      valueDeclaration.body,
      signature,
      this.generator,
      parentScope,
      outerEnv
    );

    let thisVal;
    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      thisVal = this.generator.handleExpression(propertyAccess.expression, outerEnv);
      thisVal = thisVal.adjustToType(llvmThisType!);
    }

    const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, valueDeclaration, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);
    const args = handledArgs.map((value) => value.value);

    if (thisVal) {
      if (!parentScope.get(InternalNames.This)) {
        parentScope.set(InternalNames.This, thisVal);
      } else {
        parentScope.overwrite(InternalNames.This, thisVal);
      }

      environmentVariables.push(InternalNames.This);
    }

    let env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv,
      valueDeclaration.body,
      isMethod
    );

    if (args.some((arg) => this.generator.types.closure.isTSClosure(arg.type))) {
      const indexesOfClosureArguments = args.reduce((indexes, arg, index) => {
        if (this.generator.types.closure.isTSClosure(arg.type)) {
          indexes.push(index);
        }
        return indexes;
      }, new Array<number>());

      const closureArgumentsEnvironments = indexesOfClosureArguments.reduce((envs, index) => {
        const argumentDeclaration = this.generator.meta.getClosureParameterDeclaration(
          expression.expression.getText(),
          signature.getParameters()[index].escapedName.toString()
        );

        // Happily ignore failures here, argument is likely a closure returned from other function, it has no any declarations
        const closureEnv = this.generator.meta.try(
          MetaInfoStorage.prototype.getFunctionEnvironment,
          argumentDeclaration
        );
        if (closureEnv) {
          envs.push(closureEnv);
        }

        return envs;
      }, new Array<Environment>());

      env = Environment.merge(env, closureArgumentsEnvironments, this.generator);
    }

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);
    const tsReturnType = this.generator.ts.checker.getReturnTypeOfSignature(resolvedSignature);
    const llvmReturnType = getLLVMReturnType(tsReturnType);

    const llvmArgumentTypes = [env.voidStar];
    if (llvmThisType) {
      llvmArgumentTypes.push(llvmThisType);
    }

    const creationResult = this.generator.llvm.function.create(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName + (checkIfStaticMethod(valueDeclaration) ? "__static" : "")
    );
    let { fn } = creationResult;
    const { existing } = creationResult;

    // All the actual arguments are passing by typeless environment.
    const callArgs = [env.untyped];
    if (thisVal) {
      callArgs.push(thisVal);
    }

    if (!existing) {
      this.handleFunctionBody(llvmReturnType, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope, this.generator);
    }

    if (handledArgs.some((value) => value.generated)) {
      fn = this.generator.llvm.function.create(
        llvmReturnType,
        llvmArgumentTypes,
        qualifiedName + (checkIfStaticMethod(valueDeclaration) ? "__static" : "")
      ).fn;
      this.handleFunctionBody(llvmReturnType, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope, this.generator);
    }

    const callResult = this.generator.builder.createSafeCall(fn, callArgs);

    if (callResult.type.unwrapPointer().isStructType()) {
      const name = llvmReturnType.getTypename();
      const structMeta = this.generator.meta.try(MetaInfoStorage.prototype.getStructMeta, name);
      if (structMeta) {
        callResult.name = createTSObjectName(structMeta.props);
      }
    }

    return callResult;
  }

  private handleCallArguments(
    expression: ts.CallExpression | ts.NewExpression,
    valueDeclaration: ts.FunctionLikeDeclaration,
    signature: ts.Signature,
    scope: Scope,
    outerEnv?: Environment,
    contextThis?: boolean
  ) {
    if (!expression.arguments) {
      return [];
    }

    const args = contextThis ? expression.arguments.slice(1) : Array.from(expression.arguments);

    return args
      .map((argument, index) => {
        const value = this.generator.handleExpression(argument, outerEnv);
        const parameterName = signature.getParameters()[index].escapedName.toString();
        scope.set(parameterName, value);
        return { argument, value };
      })
      .map((pair, index) => {
        if (!this.generator.types.closure.isTSClosure(pair.value.type)) {
          return { value: pair.value, generated: false };
        }

        const argumentType = this.generator.ts.checker.getTypeAtLocation(pair.argument);
        const argumentSymbol = argumentType.getSymbol();
        const argumentDeclaration = argumentSymbol.declarations[0] as ts.FunctionDeclaration;

        this.generator.meta.registerClosureParameter(
          expression.expression.getText(),
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
          index
        );
      });
  }

  private handleClosureArgument(
    value: LLVMValue,
    argument: ts.Expression,
    argumentDeclaration: ts.FunctionDeclaration,
    signature: ts.Signature,
    effectiveArguments: LLVMValue[],
    index: number
  ) {
    if (argumentDeclaration.parameters.length !== effectiveArguments.length) {
      error(`Expected ${argumentDeclaration.parameters.length} effective arguments, got ${effectiveArguments.length}`);
    }

    let llvmArgTypes: LLVMType[];
    try {
      llvmArgTypes = argumentDeclaration.parameters
        .map((arg) => this.generator.ts.checker.getTypeAtLocation(arg))
        .map((type) => type.getLLVMType());
    } catch (e) {
      const fallbackType = this.generator.ts.checker.getTypeAtLocation(signature.declaration!.parameters[index]);
      const fallbackSymbol = fallbackType.getSymbol();

      llvmArgTypes = (fallbackSymbol.declarations[0] as ts.FunctionDeclaration)!.parameters
        .map((arg) => this.generator.ts.checker.getTypeAtLocation(arg))
        .map((type) => type.getLLVMType());
    }

    const mismatchArgs: { arg: LLVMValue; llvmArgType: LLVMType }[] = [];

    effectiveArguments.forEach((arg, argIndex) => {
      const llvmArgType = llvmArgTypes[argIndex];
      if (
        !arg.type.equals(llvmArgType) &&
        !this.generator.types.union.isLLVMUnion(llvmArgType) &&
        !this.generator.types.union.isLLVMUnion(arg.type) &&
        arg.type.isStructType() &&
        !arg.type.isSameStructs(llvmArgType)
      ) {
        mismatchArgs.push({ arg, llvmArgType });
      }
    });

    const argumentSignature = this.generator.ts.checker.getSignatureFromDeclaration(argumentDeclaration)!;
    if (mismatchArgs.length > 0) {
      const tsReturnType = this.generator.ts.checker.getReturnTypeOfSignature(argumentSignature);
      const returnType = tsReturnType.getLLVMType();
      const closure = this.tryCreateMatchingClosure(
        returnType,
        mismatchArgs,
        {
          expression: argument,
          signature: argumentSignature,
          declaration: argumentDeclaration,
        },
        effectiveArguments,
        signature.declaration!.parameters[index].name.getText()
      );
      return { value: closure, generated: true };
    } else {
      return { value, generated: false };
    }
  }

  private tryCreateMatchingClosure(
    returnType: LLVMType,
    mismatchArgs: { arg: LLVMValue; llvmArgType: LLVMType }[],
    argument: { expression: ts.Expression; signature: ts.Signature; declaration: ts.FunctionLikeDeclaration },
    effectiveArguments: LLVMValue[],
    fnScopeName: string
  ) {
    const returnTypeName = returnType.getTypename();
    const canGenerateFunction = mismatchArgs.reduce((can, mismatchArg) => {
      if (this.generator.types.union.isLLVMUnion(mismatchArg.llvmArgType)) {
        return can && true;
      }

      if (can && this.generator.types.intersection.isLLVMIntersection(mismatchArg.arg.type)) {
        const llvmArgName = mismatchArg.llvmArgType.getTypename();
        if (llvmArgName === returnTypeName) {
          returnType = mismatchArg.arg.type;
        }

        const intersectionType = mismatchArg.arg.type.unwrapPointer() as LLVMStructType;
        const intersectionTypename = intersectionType.getTypename();
        const intersectionSubtypeNames = this.generator.types.intersection.getSubtypesNames(intersectionType);

        return intersectionSubtypeNames.includes(llvmArgName) || intersectionTypename.includes(llvmArgName);
      }

      return false;
    }, true);

    if (canGenerateFunction) {
      const closureEnv = this.generator.meta.getFunctionEnvironment(argument.declaration);

      const generatedEnvironmentValues = effectiveArguments;
      const closureEnvironmentStructType = closureEnv.type as LLVMStructType;
      const closureEnvironmentValue = this.generator.builder.createLoad(closureEnv.typed);

      for (let i = effectiveArguments.length; i < closureEnvironmentStructType.numElements; ++i) {
        const value = this.generator.builder.createSafeExtractValue(closureEnvironmentValue, [i]);
        generatedEnvironmentValues.push(value);
      }

      const generatedEnvironmentType = LLVMStructType.get(
        this.generator,
        generatedEnvironmentValues.map((v) => v.type)
      );
      const generatedEnvironmentAllocated = this.generator.gc.allocate(generatedEnvironmentType);

      for (let i = 0; i < generatedEnvironmentValues.length; ++i) {
        const elementPtr = this.generator.builder.createSafeInBoundsGEP(generatedEnvironmentAllocated, [0, i]);
        this.generator.builder.createSafeStore(generatedEnvironmentValues[i], elementPtr);
      }

      const generatedEnvironment = new Environment(
        closureEnv.variables,
        this.generator.builder.asVoidStar(generatedEnvironmentAllocated),
        generatedEnvironmentAllocated.type,
        this.generator
      );
      this.generator.meta.registerFunctionEnvironment(argument.declaration, generatedEnvironment);

      const { fn } = this.generator.llvm.function.create(
        returnType,
        [generatedEnvironment.voidStar],
        getRandomString()
      );
      this.handleFunctionBody(returnType, argument.declaration, fn, generatedEnvironment);

      llvm.verifyFunction(fn.unwrapped as llvm.Function);
      this.generator.symbolTable.currentScope.overwrite(fnScopeName, fn);

      const functionType = this.generator.ts.checker.getTypeAtLocation(
        ts.isCallExpression(argument.expression) ? argument.expression.expression : argument.expression
      );

      return this.makeClosure(fn, functionType, generatedEnvironment);
    } else {
      error("Cannot generate function to match effective arguments.");
    }
  }

  private makeClosure(fn: LLVMValue, functionType: Type, env: Environment) {
    const functionDeclaration = functionType.getSymbol().declarations[0] as ts.FunctionLikeDeclaration;
    const closure = this.generator.builtinTSClosure.createClosure(
      fn,
      env.untyped,
      functionDeclaration.parameters.length
    );
    this.generator.meta.registerClosureEnvironment(closure, env);
    return closure;
  }

  private handleNewExpression(expression: ts.NewExpression, outerEnv?: Environment): LLVMValue {
    const thisType = this.generator.ts.checker.getTypeAtLocation(expression);
    const symbol = thisType.getSymbol();
    const classDeclaration = symbol.valueDeclaration;

    if (!ts.isClassDeclaration(classDeclaration)) {
      error("Expected class declaration");
    }

    const constructorDeclaration = classDeclaration.members.find(ts.isConstructorDeclaration);
    if (!constructorDeclaration) {
      // unreachable if source is preprocessed correctly
      error(`No constructor provided: ${expression.getText()}`);
    }

    if (!thisType.isDeclared()) {
      addClassScope(expression, this.generator.symbolTable.currentScope, this.generator);
    }

    const argumentTypes = expression.arguments?.map((arg) => this.generator.ts.checker.getTypeAtLocation(arg)) || [];

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
      error(`Constructor body required at '${expression.getText()}'`);
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(constructorDeclaration);
    const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, constructorDeclaration, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);
    const args = handledArgs.map((value) => value.value);

    const parentScope = getDeclarationScope(classDeclaration, thisType, this.generator);
    if (!parentScope.thisData) {
      error("ThisData required");
    }

    const environmentVariables = getEnvironmentVariables(
      constructorDeclaration.body,
      signature,
      this.generator,
      parentScope,
      outerEnv
    );

    const llvmThisType = parentScope.thisData.llvmType;
    const thisValue = this.generator.gc.allocate(llvmThisType.getPointerElementType());

    const oldThis = parentScope.get(InternalNames.This);
    if (oldThis) {
      parentScope.overwrite(InternalNames.This, thisValue);
    } else {
      parentScope.set(InternalNames.This, thisValue);
    }

    environmentVariables.push(InternalNames.This);

    const env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv,
      constructorDeclaration.body,
      /* prefer local this = */ true
    );

    const { fn: constructor, existing } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      [env.voidStar],
      qualifiedName
    );

    if (!existing) {
      this.handleConstructorBody(constructorDeclaration, constructor, env);
      setLLVMFunctionScope(constructor, parentScope, this.generator);
    }

    this.generator.builder.createSafeCall(constructor, [env.untyped]);

    return thisValue;
  }

  private handleFunctionExpression(expression: ts.FunctionExpression, outerEnv?: Environment) {
    const type = this.generator.ts.checker.getTypeAtLocation(expression);
    const symbol = type.getSymbol();
    const declaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);
    const parameters = signature.getDeclaration().parameters;

    if (!declaration.typeParameters) {
      this.visitFunctionParameters(parameters);
    }

    const tsArgumentTypes = !declaration.typeParameters
      ? parameters.map((parameter) => this.generator.ts.checker.getTypeAtLocation(parameter))
      : [];

    const llvmArgumentTypes = tsArgumentTypes.map((argType) => {
      return argType.getLLVMType();
    });

    const scope = getDeclarationScope(declaration, undefined, this.generator);

    // @todo: 'this' is bindable by 'bind', 'call', 'apply' so it should be stored somewhere
    const environmentVariables = getEnvironmentVariables(expression.body, signature, this.generator, scope, outerEnv);

    // these dummy arguments will be substituted by actual arguments once called
    const dummyArguments = llvmArgumentTypes.map((t) =>
      LLVMConstant.createNullValue(t.isPointer() ? t : t.getPointer(), this.generator)
    );

    const env = createEnvironment(
      scope,
      environmentVariables,
      this.generator,
      {
        args: dummyArguments,
        signature,
      },
      outerEnv,
      expression.body
    );
    this.generator.meta.registerFunctionEnvironment(expression, env);

    if (
      (declaration.typeParameters ||
        llvmArgumentTypes.some((argType) => this.generator.types.closure.isTSClosure(argType))) &&
      this.generator.types.closure.canCreateLazyClosure(expression)
    ) {
      return this.generator.types.lazyClosure.create;
    }

    const tsReturnType = this.generator.ts.checker.getReturnTypeOfSignature(signature);
    const llvmReturnType = getLLVMReturnType(tsReturnType);

    const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], getRandomString());

    this.handleFunctionBody(llvmReturnType, expression, fn, env);
    llvm.verifyFunction(fn.unwrapped as llvm.Function);

    const functionType = this.generator.ts.checker.getTypeAtLocation(expression);
    return this.makeClosure(fn, functionType, env);
  }

  private withEnvironmentPointerFromArguments<R>(
    action: (env?: Environment) => R,
    args: LLVMValue[],
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
    llvmReturnType: LLVMType,
    declaration: ts.FunctionLikeDeclaration,
    fn: LLVMValue,
    env?: Environment
  ) {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope(
        (bodyScope) => {
          return this.withEnvironmentPointerFromArguments(
            (environment) => {
              const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", fn.unwrapped as llvm.Function);
              this.generator.builder.setInsertionPoint(entryBlock);

              if (ts.isBlock(declaration.body!) && declaration.body!.statements.length > 0) {
                declaration.body!.forEachChild((node) => {
                  if (ts.isReturnStatement(node) && node.expression) {
                    if (ts.isFunctionExpression(node.expression)) {
                      const closure = this.generator.handleExpression(node.expression, environment);
                      this.generator.builder.createSafeRet(closure);
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

                if (
                  blocklessArrowFunctionReturn.type.isVoid() ||
                  (this.generator.currentFunction.type.elementType.returnType.isVoidTy() &&
                    blocklessArrowFunctionReturn.type.isPointer() &&
                    blocklessArrowFunctionReturn.type.getPointerElementType().isIntegerType(8))
                ) {
                  this.generator.builder.createRetVoid();
                } else {
                  this.generator.builder.createSafeRet(blocklessArrowFunctionReturn);
                }
              }

              if (!this.generator.isCurrentBlockTerminated) {
                if (llvmReturnType.isVoid()) {
                  this.generator.builder.createRetVoid();
                } else {
                  const currentFnReturnType = LLVMType.make(
                    this.generator.currentFunction.type.elementType.returnType,
                    this.generator
                  );

                  // Check if there is switch's default clause terminated by 'return'
                  const currentFunctionBlocks = this.generator.currentFunction.getBasicBlocks();
                  let hasTerminatedSwitchDefaultClause = false;
                  for (const block of currentFunctionBlocks) {
                    if (block.name.startsWith("default")) {
                      hasTerminatedSwitchDefaultClause = Boolean(block.getTerminator());
                    }
                  }

                  if (!this.generator.isCurrentBlockTerminated) {
                    const defaultReturn = this.generator.gc.allocate(currentFnReturnType.unwrapPointer());

                    /*
                    Every function have implicit 'return undefined' if 'return' is not specified.
                    This makes return type of function to be 'undefined | T' automagically in such a case:

                    function f() {
                      if (smth) {
                        return smth;
                      }
                    }
                    */
                    if (this.generator.types.union.isUnionWithUndefined(currentFnReturnType)) {
                      const marker = this.generator.builder.createSafeInBoundsGEP(defaultReturn, [0, 0]);
                      this.generator.builder.createSafeStore(LLVMConstantInt.get(this.generator, -1, 8), marker);
                    } else if (!hasTerminatedSwitchDefaultClause) {
                      error("No return statement in function returning non-void");
                    }

                    this.generator.builder.createSafeRet(defaultReturn);
                  }
                }
              }
            },
            (fn.unwrapped as llvm.Function)
              .getArguments()
              .map((argument) => LLVMValue.create(argument, this.generator)),
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
    constructorDeclaration: ts.FunctionLikeDeclaration,
    constructor: LLVMValue,
    env: Environment
  ): void {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope((bodyScope) => {
        return this.withEnvironmentPointerFromArguments(
          (environment) => {
            const entryBlock = llvm.BasicBlock.create(
              this.generator.context,
              "entry",
              constructor.unwrapped as llvm.Function
            );
            this.generator.builder.setInsertionPoint(entryBlock);

            constructorDeclaration.body!.forEachChild((node) =>
              this.generator.handleNode(node, bodyScope, environment)
            );

            this.generator.builder.createRetVoid();
          },
          (constructor.unwrapped as llvm.Function)
            .getArguments()
            .map((argument) => LLVMValue.create(argument, this.generator)),
          env
        );
      }, this.generator.symbolTable.currentScope);
    });
  }

  private visitFunctionParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>) {
    parameters.forEach((parameter) => {
      addClassScope(parameter, this.generator.symbolTable.globalScope, this.generator);
    });
  }
}

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

import { LLVMGenerator, MetaInfoStorage } from "../../generator";
import { FunctionMangler } from "../../mangling";
import {
  setLLVMFunctionScope,
  addClassScope,
  Scope,
  HeapVariableDeclaration,
  Environment,
  ScopeValue,
  createEnvironment,
} from "../../scope";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { SysVFunctionHandler } from "./functionhandler_sysv";
import { last } from "lodash";
import { TSType } from "../../ts/type";
import {
  LLVMConstant,
  LLVMConstantInt,
  LLVMGlobalVariable,
  LLVMIntersection,
  LLVMUnion,
  LLVMValue,
} from "../../llvm/value";
import { LLVMArrayType, LLVMStructType, LLVMType } from "../../llvm/type";
import { ConciseBody } from "../../ts/concisebody";
import { Declaration } from "../../ts/declaration";
import { Expression } from "../../ts/expression";
import { Signature } from "../../ts/signature";
import { TSSymbol } from "../../ts/symbol";

export class FunctionHandler extends AbstractExpressionHandler {
  private readonly sysVFunctionHandler: SysVFunctionHandler;

  constructor(generator: LLVMGenerator) {
    super(generator);
    this.sysVFunctionHandler = new SysVFunctionHandler(generator);
  }

  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PropertyAccessExpression:
        switch (Expression.create(expression, this.generator).getAccessorType()) {
          case ts.SyntaxKind.GetAccessor:
            return this.generator.symbolTable.withLocalScope(
              (_) => this.handleGetAccessExpression(expression as ts.PropertyAccessExpression, env),
              this.generator.symbolTable.currentScope,
              this.generator.internalNames.FunctionScope
            );
          case ts.SyntaxKind.SetAccessor:
            return this.generator.symbolTable.withLocalScope(
              (_) => this.handleSetAccessExpression(expression as ts.PropertyAccessExpression, env),
              this.generator.symbolTable.currentScope,
              this.generator.internalNames.FunctionScope
            );
          default:
            // other property access kinds must be handled in AccessHandler
            throw new Error("Unreachable");
        }

      case ts.SyntaxKind.CallExpression:
        const call = expression as ts.CallExpression;
        if (call.expression.kind === ts.SyntaxKind.SuperKeyword) {
          return this.handleSuperCall(expression as ts.SuperCall, env);
        }

        if (this.isBindExpression(call)) {
          return this.handleFunctionBind(call, env);
        }

        if (!ts.isIdentifier(call.expression) && !ts.isPropertyAccessExpression(call.expression)) {
          const functionToCall = this.generator.handleExpression(call.expression, env);

          const type = this.generator.ts.checker.getTypeAtLocation(call.expression);
          const valueDeclaration = type.getSymbol().declarations[0];
          const signature = this.generator.ts.checker.getResolvedSignature(call);

          const args = this.generator.symbolTable
            .withLocalScope((localScope: Scope) => {
              return this.handleCallArguments(call, valueDeclaration, signature, localScope, env);
            }, this.generator.symbolTable.currentScope)
            .map((value) => value.value);

          const declaredLLVMFunctionType = this.generator.tsclosure.getLLVMType();
          return this.handleTSClosureCall(
            call,
            signature,
            args,
            this.generator.builder.createBitCast(functionToCall, declaredLLVMFunctionType),
            valueDeclaration,
            env
          );
        }

        const functionName = call.expression.getText();

        if (env) {
          const knownIndex = env.getVariableIndex(functionName);
          if (knownIndex > -1) {
            // Function or closure is defined in current environment. Likely it is a funarg.
            return this.handleEnvironmentKnownFunction(call, knownIndex, env);
          }
        }

        let knownValue = this.generator.symbolTable.currentScope.tryGetThroughParentChain(functionName);

        if (knownValue) {
          if (knownValue instanceof HeapVariableDeclaration) {
            knownValue = knownValue.allocated;
          }

          return this.generator.symbolTable.withLocalScope(
            (_) => this.handleScopeKnownFunction(call, knownValue as ScopeValue, env),
            this.generator.symbolTable.currentScope,
            this.generator.internalNames.FunctionScope
          );
        }

        return this.generator.symbolTable.withLocalScope(
          (_) => this.handleCallExpression(call, env),
          this.generator.symbolTable.currentScope,
          this.generator.internalNames.FunctionScope
        );
      case ts.SyntaxKind.ArrowFunction:
        return this.generator.symbolTable.withLocalScope(
          (_: Scope) => this.handleArrowFunction(expression as ts.ArrowFunction, env),
          this.generator.symbolTable.currentScope,
          this.generator.internalNames.FunctionScope
        );
      case ts.SyntaxKind.NewExpression:
        return this.generator.symbolTable.withLocalScope(
          (_) => this.handleNewExpression(expression as ts.NewExpression, env),
          this.generator.symbolTable.currentScope,
          this.generator.internalNames.FunctionScope
        );
      case ts.SyntaxKind.FunctionExpression:
        return this.generator.symbolTable.withLocalScope(
          (_: Scope) => this.handleFunctionExpression(expression as ts.FunctionExpression, env),
          this.generator.symbolTable.currentScope,
          this.generator.internalNames.FunctionScope
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
      throw new Error(`Expected known function '${expression.getText()}' to be LLVMValue`);
    }

    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = type.getSymbol();

    const valueDeclaration = symbol.declarations[0];
    const signature = this.generator.ts.checker.getResolvedSignature(expression);

    if (this.generator.tsclosure.lazyClosure.isLazyClosure(knownFunction)) {
      let closureEnv = this.generator.meta.getFunctionEnvironment(valueDeclaration);
      const lazyClosureEnvironment = this.generator.builder.createLoad(
        this.generator.builder.createSafeInBoundsGEP(knownFunction, [0, 0])
      );
      closureEnv.untyped = lazyClosureEnvironment;

      if (outerEnv) {
        closureEnv = Environment.merge(closureEnv, [outerEnv], this.generator);
      }

      return this.generator.symbolTable.withLocalScope(
        (_) => this.handleCallExpression(expression, closureEnv),
        this.generator.symbolTable.currentScope,
        this.generator.internalNames.FunctionScope
      );
    }

    const args = this.generator.symbolTable
      .withLocalScope((localScope: Scope) => {
        return this.handleCallArguments(expression, valueDeclaration, signature!, localScope, outerEnv);
      }, this.generator.symbolTable.currentScope)
      .map((value) => value.value);

    if (knownFunction.type.isClosure()) {
      return this.handleTSClosureCall(expression, signature, args, knownFunction, valueDeclaration, outerEnv);
    }

    if (knownFunction.type.unwrapPointer().isFunction()) {
      return this.generator.builder.createSafeCall(knownFunction, args);
    }

    if (knownFunction.type.isPointer() && knownFunction.type.getPointerElementType().isIntegerType(8)) {
      const declaredLLVMFunctionType = this.generator.tsclosure.getLLVMType();
      return this.handleTSClosureCall(
        expression,
        signature,
        args,
        this.generator.builder.createBitCast(knownFunction, declaredLLVMFunctionType),
        valueDeclaration,
        outerEnv
      );
    }

    throw new Error(`Failed to call '${expression.getText()}'`);
  }

  private handleEnvironmentKnownFunction(expression: ts.CallExpression, knownIndex: number, outerEnv: Environment) {
    const ptr = this.generator.builder.createSafeExtractValue(outerEnv.typed.getValue(), [knownIndex]);

    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = type.getSymbol();

    const valueDeclaration = symbol.declarations[0];
    const signature = this.generator.ts.checker.getResolvedSignature(expression);

    if (this.generator.tsclosure.lazyClosure.isLazyClosure(ptr)) {
      let closureEnv = this.generator.meta.getFunctionEnvironment(valueDeclaration);
      const lazyClosureEnvironment = this.generator.builder.createLoad(
        this.generator.builder.createSafeInBoundsGEP(ptr, [0, 0])
      );
      closureEnv.untyped = lazyClosureEnvironment;

      if (outerEnv) {
        closureEnv = Environment.merge(closureEnv, [outerEnv], this.generator);
      }

      return this.generator.symbolTable.withLocalScope(
        (_) => this.handleCallExpression(expression, closureEnv),
        this.generator.symbolTable.currentScope,
        this.generator.internalNames.FunctionScope
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

    if (ptr.isOptionalClosure()) {
      const closurePtrPtr = this.generator.builder.createSafeInBoundsGEP(ptr, [0, 1]);
      const closurePtr = this.generator.builder.createLoad(closurePtrPtr);
      return this.handleTSClosureCall(expression, signature, args, closurePtr, valueDeclaration, outerEnv);
    }

    if (ptr.type.isClosure()) {
      return this.handleTSClosureCall(expression, signature, args, ptr, valueDeclaration, outerEnv);
    }

    throw new Error(`Function ${expression.expression.getText()} not found in environment`);
  }

  private storeActualArguments(args: LLVMValue[], closureFunctionData: LLVMValue, fixedArgsCount?: number) {
    // Closure data consists of null-valued arguments. Replace dummy arguments with actual ones.
    for (let i = 0; i < args.length; ++i) {
      const elementPtrPtr = this.generator.builder.createSafeInBoundsGEP(closureFunctionData, [
        0,
        i + (fixedArgsCount || 0),
      ]);

      const elementPtrType = elementPtrPtr.type.getPointerElementType();
      let argument = args[i];

      if (!argument.type.equals(elementPtrType)) {
        argument = argument.adjustToType(elementPtrType);
      }

      this.generator.builder.createSafeStore(argument, elementPtrPtr);
    }
  }

  private handleTSClosureCall(
    expression: ts.CallExpression,
    signature: Signature,
    args: LLVMValue[],
    closure: LLVMValue,
    valueDeclaration: Declaration | undefined,
    outerEnv?: Environment
  ) {
    const withRestParameters = last(signature.getDeclaredParameters())?.dotDotDotToken;
    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);

    const tsReturnType = resolvedSignature.getReturnType();
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
        if (llvmArgType.isUnion()) {
          const nullUnion = LLVMUnion.createNullValue(llvmArgType, this.generator);
          arg = nullUnion.initialize(arg);
        } else if (llvmArgType.isIntersection()) {
          const nullIntersection = LLVMIntersection.createNullValue(llvmArgType, this.generator);
          arg = nullIntersection.initialize(arg);
        }
      }
      return arg;
    });

    adjustedArgs.forEach((arg, argIndex) => {
      const llvmArgType = types[argIndex];
      const argTypeUnwrapped = arg.type.unwrapPointer();
      if (
        !arg.type.equals(llvmArgType) &&
        argTypeUnwrapped.isStructType() &&
        !argTypeUnwrapped.isSameStructs(llvmArgType)
      ) {
        mismatchArgs.push({ arg, llvmArgType });
      }
    });

    if (mismatchArgs.length > 0) {
      if (!valueDeclaration || !valueDeclaration.isFunctionLike() || !valueDeclaration.body) {
        let parentFunction = expression.parent;

        if (!parentFunction) {
          throw new Error("Unreachable");
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
          throw new Error("Unreachable");
        }

        if (!parentFunction.name) {
          throw new Error(`Function name required at\n${parentFunction.getText()}`);
        }

        valueDeclaration = this.generator.meta.getClosureParameterDeclaration(
          parentFunction.name.getText(),
          expression.expression.getText()
        );
        signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration)!;
      }

      const returnTypeName = llvmReturnType.getTypename();
      const canGenerateFunction = mismatchArgs.reduce((can, mismatchArg) => {
        if (mismatchArg.llvmArgType.isUnion()) {
          return can && true;
        }

        if (can && mismatchArg.arg.type.isIntersection()) {
          const llvmArgName = mismatchArg.llvmArgType.getTypename();
          if (llvmArgName === returnTypeName) {
            llvmReturnType = mismatchArg.arg.type;
          }

          const intersectionType = mismatchArg.arg.type as LLVMStructType;
          const intersectionTypename = intersectionType.getTypename();
          const intersectionSubtypeNames = intersectionType.getSubtypesNames();

          return intersectionSubtypeNames.includes(llvmArgName) || intersectionTypename.includes(llvmArgName);
        }

        return false;
      }, true);

      if (canGenerateFunction) {
        if (!outerEnv) {
          throw new Error("No environment provided");
        }

        const closureScope = valueDeclaration.getScope(undefined);

        const environmentVariables = ConciseBody.create(valueDeclaration.body!, this.generator).getEnvironmentVariables(
          signature,
          closureScope,
          outerEnv
        );

        const e = createEnvironment(
          closureScope,
          environmentVariables,
          this.generator,
          { args: adjustedArgs, signature },
          outerEnv,
          valueDeclaration.body,
          undefined,
          outerEnv.thisPrototype
        );

        const { fn } = this.generator.llvm.function.create(llvmReturnType, [e.voidStar], this.generator.randomString);
        this.handleFunctionBody(llvmReturnType, valueDeclaration, fn, e);
        llvm.verifyFunction(fn.unwrapped as llvm.Function);

        const functionType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
        closure = this.makeClosure(fn, functionType, e);
        const closureCall = this.generator.tsclosure.getLLVMCall();

        if (llvmReturnType.isVoid()) {
          return this.generator.builder.createSafeCall(closureCall, [closure]);
        }

        llvmReturnType = llvmReturnType.ensurePointer();
        const callResult = this.generator.builder.createSafeCall(closureCall, [closure]);

        return this.generator.builder.createBitCast(callResult, llvmReturnType);
      }
    }

    const closureEnvironment = this.generator.meta.try(MetaInfoStorage.prototype.getClosureEnvironment, closure);
    let environmentStructType: LLVMStructType;
    if (closureEnvironment) {
      environmentStructType = closureEnvironment.type;
    } else {
      environmentStructType = LLVMStructType.get(
        this.generator,
        adjustedArgs.map((a) => a.type)
      );
    }

    const getEnvironment = this.generator.tsclosure.getLLVMGetEnvironment();
    const environment = this.generator.builder.createBitCast(
      this.generator.builder.createSafeCall(getEnvironment, [closure]),
      environmentStructType.getPointer()
    );

    this.storeActualArguments(adjustedArgs, environment, closureEnvironment?.fixedArgsCount);

    const closureCall = this.generator.tsclosure.getLLVMCall();
    if (llvmReturnType.isVoid()) {
      return this.generator.builder.createSafeCall(closureCall, [closure]);
    }

    llvmReturnType = llvmReturnType.ensurePointer();
    const callResult = this.generator.builder.createSafeCall(closureCall, [closure]);

    return this.generator.builder.createBitCast(callResult, llvmReturnType);
  }

  private handleSuperCall(expression: ts.SuperCall, outerEnv?: Environment) {
    const thisType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = thisType.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;

    if (!valueDeclaration) {
      throw new Error(`Unable to find valueDeclaration for type '${thisType.toString()}' at '${expression.getText()}'`);
    }

    if (!valueDeclaration.isClass()) {
      throw new Error("Expected class declaration");
    }

    const constructorDeclaration = valueDeclaration.members.find((m) => m.isConstructor());
    if (!constructorDeclaration) {
      throw new Error(`No constructor provided: ${expression.getText()}`);
    }

    const argumentTypes = expression.arguments?.map((arg) => this.generator.ts.checker.getTypeAtLocation(arg)) || [];
    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      constructorDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator
    );

    const parentScope = valueDeclaration.getScope(thisType);
    if (!parentScope.thisData) {
      throw new Error("This data required");
    }

    if (isExternalSymbol) {
      if (!outerEnv) {
        throw new Error(`Expected outer environment to be provided at '${expression.getText()}'`);
      }

      return this.sysVFunctionHandler.handleNewExpression(expression, qualifiedName, outerEnv);
    }

    if (!constructorDeclaration.body) {
      throw new Error("Constructor body required");
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(constructorDeclaration)!;

    const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, constructorDeclaration, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);
    const args = handledArgs.map((value) => value.value);

    const environmentVariables = ConciseBody.create(
      constructorDeclaration.body,
      this.generator
    ).getEnvironmentVariables(signature, parentScope);

    // Memory to initialization is provided by outer environment. Force its usage by mention it in variables list.
    environmentVariables.push(this.generator.internalNames.This);
    const env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv,
      constructorDeclaration.body,
      undefined,
      outerEnv?.thisPrototype
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
      this.generator.builder.createSafeInBoundsGEP(env.typed, [
        env.getVariableIndex(this.generator.internalNames.This),
      ]),
      llvmThisType
    );
  }

  private handleArrowFunction(expression: ts.ArrowFunction, outerEnv?: Environment): LLVMValue {
    const type = this.generator.ts.checker.getTypeAtLocation(expression);
    const symbol = type.getSymbol();

    const declaration = symbol.declarations[0];
    const signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);

    const parameters = signature.getDeclaredParameters();

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

    const expressionDeclaration = Declaration.create(expression, this.generator);
    const scope = expressionDeclaration.getScope(undefined);
    const environmentVariables = ConciseBody.create(expression.body, this.generator).getEnvironmentVariables(
      signature,
      scope,
      outerEnv
    );

    // Arrow functions do not bind their own 'this', instead, they inherit the one from the parent scope
    try {
      if (this.generator.symbolTable.get(this.generator.internalNames.This)) {
        environmentVariables.push(this.generator.internalNames.This);
      }
      // Ignore empty catch block
      // tslint:disable-next-line
    } catch (_) { }

    // these dummy arguments will be substituted by actual arguments once called
    const dummyArguments = llvmArgumentTypes.map((t, index) => {
      const nullArg = LLVMConstant.createNullValue(t.ensurePointer(), this.generator);
      const tsType = tsArgumentTypes[index];
      if (!tsType.isSymbolless()) {
        const argSymbol = tsType.getSymbol();
        const argDeclaration = argSymbol.valueDeclaration;
        if (argDeclaration && !argDeclaration.isAmbient()) {
          const prototype = argDeclaration.getPrototype();
          nullArg.attachPrototype(prototype);
        }
      }

      return nullArg;
    });

    const env = createEnvironment(
      scope,
      environmentVariables,
      this.generator,
      { args: dummyArguments, signature },
      outerEnv,
      expression.body,
      undefined,
      outerEnv?.thisPrototype
    );
    this.generator.meta.registerFunctionEnvironment(expressionDeclaration, env);

    if (declaration.typeParameters) {
      return this.generator.tsclosure.lazyClosure.create(env.untyped);
    }

    if (
      !declaration.isExternalCallArgument() &&
      (dummyArguments.some((arg) => arg.hasPrototype()) || llvmArgumentTypes.some((argType) => argType.isClosure()))
    ) {
      return this.generator.tsclosure.lazyClosure.create(env.untyped);
    }

    const tsReturnType = signature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], this.generator.randomString);

    this.handleFunctionBody(llvmReturnType, expressionDeclaration, fn, env);
    llvm.verifyFunction(fn.unwrapped as llvm.Function);

    const functionType = this.generator.ts.checker.getTypeAtLocation(expression);
    return this.makeClosure(fn, functionType, env);
  }

  private handleGetAccessExpression(expression: ts.PropertyAccessExpression, outerEnv?: Environment): LLVMValue {
    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol.declarations.find((m) => m.isGetAccessor());
    if (!valueDeclaration) {
      throw new Error("No get accessor declaration found");
    }

    let thisType;
    if (!valueDeclaration.isStaticMethod()) {
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
      throw new Error("Function body required");
    }

    const parentScope = valueDeclaration.getScope(this.generator.ts.checker.getTypeAtLocation(expression.expression));

    const environmentVariables: string[] = [];

    let llvmThisType;
    if (thisType) {
      llvmThisType = parentScope.thisData!.llvmType;

      const thisValue = this.generator.handleExpression(expression.expression, outerEnv);
      if (!parentScope.get(this.generator.internalNames.This)) {
        parentScope.set(this.generator.internalNames.This, thisValue);
      } else {
        parentScope.overwrite(this.generator.internalNames.This, thisValue);
      }

      environmentVariables.push(this.generator.internalNames.This);
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);
    environmentVariables.push(
      ...ConciseBody.create(valueDeclaration.body, this.generator).getEnvironmentVariables(
        signature,
        parentScope,
        outerEnv
      )
    );

    const env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      undefined,
      outerEnv,
      valueDeclaration.body,
      undefined,
      outerEnv?.thisPrototype
    );

    const tsReturnType = this.generator.ts.checker.getTypeAtLocation(expression);
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const llvmArgumentTypes = [env.voidStar];
    if (llvmThisType) {
      llvmArgumentTypes.push(LLVMType.getInt8Type(this.generator).getPointer());
    }

    const { fn, existing } = this.generator.llvm.function.create(
      llvmReturnType,
      llvmArgumentTypes,
      qualifiedName + "__getter"
    );

    // All the actual arguments are passing by typeless environment.
    const callArgs = [env.untyped];
    if (llvmThisType) {
      const thisValue = parentScope.get(this.generator.internalNames.This);
      if (!(thisValue instanceof LLVMValue)) {
        throw new Error("'this' is not an LLVMValue");
      }

      const thisValueUntyped = this.generator.builder.asVoidStar(thisValue);
      callArgs.push(thisValueUntyped);
    }

    if (!existing) {
      this.handleFunctionBody(llvmReturnType, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope, this.generator);
    }

    return this.generator.builder.createSafeCall(fn, callArgs);
  }

  private handleSetAccessExpression(expression: ts.PropertyAccessExpression, outerEnv?: Environment): LLVMValue {
    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol.declarations.find((m) => m.isSetAccessor());
    if (!valueDeclaration) {
      throw new Error("No set accessor declaration found");
    }

    let thisType;
    if (!valueDeclaration.isStaticMethod()) {
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
      throw new Error("Unimplemented");
      //   return this.sysVFunctionHandler.handleSetAccessExpression(expression, qualifiedName, outerEnv);
    }

    if (!valueDeclaration.body) {
      throw new Error("Function body required");
    }

    const parentScope = valueDeclaration.getScope(this.generator.ts.checker.getTypeAtLocation(expression.expression));

    const environmentVariables: string[] = [];

    let llvmThisType;
    if (thisType) {
      llvmThisType = parentScope.thisData!.llvmType;
      environmentVariables.push(this.generator.internalNames.This);
    }

    if (llvmThisType) {
      const thisValue = this.generator.handleExpression(expression.expression, outerEnv);
      if (!parentScope.get(this.generator.internalNames.This)) {
        parentScope.set(this.generator.internalNames.This, thisValue);
      } else {
        parentScope.overwrite(this.generator.internalNames.This, thisValue);
      }

      environmentVariables.push(this.generator.internalNames.This);
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);
    environmentVariables.push(
      ...ConciseBody.create(valueDeclaration.body, this.generator).getEnvironmentVariables(
        signature,
        parentScope,
        outerEnv
      )
    );

    const parent = expression.parent as ts.BinaryExpression;
    const args = [this.generator.handleExpression(parent.right, outerEnv)];

    const env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv,
      valueDeclaration.body,
      undefined,
      outerEnv?.thisPrototype
    );

    const llvmArgumentTypes = [env.voidStar];

    if (llvmThisType) {
      llvmArgumentTypes.push(LLVMType.getInt8Type(this.generator).getPointer());
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
      const thisValue = parentScope.get(this.generator.internalNames.This);
      if (!(thisValue instanceof LLVMValue)) {
        throw new Error("'this' is not an LLVMValue");
      }

      const thisValueUntyped = this.generator.builder.asVoidStar(thisValue);
      callArgs.push(thisValueUntyped);
    }

    if (!existing) {
      this.handleFunctionBody(llvmReturnType, valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope, this.generator);
    }

    return this.generator.builder.createSafeCall(fn, callArgs);
  }

  isBindExpression(expression: ts.Expression) {
    if (!ts.isCallExpression(expression)) {
      return false;
    }

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
      throw new Error("Expected property access expression");
    }

    const argumentTypes = Expression.create(expression, this.generator).getArgumentTypes();

    const bindable = expression.expression.expression;
    const bindableSymbol = this.generator.ts.checker.getTypeAtLocation(bindable).getSymbol();

    let bindableValueDeclaration = bindableSymbol.declarations.find((value: Declaration) => {
      return value.parameters.length === argumentTypes.length;
    });

    if (!bindableValueDeclaration) {
      bindableValueDeclaration = bindableSymbol.declarations[0];
    }

    if (!bindableValueDeclaration.body) {
      throw new Error("No function declaration body found");
    }

    const bindableSignature = this.generator.ts.checker.getSignatureFromDeclaration(bindableValueDeclaration)!;

    const thisArg = this.generator.handleExpression(expression.arguments[0], outerEnv);
    const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(
        expression,
        bindableValueDeclaration!,
        bindableSignature,
        localScope,
        outerEnv,
        true
      );
    }, this.generator.symbolTable.currentScope);
    const args = handledArgs.map((value) => value.value);

    if (!this.generator.symbolTable.currentScope.get(this.generator.internalNames.This)) {
      this.generator.symbolTable.currentScope.set(this.generator.internalNames.This, thisArg);
    } else {
      this.generator.symbolTable.currentScope.overwrite(this.generator.internalNames.This, thisArg);
    }

    const environmentVariables = ConciseBody.create(
      bindableValueDeclaration.body,
      this.generator
    ).getEnvironmentVariables(bindableSignature, this.generator.symbolTable.currentScope, outerEnv);

    const parameters = bindableSignature.getDeclaredParameters();

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
        .map((t) => LLVMConstant.createNullValue(t.ensurePointer(), this.generator));

      args.push(...dummyArguments);
    }

    environmentVariables.push(this.generator.internalNames.This);
    const e = createEnvironment(
      this.generator.symbolTable.currentScope,
      environmentVariables,
      this.generator,
      {
        args,
        signature: bindableSignature,
      },
      outerEnv,
      bindableValueDeclaration.body,
      undefined,
      outerEnv?.thisPrototype
    );
    e.fixedArgsCount = fixesArgsCount;

    const tsReturnType = bindableSignature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const { fn } = this.generator.llvm.function.create(llvmReturnType, [e.voidStar], this.generator.randomString);

    this.handleFunctionBody(llvmReturnType, bindableValueDeclaration, fn, e);
    llvm.verifyFunction(fn.unwrapped as llvm.Function);

    const functionType = this.generator.ts.checker.getTypeAtLocation(bindable);
    return this.makeClosure(fn, functionType, e);
  }

  private handleCallExpression(expression: ts.CallExpression, outerEnv?: Environment): LLVMValue {
    const argumentTypes = Expression.create(expression, this.generator).getArgumentTypes();
    const isMethod = Expression.create(expression.expression, this.generator).isMethod();
    let thisType: TSType | undefined;

    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      thisType = this.generator.ts.checker.getTypeAtLocation(propertyAccess.expression);
    }

    let symbol: TSSymbol;
    let valueDeclaration: Declaration;

    symbol = this.generator.ts.checker.getTypeAtLocation(expression.expression).getSymbol();

    const maybeValueDeclaration = this.generator.meta.try(
      MetaInfoStorage.prototype.getRemappedSymbolDeclaration,
      symbol
    );

    const isCallOfRemappedSymbol = Boolean(maybeValueDeclaration);
    if (isCallOfRemappedSymbol) {
      valueDeclaration = maybeValueDeclaration!;
      if (valueDeclaration.isMethod()) {
        thisType = this.generator.ts.checker.getTypeAtLocation(valueDeclaration.parent);
      }
    } else {
      valueDeclaration =
        symbol.declarations.find((value: Declaration) => {
          return value.parameters.length === argumentTypes.length;
        }) || symbol.declarations[0];
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);

    if (valueDeclaration.typeParameters) {
      const typenameTypeMap = signature.getGenericsToActualMap(expression);

      typenameTypeMap.forEach((value, key) => {
        this.generator.symbolTable.currentScope.typeMapper.register(key, value);
      });
    }

    const thisTypeForMangling = valueDeclaration.isStaticMethod()
      ? this.generator.ts.checker.getTypeAtLocation((expression.expression as ts.PropertyAccessExpression).expression)
      : thisType;

    const manglingResult = FunctionMangler.mangle(
      valueDeclaration,
      expression,
      thisTypeForMangling,
      argumentTypes,
      this.generator
    );

    const { isExternalSymbol } = manglingResult;
    let { qualifiedName } = manglingResult;

    if (!qualifiedName.trim().length) {
      throw new Error(`No qualified name for function at '${expression.getText()}'`);
    }

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleCallExpression(expression, qualifiedName, outerEnv);
    }

    if (ts.isPropertyAccessExpression(expression.expression)) {
      const propertySymbol = this.generator.ts.checker.getSymbolAtLocation(expression.expression.name);

      if (propertySymbol.isProperty() || propertySymbol.isOptionalMethod()) {
        const callable = this.generator.handleExpression(expression.expression, outerEnv);

        if (callable.type.isClosure()) {
          const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
            return this.handleCallArguments(expression, valueDeclaration!, signature, localScope, outerEnv);
          }, this.generator.symbolTable.currentScope);
          const args = handledArgs.map((value) => value.value);

          return this.handleTSClosureCall(expression, signature, args, callable, undefined, outerEnv);
        } else if (callable.isOptionalClosure()) {
          const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
            return this.handleCallArguments(expression, valueDeclaration!, signature, localScope, outerEnv);
          }, this.generator.symbolTable.currentScope);
          const args = handledArgs.map((value) => value.value);

          const closurePtrPtr = this.generator.builder.createSafeInBoundsGEP(callable, [0, 1]);
          const closurePtr = this.generator.builder.createLoad(closurePtrPtr);
          return this.handleTSClosureCall(expression, signature, args, closurePtr, valueDeclaration, outerEnv);
        } else if (this.generator.tsclosure.lazyClosure.isLazyClosure(callable)) {
          const initializer = propertySymbol.valueDeclaration?.initializer;
          if (!initializer) {
            throw new Error(`Initializer not found for '${expression.expression.getText()}'`);
          }

          const initializerType = this.generator.ts.checker.getTypeAtLocation(initializer);
          const initializerSymbol = initializerType.getSymbol();
          const initializerDeclaration = initializerSymbol.valueDeclaration;
          if (!initializerDeclaration) {
            throw new Error(`Initializer declaration not found for '${expression.expression.getText()}'`);
          }

          const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
            return this.handleCallArguments(expression, initializerDeclaration, signature, localScope, outerEnv);
          }, this.generator.symbolTable.currentScope);
          const args = handledArgs.map((value) => value.value);

          const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);
          const tsReturnType = resolvedSignature.getReturnType();
          const llvmReturnType = tsReturnType.getLLVMReturnType();
          const llvmArgumentTypes = [LLVMType.getInt8Type(this.generator).getPointer()];

          const { fn } = this.generator.llvm.function.create(
            llvmReturnType,
            llvmArgumentTypes,
            this.generator.randomString
          );

          let e = this.generator.meta.getFunctionEnvironment(initializerDeclaration);
          const lazyClosureEnvironment = this.generator.builder.createLoad(
            this.generator.builder.createSafeInBoundsGEP(callable, [0, 0])
          );
          e.untyped = lazyClosureEnvironment;

          if (outerEnv) {
            e = Environment.merge(e, [outerEnv], this.generator);
          }

          this.handleFunctionBody(llvmReturnType, initializerDeclaration, fn, e);

          const closure = this.makeClosure(fn, initializerType, e);

          return this.handleTSClosureCall(expression, signature, args, closure, undefined, outerEnv);
        }

        throw new Error(`Unhandled call '${expression.getText()}'`);
      }
    }

    const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, valueDeclaration!, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);
    const args = handledArgs.map((value) => value.value);

    let thisVal;
    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;

      thisVal = this.generator.handleExpression(propertyAccess.expression, outerEnv);

      if (!thisVal.hasPrototype() && thisType && outerEnv?.thisPrototype) {
        let propertyAccessRoot: ts.Expression = propertyAccess;
        while (ts.isPropertyAccessExpression(propertyAccessRoot)) {
          propertyAccessRoot = propertyAccessRoot.expression;
        }
        const propertyAccessRootType = this.generator.ts.checker.getTypeAtLocation(propertyAccessRoot);

        if (thisType.isSame(propertyAccessRootType)) {
          const outerPrototype = outerEnv.thisPrototype;

          if (thisVal.type.equals(outerPrototype.parentType.getLLVMType())) {
            thisVal.attachPrototype(outerPrototype);
          }
        }
      }

      if (this.generator.ts.checker.nodeHasSymbol(propertyAccess.expression)) {
        const propertyAccessSymbol = this.generator.ts.checker.getSymbolAtLocation(propertyAccess.expression);
        const propertyAccessDeclaration = propertyAccessSymbol.valueDeclaration;
        if (propertyAccessDeclaration?.isParameter()) {
          if (!outerEnv) {
            throw new Error(`No environment provided at '${expression.getText()}'`);
          }

          const index = outerEnv.getVariableIndex(propertyAccess.expression.getText());
          if (index === -1) {
            throw new Error(
              `Unable to find '${propertyAccess.expression.getText()}' in environment at '${expression.getText()}'`
            );
          }

          const agg = this.generator.builder.createLoad(outerEnv.typed);
          thisVal = this.generator.builder.createSafeExtractValue(agg, [index]);

          const prototype = this.generator.meta.getParameterPrototype(propertyAccess.expression.getText());
          thisVal.attachPrototype(prototype);
        }
      }

      if (thisVal.hasPrototype()) {
        const prototype = thisVal.getPrototype();

        const functionName = propertyAccess.name.getText();
        const functionDeclaration = prototype.methods.find((m) => m.name?.getText() === functionName);

        if (!functionDeclaration) {
          throw new Error(`Unable to find '${functionName}' in prototype of '${thisVal.type.toString()}'`);
        }

        valueDeclaration = functionDeclaration;
        thisType = prototype.parentType;

        qualifiedName = FunctionMangler.mangle(
          valueDeclaration,
          expression,
          thisType,
          argumentTypes,
          this.generator
        ).qualifiedName;
      }
    }

    if (!valueDeclaration.body) {
      throw new Error(`Function body required for '${qualifiedName}'`);
    }

    const parentScope = valueDeclaration.getScope(thisType);

    const llvmThisType = parentScope.thisData?.llvmType;

    if (outerEnv && isCallOfRemappedSymbol) {
      const thisIdx = outerEnv.getVariableIndex(this.generator.internalNames.This);
      if (!thisVal && thisIdx !== -1) {
        const outerEnvLoaded = this.generator.builder.createLoad(outerEnv.typed);
        thisVal = this.generator.builder.createSafeExtractValue(outerEnvLoaded, [thisIdx]);
      }
    }

    const environmentVariables: string[] = [];

    if (thisVal) {
      const bothPtrsToStruct = thisVal.type.isPointerToStruct() && llvmThisType!.isPointerToStruct();
      thisVal = bothPtrsToStruct
        ? this.generator.builder.createBitCast(thisVal, llvmThisType!)
        : thisVal.adjustToType(llvmThisType!);

      if (!parentScope.get(this.generator.internalNames.This)) {
        parentScope.set(this.generator.internalNames.This, thisVal);
      } else {
        parentScope.overwrite(this.generator.internalNames.This, thisVal);
      }

      environmentVariables.push(this.generator.internalNames.This);
    }

    environmentVariables.push(
      ...ConciseBody.create(valueDeclaration.body, this.generator).getEnvironmentVariables(
        signature,
        parentScope,
        outerEnv
      )
    );

    let env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv,
      valueDeclaration.body,
      isMethod,
      thisVal && thisVal.hasPrototype() ? thisVal.getPrototype() : undefined
    );

    if (args.some((arg) => arg.type.isClosure())) {
      const indexesOfClosureArguments = args.reduce((indexes, arg, index) => {
        if (arg.type.isClosure()) {
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
    const tsReturnType = resolvedSignature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const llvmArgumentTypes = [env.voidStar];
    if (llvmThisType) {
      llvmArgumentTypes.push(llvmThisType);
    }

    let functionName = qualifiedName + "__" + valueDeclaration.unique;
    if (handledArgs.some((value) => value.generated) || args.some((arg) => arg.hasPrototype())) {
      functionName += "__" + this.generator.randomString;
    }
    if (valueDeclaration.isStaticMethod()) {
      functionName += "__" + "static";
    }

    const creationResult = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, functionName);
    const { fn } = creationResult;
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

    return this.generator.builder.createSafeCall(fn, callArgs);
  }

  private handleCallArguments(
    expression: ts.CallExpression | ts.NewExpression,
    valueDeclaration: Declaration,
    signature: Signature,
    scope: Scope,
    outerEnv?: Environment,
    contextThis?: boolean
  ) {
    const args: ts.Expression[] = [];
    if (expression.arguments) {
      const argsList = contextThis ? expression.arguments.slice(1) : Array.from(expression.arguments);
      args.push(...argsList);
    }

    const parameters = signature.getParameters();

    const registerPrototype = (argumentNode: ts.Node, value: LLVMValue, parameterName: string) => {
      if (value.hasPrototype()) {
        this.generator.meta.registerParameterPrototype(parameterName, value.getPrototype());
      } else {
        const type = this.generator.ts.checker.getTypeAtLocation(argumentNode);
        if (type.isClassOrInterface()) {
          const symbol = type.getSymbol();
          const declaration = symbol.valueDeclaration;
          if (declaration) {
            const prototype = declaration.getPrototype();
            this.generator.meta.registerParameterPrototype(parameterName, prototype);
            value.attachPrototype(prototype);
          }
        }
      }
    };

    const handledArgs = args
      .map((argument, index) => {
        const value = this.generator.handleExpression(argument, outerEnv);
        const parameterName = parameters[index].escapedName.toString();

        registerPrototype(argument, value, parameterName);

        scope.set(parameterName, value);

        return { argument, value };
      })
      .map((pair, index) => {
        if (!pair.value.type.isClosure()) {
          return { value: pair.value, generated: false };
        }

        const argumentType = this.generator.ts.checker.getTypeAtLocation(pair.argument);
        const argumentSymbol = argumentType.getSymbol();
        const argumentDeclaration = argumentSymbol.declarations[0];

        this.generator.meta.registerClosureParameter(
          expression.expression.getText(),
          signature.getParameters()[index].escapedName.toString(),
          argumentDeclaration
        );

        const effectiveArguments = ConciseBody.create(valueDeclaration.body!, this.generator).getEffectiveArguments(
          signature.getParameters()[index].escapedName.toString()
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

    const withRestParameters = parameters.some((parameter) => parameter.valueDeclaration?.dotDotDotToken);

    if (handledArgs.length !== parameters.length && !withRestParameters && !this.isBindExpression(expression)) {
      for (let i = handledArgs.length; i < parameters.length; ++i) {
        const parameterSymbol = parameters[i];
        const parameterDeclaration = parameterSymbol.valueDeclaration;
        if (!parameterDeclaration) {
          throw new Error(`Unable to find declaration for parameter '${parameterSymbol.escapedName}'`);
        }

        const defaultInitializer = parameterDeclaration.initializer;
        if (!defaultInitializer) {
          throw new Error(`Expected default initializer for parameter '${parameterSymbol.escapedName}'`);
        }

        const handledDefaultParameter = this.generator.handleExpression(defaultInitializer, outerEnv);

        const parameterName = parameters[i].escapedName.toString();
        registerPrototype(parameterDeclaration.unwrapped, handledDefaultParameter, parameterName);

        scope.set(parameterName, handledDefaultParameter);
        handledArgs.push({ value: handledDefaultParameter, generated: false });
      }
    }

    return handledArgs;
  }

  private handleClosureArgument(
    value: LLVMValue,
    argument: ts.Expression,
    argumentDeclaration: Declaration,
    signature: Signature,
    effectiveArguments: LLVMValue[],
    index: number
  ) {
    if (argumentDeclaration.parameters.length !== effectiveArguments.length) {
      throw new Error(
        `Expected ${argumentDeclaration.parameters.length} effective arguments, got ${effectiveArguments.length}`
      );
    }

    let llvmArgTypes: LLVMType[];
    try {
      llvmArgTypes = argumentDeclaration.parameters
        .map((arg) => this.generator.ts.checker.getTypeAtLocation(arg))
        .map((type) => type.getLLVMType());
    } catch (e) {
      const fallbackType = this.generator.ts.checker.getTypeAtLocation(signature.getDeclaredParameters()[index]);
      const fallbackSymbol = fallbackType.getSymbol();

      llvmArgTypes = fallbackSymbol.declarations[0].parameters
        .map((arg) => this.generator.ts.checker.getTypeAtLocation(arg))
        .map((type) => type.getLLVMType());
    }

    const mismatchArgs: { arg: LLVMValue; llvmArgType: LLVMType }[] = [];

    effectiveArguments.forEach((arg, argIndex) => {
      const llvmArgType = llvmArgTypes[argIndex];
      const argTypeUnwrapped = arg.type.unwrapPointer();

      if (
        !arg.type.equals(llvmArgType) &&
        !llvmArgType.isUnion() &&
        !arg.type.isUnion() &&
        argTypeUnwrapped.isStructType() &&
        !argTypeUnwrapped.isSameStructs(llvmArgType)
      ) {
        mismatchArgs.push({ arg, llvmArgType });
      }
    });

    const argumentSignature = this.generator.ts.checker.getSignatureFromDeclaration(argumentDeclaration)!;
    if (mismatchArgs.length > 0) {
      const tsReturnType = argumentSignature.getReturnType();
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
        signature.getDeclaredParameters()[index].name.getText()
      );
      return { value: closure, generated: true };
    } else {
      return { value, generated: false };
    }
  }

  private tryCreateMatchingClosure(
    returnType: LLVMType,
    mismatchArgs: { arg: LLVMValue; llvmArgType: LLVMType }[],
    argument: { expression: ts.Expression; signature: Signature; declaration: Declaration },
    effectiveArguments: LLVMValue[],
    fnScopeName: string
  ) {
    const returnTypeName = returnType.getTypename();
    const canGenerateFunction = mismatchArgs.reduce((can, mismatchArg) => {
      if (mismatchArg.llvmArgType.isUnion()) {
        return can && true;
      }

      if (can && mismatchArg.arg.type.isIntersection()) {
        const llvmArgName = mismatchArg.llvmArgType.getTypename();
        if (llvmArgName === returnTypeName) {
          returnType = mismatchArg.arg.type;
        }

        const intersectionType = mismatchArg.arg.type.unwrapPointer() as LLVMStructType;
        const intersectionTypename = intersectionType.getTypename();
        const intersectionSubtypeNames = intersectionType.getSubtypesNames();

        return intersectionSubtypeNames.includes(llvmArgName) || intersectionTypename.includes(llvmArgName);
      }

      return false;
    }, true);

    if (canGenerateFunction) {
      const closureEnv = this.generator.meta.getFunctionEnvironment(argument.declaration);

      const generatedEnvironmentValues = effectiveArguments;
      const closureEnvironmentValue = this.generator.builder.createLoad(closureEnv.typed);

      for (let i = effectiveArguments.length; i < closureEnv.type.numElements; ++i) {
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
        generatedEnvironmentType,
        this.generator
      );
      this.generator.meta.registerFunctionEnvironment(argument.declaration, generatedEnvironment);

      const { fn } = this.generator.llvm.function.create(
        returnType,
        [generatedEnvironment.voidStar],
        this.generator.randomString
      );
      this.handleFunctionBody(returnType, argument.declaration, fn, generatedEnvironment);

      llvm.verifyFunction(fn.unwrapped as llvm.Function);
      this.generator.symbolTable.currentScope.overwrite(fnScopeName, fn);

      const functionType = this.generator.ts.checker.getTypeAtLocation(
        ts.isCallExpression(argument.expression) ? argument.expression.expression : argument.expression
      );

      return this.makeClosure(fn, functionType, generatedEnvironment);
    } else {
      throw new Error("Cannot generate function to match effective arguments.");
    }
  }

  private makeClosure(fn: LLVMValue, functionType: TSType, env: Environment) {
    const functionDeclaration = functionType.getSymbol().declarations[0];
    const closure = this.generator.tsclosure.createClosure(fn, env.untyped, functionDeclaration.parameters.length);
    this.generator.meta.registerClosureEnvironment(closure, env);
    return closure;
  }

  private handleNewExpression(expression: ts.NewExpression, outerEnv?: Environment): LLVMValue {
    const thisType = this.generator.ts.checker.getTypeAtLocation(expression);
    const symbol = thisType.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
      throw new Error(`No value declaration found at '${expression.getText()}'`);
    }

    if (!valueDeclaration.isClass()) {
      throw new Error("Expected class declaration");
    }

    const constructorDeclaration = valueDeclaration.members.find((m) => m.isConstructor());
    if (!constructorDeclaration) {
      // unreachable if source is preprocessed correctly
      throw new Error(`No constructor provided: ${expression.getText()}`);
    }

    if ((!valueDeclaration.isAmbient() && valueDeclaration.typeParameters) || !thisType.isDeclared()) {
      addClassScope(expression, this.generator.symbolTable.currentScope, this.generator);
    }

    const argumentTypes = expression.arguments?.map((arg) => this.generator.ts.checker.getTypeAtLocation(arg)) || [];

    const manglingResult = FunctionMangler.mangle(
      constructorDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator
    );

    const { isExternalSymbol } = manglingResult;
    let { qualifiedName } = manglingResult;

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleNewExpression(expression, qualifiedName, outerEnv);
    }

    if (!constructorDeclaration.body) {
      throw new Error(`Constructor body required at '${expression.getText()}'`);
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(constructorDeclaration);
    const handledArgs = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, constructorDeclaration, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);
    const args = handledArgs.map((value) => value.value);

    const parentScope = valueDeclaration.getScope(thisType);
    if (!parentScope.thisData) {
      throw new Error("ThisData required");
    }

    const llvmThisType = parentScope.thisData.llvmType;
    const thisValue = this.generator.gc.allocate(llvmThisType.getPointerElementType());

    const oldThis = parentScope.get(this.generator.internalNames.This);
    if (oldThis) {
      parentScope.overwrite(this.generator.internalNames.This, thisValue);
    } else {
      parentScope.set(this.generator.internalNames.This, thisValue);
    }

    const environmentVariables = ConciseBody.create(
      constructorDeclaration.body,
      this.generator
    ).getEnvironmentVariables(signature, parentScope, outerEnv);

    environmentVariables.push(this.generator.internalNames.This);

    const env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv,
      constructorDeclaration.body,
      /* prefer local this = */ true,
      outerEnv?.thisPrototype
    );

    if (handledArgs.some((value) => value.generated) || args.some((arg) => arg.hasPrototype())) {
      qualifiedName += this.generator.randomString;
    }

    const { fn: constructor, existing } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      [env.voidStar],
      qualifiedName
    );

    if (!existing) {
      if (valueDeclaration.heritageClauses) {
        for (const clause of valueDeclaration.heritageClauses) {
          for (const baseType of clause.types) {
            const typeArguments = baseType.typeArguments;
            if (typeArguments) {
              const baseSymbol = this.generator.ts.checker.getSymbolAtLocation(baseType.expression);
              const baseClassDeclaration = baseSymbol.valueDeclaration;

              if (!baseClassDeclaration) {
                throw new Error(`Unable to find base class declaration at '${baseType.expression.getText()}'`);
              }

              const typeMapper = this.generator.meta.try(
                MetaInfoStorage.prototype.getClassTypeMapper,
                baseClassDeclaration
              );
              if (typeMapper) {
                typeMapper.mergeTo(this.generator.symbolTable.currentScope.typeMapper);
              }
            }
          }
        }
      }

      this.handleConstructorBody(constructorDeclaration, constructor, env);
      setLLVMFunctionScope(constructor, parentScope, this.generator);
    }

    this.generator.builder.createSafeCall(constructor, [env.untyped]);

    this.patchVTable(valueDeclaration, parentScope, thisValue, env);

    return thisValue;
  }

  private patchVTable(valueDeclaration: Declaration, parentScope: Scope, thisValue: LLVMValue, outerEnv?: Environment) {
    const overridenMethods = valueDeclaration.getOverriddenMethods();
    const virtualMethods = valueDeclaration.getVirtualMethods();

    overridenMethods.forEach((method) => {
      if (!method.body) {
        throw new Error(`Expected function body at '${method.getText()}'`);
      }

      if (!method.name) {
        throw new Error(`Expected function name at '${method.getText()}'`);
      }

      const signature = this.generator.ts.checker.getSignatureFromDeclaration(method);

      const environmentVariables = ConciseBody.create(method.body, this.generator).getEnvironmentVariables(
        signature,
        parentScope,
        outerEnv
      );

      const env = createEnvironment(
        parentScope,
        environmentVariables,
        this.generator,
        undefined,
        outerEnv,
        method.body,
        undefined,
        outerEnv?.thisPrototype
      );

      const tsReturnType = signature.getReturnType();
      const llvmReturnType = tsReturnType.getLLVMReturnType();

      const functionName = method.name.getText() + "__" + this.generator.randomString;

      const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

      this.handleFunctionBody(llvmReturnType, method, fn, env);
      llvm.verifyFunction(fn.unwrapped as llvm.Function);

      const closure = this.makeClosure(fn, method.type, env);

      const nullInitializer = this.generator.tsclosure.createNullValue();
      const closureGlobal = LLVMGlobalVariable.make(
        this.generator,
        closure.type,
        false,
        nullInitializer,
        fn.name + this.generator.randomString
      );
      this.generator.builder.createSafeStore(closure, closureGlobal);

      let { fn: virtualFn } = this.generator.llvm.function.create(llvmReturnType, [], this.generator.randomString);

      this.generator.withInsertBlockKeeping(() => {
        const entryBlock = llvm.BasicBlock.create(
          this.generator.context,
          "entry",
          virtualFn.unwrapped as llvm.Function
        );
        this.generator.builder.setInsertionPoint(entryBlock);

        const closureCall = this.generator.tsclosure.getLLVMCall();

        let callResult = this.generator.builder.createSafeCall(closureCall, [
          this.generator.builder.createLoad(closureGlobal),
        ]);
        if (!llvmReturnType.isVoid()) {
          callResult = this.generator.builder.createBitCast(callResult, llvmReturnType);
          this.generator.builder.createSafeRet(callResult);
        } else {
          this.generator.builder.createRetVoid();
        }
      });

      const virtualMethodClassDeclaration = virtualMethods.find(({ method: virtualMethod }) => {
        return virtualMethod.name!.getText() === method.name!.getText();
      })?.classDeclaration;

      if (!virtualMethodClassDeclaration) {
        throw new Error(`Unable to find virtual method's class declaration for '${method.name.getText()}'`);
      }

      const vtablePtr = this.generator.builder.createBitCast(
        thisValue,
        LLVMType.getVPtrType(this.generator).getPointer()
      );
      const vtableLoaded = this.generator.builder.createLoad(vtablePtr);
      const vtableAsArray = this.generator.builder.createBitCast(
        vtableLoaded,
        LLVMArrayType.get(
          this.generator,
          LLVMType.getVirtualFunctionType(this.generator),
          virtualMethodClassDeclaration.vtableSize
        ).getPointer()
      );

      const vtableIdx = virtualMethods.findIndex((v) => v.method.name!.getText() === method.name!.getText());
      const virtualDestructorsOffset = virtualMethodClassDeclaration.withVirtualDestructor ? 2 : 0;

      const virtualFnPtr = this.generator.builder.createSafeInBoundsGEP(vtableAsArray, [
        0,
        virtualDestructorsOffset + vtableIdx,
      ]);
      virtualFn = this.generator.builder.createBitCast(virtualFn, LLVMType.getVirtualFunctionType(this.generator));
      this.generator.builder.createSafeStore(virtualFn, virtualFnPtr);
    });
  }

  private handleFunctionExpression(expression: ts.FunctionExpression, outerEnv?: Environment) {
    const type = this.generator.ts.checker.getTypeAtLocation(expression);
    const symbol = type.getSymbol();
    const declaration = symbol.declarations[0];

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);
    const parameters = signature.getDeclaredParameters();

    if (!declaration.typeParameters) {
      this.visitFunctionParameters(parameters);
    }

    const tsArgumentTypes = !declaration.typeParameters
      ? parameters.map((parameter) => this.generator.ts.checker.getTypeAtLocation(parameter))
      : [];

    const llvmArgumentTypes = tsArgumentTypes.map((argType) => {
      return argType.getLLVMType();
    });

    const scope = declaration.getScope(undefined);

    // these dummy arguments will be substituted by actual arguments once called
    const dummyArguments = llvmArgumentTypes.map((t, index) => {
      const nullArg = LLVMConstant.createNullValue(t.ensurePointer(), this.generator);
      const tsType = tsArgumentTypes[index];
      if (!tsType.isSymbolless()) {
        const argSymbol = tsType.getSymbol();
        const argDeclaration = argSymbol.valueDeclaration;
        if (argDeclaration && !argDeclaration.isAmbient()) {
          const prototype = argDeclaration.getPrototype();
          nullArg.attachPrototype(prototype);
        }
      }

      return nullArg;
    });

    // @todo: 'this' is bindable by 'bind', 'call', 'apply' so it should be stored somewhere
    const environmentVariables = ConciseBody.create(expression.body, this.generator).getEnvironmentVariables(
      signature,
      scope,
      outerEnv
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
      expression.body,
      undefined,
      outerEnv?.thisPrototype
    );

    const expressionDeclaration = Declaration.create(expression, this.generator);
    this.generator.meta.registerFunctionEnvironment(expressionDeclaration, env);

    if (declaration.typeParameters) {
      return this.generator.tsclosure.lazyClosure.create(env.untyped);
    }

    if (
      !declaration.isExternalCallArgument() &&
      (dummyArguments.some((arg) => arg.hasPrototype()) || llvmArgumentTypes.some((argType) => argType.isClosure()))
    ) {
      return this.generator.tsclosure.lazyClosure.create(env.untyped);
    }

    const tsReturnType = signature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const functionName = expression.name
      ? expression.name.getText() + "__" + this.generator.randomString
      : this.generator.randomString;
    const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

    this.handleFunctionBody(llvmReturnType, expressionDeclaration, fn, env);
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

  private handleFunctionBody(llvmReturnType: LLVMType, declaration: Declaration, fn: LLVMValue, env?: Environment) {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope(
        (bodyScope) => {
          return this.withEnvironmentPointerFromArguments(
            (environment) => {
              const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", fn.unwrapped as llvm.Function);
              this.generator.builder.setInsertionPoint(entryBlock);

              if (ts.isBlock(declaration.body!) && declaration.body!.statements.length > 0) {
                declaration.body.forEachChild((node) => {
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
                const blocklessArrowFunctionReturn = this.generator.handleExpression(declaration.body!, environment);

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
                    if (currentFnReturnType.isUnionWithUndefined()) {
                      const markerPtr = this.generator.builder.createSafeInBoundsGEP(defaultReturn, [0, 0]);

                      const allocatedMarker = this.generator.gc.allocate(LLVMType.getInt8Type(this.generator));
                      const markerValue = LLVMConstantInt.get(this.generator, -1, 8);
                      this.generator.builder.createSafeStore(markerValue, allocatedMarker);

                      this.generator.builder.createSafeStore(allocatedMarker, markerPtr);
                    } else if (!hasTerminatedSwitchDefaultClause) {
                      throw new Error("No return statement in function returning non-void");
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
        this.generator.symbolTable.currentScope.name === this.generator.internalNames.FunctionScope
          ? undefined
          : this.generator.internalNames.FunctionScope
      );
    });
  }

  private handleConstructorBody(constructorDeclaration: Declaration, constructor: LLVMValue, env: Environment): void {
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

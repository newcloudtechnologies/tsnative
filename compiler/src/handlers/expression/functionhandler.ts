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

import { GenericTypeMapper, LLVMGenerator, MetaInfoStorage } from "../../generator";
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
import { LLVMConstant, LLVMConstantInt, LLVMGlobalVariable, LLVMValue } from "../../llvm/value";
import { LLVMArrayType, LLVMStructType, LLVMType } from "../../llvm/type";
import { ConciseBody } from "../../ts/concisebody";
import { Declaration } from "../../ts/declaration";
import { Expression } from "../../ts/expression";
import { Signature } from "../../ts/signature";
import { LLVMFunction } from "../../llvm/function";
import { getInvocableBody, needUnwind } from "../../builder/builder";

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
        this.generator.emitLocation(expression);
        const call = expression as ts.CallExpression;
        if (call.expression.kind === ts.SyntaxKind.SuperKeyword) {
          return this.handleSuperCall(expression as ts.SuperCall, env);
        }

        if (this.isBindExpression(call)) {
          return this.handleFunctionBind(call, env);
        }

        if (!ts.isIdentifier(call.expression) && !ts.isPropertyAccessExpression(call.expression)) {
          const functionToCall = this.generator.handleExpression(call.expression, env);

          const signature = this.generator.ts.checker.getResolvedSignature(call);

          const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
            return this.handleCallArguments(call, signature, localScope, env);
          }, this.generator.symbolTable.currentScope);

          const declaredLLVMFunctionType = this.generator.tsclosure.getLLVMType();
          return this.handleTSClosureCall(
            call,
            signature,
            args,
            this.generator.builder.createBitCast(functionToCall, declaredLLVMFunctionType)
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
        this.generator.emitLocation(expression);
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
      if (valueDeclaration.typeParameters) {
        const declaredSignature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);
        const typenameTypeMap = declaredSignature.getGenericsToActualMap(expression);

        typenameTypeMap.forEach((value, key) => {
          this.generator.symbolTable.currentScope.typeMapper.register(key, value);
        });
      }

      const parameters = signature.getDeclaredParameters();

      this.visitFunctionParameters(parameters);

      const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
        return this.handleCallArguments(expression, signature, localScope, outerEnv);
      }, this.generator.symbolTable.currentScope);

      const environmentVariables = ConciseBody.create(valueDeclaration.body!, this.generator).getEnvironmentVariables(
        signature,
        this.generator.symbolTable.currentScope,
        outerEnv
      );

      const env = createEnvironment(
        this.generator.symbolTable.currentScope,
        environmentVariables,
        this.generator,
        {
          signature,
          args,
        },
        outerEnv
      );

      const tsReturnType = signature.getReturnType();
      const llvmReturnType = tsReturnType.getLLVMReturnType();

      const functionName = this.generator.randomString;
      const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

      this.handleFunctionBody(valueDeclaration, fn, env);
      LLVMFunction.verify(fn, expression);

      const closure = this.makeClosure(fn, valueDeclaration, env);
      const closureCall = this.generator.tsclosure.getLLVMCall();
      const callResult = this.invoke(expression, valueDeclaration.body, closureCall, [closure]);

      return this.generator.builder.createBitCast(callResult, llvmReturnType);
    }

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);

    if (knownFunction.type.isClosure()) {
      const fixedArgsCount = this.generator.meta.getFixedArgsCount(knownFunction);

      const getEnvironment = this.generator.tsclosure.getLLVMGetEnvironment();
      const environment = this.generator.builder.createSafeCall(getEnvironment, [knownFunction]);
      const environmentAsArray = this.generator.builder.createBitCast(
        environment,
        LLVMArrayType.get(
          this.generator,
          LLVMType.getInt8Type(this.generator).getPointer(),
          fixedArgsCount + args.length
        ).getPointer()
      );

      this.storeActualArguments(args, environmentAsArray, fixedArgsCount);

      const closureCall = this.generator.tsclosure.getLLVMCall();

      const closureValueDeclaration = this.generator.ts.checker
        .getTypeAtLocation(expression.expression)
        .getSymbol().valueDeclaration;

      const body = closureValueDeclaration?.isFunctionLike() ? closureValueDeclaration.body : undefined;
      const callResult = this.invoke(expression, body, closureCall, [knownFunction]);

      const tsReturnType = signature.getReturnType();
      const llvmReturnType = tsReturnType.getLLVMReturnType();

      return this.generator.builder.createBitCast(callResult, llvmReturnType);
    }

    if (knownFunction.type.unwrapPointer().isFunction()) {
      const body = valueDeclaration.isFunctionLike() ? valueDeclaration.body : undefined;
      return this.invoke(expression, body, knownFunction, args);
    }

    if (knownFunction.type.isPointer() && knownFunction.type.getPointerElementType().isIntegerType(8)) {
      const declaredLLVMFunctionType = this.generator.tsclosure.getLLVMType();
      return this.handleTSClosureCall(
        expression,
        signature,
        args,
        this.generator.builder.createBitCast(knownFunction, declaredLLVMFunctionType)
      );
    }

    throw new Error(`Failed to call '${expression.getText()}'`);
  }

  private handleEnvironmentKnownFunction(expression: ts.CallExpression, knownIndex: number, outerEnv: Environment) {
    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);

    const symbol = !type.isSymbolless()
      ? type.getSymbol()
      : this.generator.ts.checker.getSymbolAtLocation(expression.expression);

    const valueDeclaration = symbol.declarations[0];
    const signature = this.generator.ts.checker.getResolvedSignature(expression);

    let ptr = this.generator.builder.createSafeExtractValue(outerEnv.typed.getValue(), [knownIndex]);

    if (ptr.type.isUnion()) {
      ptr = this.generator.ts.union.get(ptr);
      // @todo
      // 'expression' is a call of argument of type FuncT1 | FuncT2 | .. | FuncTN (| null/undefined)
      // to perform correct cast it is necessary to figure out if FuncT accepts funargs (have to bitcast to 'lazy closure' then)
      // there is no no-hackish ways to do so at this point. pretends that optional 'lazy closures' are not pass as arguments at all.
      ptr = this.generator.builder.createBitCast(ptr, this.generator.tsclosure.getLLVMType());
    }

    if (this.generator.tsclosure.lazyClosure.isLazyClosure(ptr)) {
      if (valueDeclaration.typeParameters) {
        const declaredSignature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);
        const typenameTypeMap = declaredSignature.getGenericsToActualMap(expression);

        typenameTypeMap.forEach((value, key) => {
          this.generator.symbolTable.currentScope.typeMapper.register(key, value);
        });
      }

      const parameters = signature.getDeclaredParameters();

      this.visitFunctionParameters(parameters);

      const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
        return this.handleCallArguments(expression, signature, localScope, outerEnv);
      }, this.generator.symbolTable.currentScope);

      const environmentVariables = ConciseBody.create(valueDeclaration.body!, this.generator).getEnvironmentVariables(
        signature,
        this.generator.symbolTable.currentScope,
        outerEnv
      );

      const env = createEnvironment(
        this.generator.symbolTable.currentScope,
        environmentVariables,
        this.generator,
        {
          signature,
          args,
        },
        outerEnv
      );

      const tsReturnType = signature.getReturnType();
      const llvmReturnType = tsReturnType.getLLVMReturnType();

      const functionName = this.generator.randomString;
      const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

      this.handleFunctionBody(valueDeclaration, fn, env);
      LLVMFunction.verify(fn, expression);

      const closure = this.makeClosure(fn, valueDeclaration, env);
      const closureCall = this.generator.tsclosure.getLLVMCall();
      const callResult = this.invoke(expression, valueDeclaration.body, closureCall, [closure]);

      return this.generator.builder.createBitCast(callResult, llvmReturnType);
    }

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature!, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);

    if (ptr.type.unwrapPointer().isFunction()) {
      const body = valueDeclaration.isFunctionLike() ? valueDeclaration.body : undefined;
      return this.invoke(expression, body, ptr, args);
    }

    if (ptr.type.isClosure()) {
      return this.handleTSClosureCall(expression, signature, args, ptr);
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
    closure: LLVMValue
  ) {
    const withRestParameters = last(signature.getDeclaredParameters())?.dotDotDotToken;
    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);

    const typeMapper = GenericTypeMapper.tryGetMapperForGenericClassMethod(expression, this.generator);

    const tsReturnType = resolvedSignature.getReturnType();

    let llvmReturnType;
    if (tsReturnType.isSupported()) {
      llvmReturnType = tsReturnType.getLLVMType();
    } else {
      if (!typeMapper) {
        throw new Error(`Expected generic class type mapper. Error at '${expression.getText()}'`);
      }

      llvmReturnType = typeMapper.get(tsReturnType.toString()).getLLVMType();
    }

    const types = withRestParameters
      ? args.map((arg) => arg.type)
      : resolvedSignature.getParameters().map((p) => {
          const tsType = this.generator.ts.checker.getTypeOfSymbolAtLocation(p, expression);
          if (tsType.isSupported()) {
            return tsType.getLLVMType();
          }

          if (!typeMapper) {
            throw new Error(`Expected generic class type mapper. Error at '${expression.getText()}'`);
          }

          return typeMapper.get(tsType.toString()).getLLVMType();
        });

    const adjustedArgs = args.map((arg, index) => {
      const llvmArgType = types[index];
      if (!arg.type.equals(llvmArgType)) {
        if (llvmArgType.isUnion()) {
          arg = this.generator.ts.union.create(arg);
        }
      }
      return arg;
    });

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

    const valueDeclaration = this.generator.ts.checker
      .getTypeAtLocation(expression.expression)
      .getSymbol().valueDeclaration;
    const body = valueDeclaration?.isFunctionLike() ? valueDeclaration.body : undefined;
    if (llvmReturnType.isVoid()) {
      llvmReturnType = this.generator.ts.undef.getLLVMType();
    }

    llvmReturnType = llvmReturnType.ensurePointer();
    const callResult = this.invoke(expression, body, closureCall, [closure]);

    return this.generator.builder.createBitCast(callResult, llvmReturnType);
  }

  private handleSuperCall(expression: ts.SuperCall, outerEnv?: Environment) {
    const isSynthetic = expression.pos === -1;
    let thisType = !isSynthetic ? this.generator.ts.checker.getTypeAtLocation(expression.expression) : undefined;

    if (!thisType || !thisType.isSupported()) {
      let parent = expression.parent;
      while (parent && !ts.isClassLike(parent)) {
        parent = parent.parent;
      }

      if (!parent) {
        throw new Error(`Unable to find class-like parent`);
      }

      thisType = this.generator.ts.checker.getTypeAtLocation(parent);
    }

    const symbol = thisType.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;

    if (!valueDeclaration) {
      throw new Error(`Unable to find valueDeclaration for type '${thisType.toString()}' at '${expression.getText()}'`);
    }

    if (!valueDeclaration.isClass()) {
      throw new Error("Expected class declaration");
    }

    let constructorDeclaration = valueDeclaration.members.find((m) => m.isConstructor());
    const classWithoutConstructor = !constructorDeclaration;

    if (!constructorDeclaration) {
      constructorDeclaration = Declaration.create(
        ts.createConstructor(undefined, undefined, [], undefined),
        this.generator
      );
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

    if (valueDeclaration.isAmbient()) {
      throw new Error(
        `Unable to find constructor symbol for ambient class '${valueDeclaration.getText()}'. Error at: '${expression.parent.getText()}'`
      );
    }

    let signature: Signature | undefined;
    const args: LLVMValue[] = [];

    if (!classWithoutConstructor) {
      signature = this.generator.ts.checker.getSignatureFromDeclaration(constructorDeclaration);
      args.push(
        ...this.generator.symbolTable.withLocalScope((localScope: Scope) => {
          return this.handleCallArguments(expression, signature!, localScope, outerEnv);
        }, this.generator.symbolTable.currentScope)
      );
    }

    if (!classWithoutConstructor && !constructorDeclaration.body) {
      throw new Error(`Constructor body required at '${expression.getText()}'`);
    }

    const environmentVariables: string[] = [];

    if (constructorDeclaration.body || valueDeclaration.isDerived) {
      const baseClassConstructorDeclaration = valueDeclaration.isDerived
        ? valueDeclaration.getBases()[0].members.find((m) => m.isConstructor())
        : undefined;
      const body = constructorDeclaration.body || baseClassConstructorDeclaration?.body;

      if (body) {
        environmentVariables.push(
          ...ConciseBody.create(body, this.generator).getEnvironmentVariables(signature, parentScope, outerEnv)
        );
      }
    }

    environmentVariables.push(...valueDeclaration.environmentVariables(expression, parentScope, outerEnv));
    environmentVariables.push(this.generator.internalNames.This);

    const env = createEnvironment(parentScope, environmentVariables, this.generator, { args, signature }, outerEnv);

    // hack for polymorphic 'this' using
    qualifiedName += this.generator.randomString;

    const { fn: constructor } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      [env.voidStar],
      qualifiedName
    );
    this.handleConstructor(expression, valueDeclaration, constructor, this.generator.symbolTable.currentScope, env);

    setLLVMFunctionScope(constructor, parentScope, this.generator, expression);

    this.invoke(expression, constructorDeclaration.body, constructor, [env.untyped]);

    const llvmThisType = parentScope.thisData.llvmType;

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
    const dummyArguments = llvmArgumentTypes.map((t) => {
      let nullArg = LLVMConstant.createNullValue(t.unwrapPointer(), this.generator);

      const allocated = this.generator.gc.allocate(nullArg.type.unwrapPointer());
      this.generator.builder.createSafeStore(nullArg, allocated);
      nullArg = allocated;

      if (nullArg.type.isUnion()) {
        nullArg = this.generator.ts.union.create();
      }

      return nullArg;
    });

    const env = createEnvironment(
      scope,
      environmentVariables,
      this.generator,
      { args: dummyArguments, signature },
      outerEnv
    );
    this.generator.meta.registerFunctionEnvironment(expressionDeclaration, env);

    const tsReturnType = signature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], this.generator.randomString);

    this.handleFunctionBody(expressionDeclaration, fn, env);
    LLVMFunction.verify(fn, expression);

    return this.makeClosure(fn, expressionDeclaration, env);
  }

  private handleGetAccessExpression(expression: ts.PropertyAccessExpression, outerEnv?: Environment): LLVMValue {
    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol.declarations.find((m) => m.isGetAccessor());
    if (!valueDeclaration) {
      throw new Error(`No get accessor declaration found. Error at: '${expression.getText()}'`);
    }

    if (!valueDeclaration.name) {
      throw new Error(
        `Expected get accessor declaration to have a name, got declaration: '${valueDeclaration.getText()}'. Error at: '${expression.getText()}'`
      );
    }

    let thisType;
    if (!valueDeclaration.isStaticMethod()) {
      thisType = this.generator.ts.checker.getTypeAtLocation(valueDeclaration.parent);
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
      throw new Error(`Function body required. Error at: '${expression.getText()}'`);
    }

    const tsReturnType = this.generator.ts.checker.getTypeAtLocation(expression);
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    let callResult: LLVMValue;

    if (!valueDeclaration.isStaticMethod()) {
      const thisValue = this.generator.handleExpression(expression.expression, outerEnv);

      const key = valueDeclaration.name.getText() + "__get";

      const getterUnion = this.generator.ts.obj.get(thisValue, key);
      let getterClosure = this.generator.ts.union.get(getterUnion);
      getterClosure = this.generator.builder.createBitCast(getterClosure, this.generator.tsclosure.getLLVMType());

      const closureCall = this.generator.tsclosure.getLLVMCall();
      callResult = this.invoke(expression, valueDeclaration.body, closureCall, [getterClosure]);
    } else {
      const parentScope = valueDeclaration.getScope(this.generator.ts.checker.getTypeAtLocation(expression.expression));
      const environmentVariables: string[] = [];

      const signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);
      environmentVariables.push(
        ...ConciseBody.create(valueDeclaration.body, this.generator).getEnvironmentVariables(
          signature,
          parentScope,
          outerEnv
        )
      );

      const env = createEnvironment(parentScope, environmentVariables, this.generator, undefined, outerEnv);

      const llvmArgumentTypes = [env.voidStar];

      const { fn, existing } = this.generator.llvm.function.create(
        llvmReturnType,
        llvmArgumentTypes,
        qualifiedName + "__static__get"
      );

      // All the actual arguments are passing by typeless environment.
      const callArgs = [env.untyped];

      if (!existing) {
        this.handleFunctionBody(valueDeclaration, fn, env);
        setLLVMFunctionScope(fn, parentScope, this.generator, expression);
      }
      const body = valueDeclaration.isFunctionLike() ? valueDeclaration.body : undefined;
      callResult = this.invoke(expression, body, fn, callArgs);
    }

    return this.generator.builder.createBitCast(callResult, llvmReturnType);
  }

  private handleSetAccessExpression(expression: ts.PropertyAccessExpression, outerEnv?: Environment): LLVMValue {
    const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol.declarations.find((m) => m.isSetAccessor());
    if (!valueDeclaration) {
      throw new Error(`No set accessor declaration found. Error at: '${expression.getText()}'`);
    }

    if (!valueDeclaration.name) {
      throw new Error(
        `Expected set accessor declaration to have a name, got declaration: '${valueDeclaration.getText()}'. Error at: '${expression.getText()}'`
      );
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
      return this.sysVFunctionHandler.handleSetAccessExpression(expression, qualifiedName, outerEnv);
    }

    if (!valueDeclaration.body) {
      throw new Error(`Function body required. Error at: '${expression.getText()}'`);
    }

    const parent = expression.parent as ts.BinaryExpression;
    const value = this.generator.handleExpression(parent.right, outerEnv);

    if (!valueDeclaration.isStaticMethod()) {
      const thisValue = this.generator.handleExpression(expression.expression, outerEnv);

      const args = [value];

      const key = valueDeclaration.name.getText() + "__set";

      const setterUnion = this.generator.ts.obj.get(thisValue, key);
      let setterClosure = this.generator.ts.union.get(setterUnion);
      setterClosure = this.generator.builder.createBitCast(setterClosure, this.generator.tsclosure.getLLVMType());

      const getEnvironment = this.generator.tsclosure.getLLVMGetEnvironment();
      const environment = this.generator.builder.createSafeCall(getEnvironment, [setterClosure]);
      const environmentAsArray = this.generator.builder.createBitCast(
        environment,
        LLVMArrayType.get(this.generator, LLVMType.getInt8Type(this.generator).getPointer(), args.length).getPointer()
      );

      this.storeActualArguments(args, environmentAsArray);

      const closureCall = this.generator.tsclosure.getLLVMCall();
      this.invoke(expression, valueDeclaration.body, closureCall, [setterClosure]);
    } else {
      const parentScope = valueDeclaration.getScope(this.generator.ts.checker.getTypeAtLocation(expression.expression));
      const environmentVariables: string[] = [];

      const signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);
      environmentVariables.push(
        ...ConciseBody.create(valueDeclaration.body, this.generator).getEnvironmentVariables(
          signature,
          parentScope,
          outerEnv
        )
      );

      const args = [value];
      const env = createEnvironment(parentScope, environmentVariables, this.generator, { args, signature }, outerEnv);
      const llvmArgumentTypes = [env.voidStar];

      const llvmReturnType = this.generator.ts.undef.getLLVMType();
      const { fn, existing } = this.generator.llvm.function.create(
        llvmReturnType,
        llvmArgumentTypes,
        qualifiedName + "__static_set"
      );

      const callArgs = [env.untyped];

      if (!existing) {
        this.handleFunctionBody(valueDeclaration, fn, env);
        setLLVMFunctionScope(fn, parentScope, this.generator, expression);
      }

      const body = valueDeclaration.isFunctionLike() ? valueDeclaration.body : undefined;
      this.invoke(expression, body, fn, callArgs);
    }

    return value;
  }

  isBindExpression(expression: ts.Expression) {
    if (!ts.isCallExpression(expression)) {
      return false;
    }

    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    if (type.isSymbolless()) {
      return false;
    }

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
      throw new Error(`Expected property access expression in function bind. Error at '${expression.getText()}'`);
    }

    const bindable = expression.expression.expression;

    const symbol = this.generator.ts.checker.getTypeAtLocation(bindable).getSymbol();
    const valueDeclaration = symbol.valueDeclaration;

    if (!valueDeclaration) {
      throw new Error(
        `Unable to find value declaration for callable '${bindable.getText()}'. Error at: '${expression.getText()}'`
      );
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(valueDeclaration)!;

    let originalThisValue: LLVMValue | undefined;
    let thisValuePtr: LLVMValue | undefined;

    if (
      ts.isPropertyAccessExpression(expression.expression.expression) &&
      expression.expression.expression.expression.getText() === "this" &&
      this.generator.meta.inSuperCall()
    ) {
      const thisValueIdx = outerEnv!.getVariableIndex("this");
      if (thisValueIdx === -1) {
        throw new Error(`Expected 'this' to be provided to constructor. Error at '${expression.getText()}'`);
      }

      thisValuePtr = this.generator.builder.createInBoundsGEP(outerEnv!.typed, [
        LLVMConstantInt.get(this.generator, 0),
        LLVMConstantInt.get(this.generator, thisValueIdx),
      ]);

      originalThisValue = this.generator.builder.createLoad(thisValuePtr);
      let thisValue = this.generator.handleExpression(expression.expression.expression.expression, outerEnv);
      thisValue = this.generator.ts.obj.get(thisValue, "parent");
      thisValue = this.generator.ts.union.get(thisValue);

      this.generator.builder.createSafeStore(thisValue, thisValuePtr);
    }

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature, localScope, outerEnv, !valueDeclaration.isMethod());
    }, this.generator.symbolTable.currentScope);

    const functionToBind = this.generator.handleExpression(bindable, outerEnv);

    if (originalThisValue && thisValuePtr) {
      this.generator.builder.createSafeStore(originalThisValue, thisValuePtr);
    }

    const getEnvironment = this.generator.tsclosure.getLLVMGetEnvironment();
    const environment = this.generator.builder.createSafeCall(getEnvironment, [functionToBind]);
    const environmentAsArray = this.generator.builder.createBitCast(
      environment,
      LLVMArrayType.get(this.generator, LLVMType.getInt8Type(this.generator).getPointer(), args.length).getPointer()
    );

    this.storeActualArguments(args, environmentAsArray);

    this.generator.meta.registerFixedArgsCount(functionToBind, args.length);

    return functionToBind;
  }

  private handleCallExpression(expression: ts.CallExpression, outerEnv?: Environment): LLVMValue {
    const argumentTypes = Expression.create(expression, this.generator).getArgumentTypes();

    if (ts.isPropertyAccessExpression(expression.expression)) {
      const propertySymbol = this.generator.ts.checker.getSymbolAtLocation(expression.expression.name);
      const rootType = this.generator.ts.checker.getTypeAtLocation(expression.expression.expression);

      if (
        !propertySymbol.isStaticMethod() &&
        !rootType.isNamespace() &&
        propertySymbol.valueDeclaration &&
        !propertySymbol.valueDeclaration.isAmbient()
      ) {
        let object: LLVMValue;
        if (expression.expression.expression.kind === ts.SyntaxKind.SuperKeyword) {
          if (!outerEnv) {
            throw new Error(
              `Expected environment to be provided at 'super' access point. Error at '${expression.getText()}'`
            );
          }

          const thisValueIdx = outerEnv.getVariableIndex("this");
          if (thisValueIdx === -1) {
            throw new Error(
              `Expected 'this' to be provided at 'super' access point. Error at '${expression.getText()}'`
            );
          }

          const thisValuePtr = this.generator.builder.createInBoundsGEP(outerEnv.typed, [
            LLVMConstantInt.get(this.generator, 0),
            LLVMConstantInt.get(this.generator, thisValueIdx!),
          ]);

          const thisValue = this.generator.builder.createLoad(thisValuePtr);

          const superObjectUnion = this.generator.ts.obj.get(thisValue, "super");

          object = this.generator.ts.union.get(superObjectUnion);
        } else {
          object = this.generator.handleExpression(expression.expression.expression, outerEnv);

          if (expression.expression.expression.getText() === "this" && this.generator.meta.inSuperCall()) {
            object = this.generator.ts.obj.get(object, "parent");
            object = this.generator.ts.union.get(object);
          }
        }

        const closureUnion = this.generator.ts.obj.get(object, expression.expression.name.getText());
        let closure = this.generator.ts.union.get(closureUnion);

        const type = this.generator.ts.checker.getTypeAtLocation(expression.expression.name);

        let declaration: Declaration;
        if (!type.isSymbolless()) {
          const symbol = type.getSymbol();
          declaration = symbol.valueDeclaration || symbol.declarations[0];
        } else {
          declaration = propertySymbol.valueDeclaration || propertySymbol.declarations[0];
        }

        const signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);
        const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
          return this.handleCallArguments(expression, signature, localScope, outerEnv);
        }, this.generator.symbolTable.currentScope);

        closure = declaration.type.isOptionalUnion()
          ? this.generator.builder.createBitCast(closure, this.generator.tsclosure.getLLVMType())
          : this.generator.builder.createBitCast(closure, declaration.type.getLLVMType());

        return this.handleTSClosureCall(expression, signature, args, closure);
      } else {
        if (propertySymbol.isMethodSignature() || propertySymbol.isProperty() || propertySymbol.isOptionalMethod()) {
          let callable = this.generator.handleExpression(expression.expression, outerEnv);

          if (propertySymbol.isOptionalMethod()) {
            callable = this.generator.ts.union.get(callable);
          }

          const type = this.generator.ts.checker.getTypeAtLocation(expression.expression.name);
          let declaration: Declaration;
          if (!type.isSymbolless()) {
            const symbol = type.getSymbol();
            declaration = symbol.valueDeclaration || symbol.declarations[0];
          } else {
            declaration = propertySymbol.valueDeclaration || propertySymbol.declarations[0];
          }

          callable = declaration.type.isOptionalUnion()
            ? this.generator.builder.createBitCast(callable, this.generator.tsclosure.getLLVMType())
            : this.generator.builder.createBitCast(callable, declaration.type.getLLVMType());

          const signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);

          if (callable.type.isClosure()) {
            const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
              return this.handleCallArguments(expression, signature, localScope, outerEnv);
            }, this.generator.symbolTable.currentScope);

            return this.handleTSClosureCall(expression, signature, args, callable);
          } else if (this.generator.tsclosure.lazyClosure.isLazyClosure(callable)) {
            const initializerDeclaration = declaration;
            if (!initializerDeclaration) {
              throw new Error(`Initializer declaration not found for '${expression.expression.getText()}'`);
            }

            const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
              return this.handleCallArguments(expression, signature, localScope, outerEnv);
            }, this.generator.symbolTable.currentScope);

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

            this.handleFunctionBody(initializerDeclaration, fn, e);

            const closure = this.makeClosure(fn, initializerDeclaration, e);

            return this.handleTSClosureCall(expression, signature, args, closure);
          }

          throw new Error(`Unhandled call '${expression.getText()}'`);
        }
      }
    }

    const isMethod = Expression.create(expression.expression, this.generator).isMethod();
    let thisType: TSType | undefined;

    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      thisType = this.generator.ts.checker.getTypeAtLocation(propertyAccess.expression);
    }

    const symbol = this.generator.ts.checker.getTypeAtLocation(expression.expression).getSymbol();

    const valueDeclaration =
      symbol.declarations.find((value: Declaration) => {
        return value.parameters.length === argumentTypes.length;
      }) || symbol.declarations[0];

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

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);

    let thisVal;
    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      thisVal = this.generator.handleExpression(propertyAccess.expression, outerEnv);
    }

    if (!valueDeclaration.body) {
      throw new Error(`Function body required for '${qualifiedName}'. Error at '${expression.getText()}'`);
    }

    const parentScope = valueDeclaration.getScope(thisType);

    const llvmThisType = parentScope.thisData?.llvmType;

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

    let env: Environment;
    if (thisVal && outerEnv) {
      env = outerEnv;
    } else {
      env = createEnvironment(
        parentScope,
        environmentVariables,
        this.generator,
        { args, signature },
        outerEnv,
        isMethod
      );
    }

    if (!this.isInFunction(expression) && args.some((arg) => arg.type.isClosure())) {
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

    if (valueDeclaration.isStaticMethod()) {
      qualifiedName += "__" + "static";
    }

    const creationResult = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);
    const { fn } = creationResult;
    const { existing } = creationResult;

    // All the actual arguments are passing by typeless environment.
    const callArgs = [env.untyped];

    if (!existing) {
      this.handleFunctionBody(valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope, this.generator, expression);
    }

    const body = valueDeclaration.isFunctionLike() ? valueDeclaration.body : undefined;
    return this.invoke(expression, body, fn, callArgs);
  }

  private handleCallArguments(
    expression: ts.CallExpression | ts.NewExpression,
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

    const handledArgs = args.map((argument, index) => {
      let value = this.generator.handleExpression(argument, outerEnv);

      if (value.isTSPrimitivePtr()) {
        // mimics 'value' semantic for primitives
        value = value.clone();
      }

      const parameter = parameters[index];

      if (!parameter) {
        return value;
      }

      const parameterName = parameter.escapedName.toString();
      const parameterDeclaration = parameter.valueDeclaration || parameter.declarations[0];
      const parameterType = parameterDeclaration.type;

      if (parameterType.isSupported()) {
        const parameterLLVMType = parameterType.getLLVMType();

        if (parameterLLVMType.isUnion() && !value.type.isUnion()) {
          value = this.generator.ts.union.create(value);
        }
      }

      if (value.type.isUnion() && !parameterDeclaration.type.isUnion()) {
        value = this.generator.ts.union.get(value);
      }

      scope.set(parameterName, value);

      if (value.type.isClosure()) {
        const argumentType = this.generator.ts.checker.getTypeAtLocation(argument);
        const argumentSymbol = argumentType.getSymbol();
        const argumentDeclaration = argumentSymbol.declarations[0];

        this.generator.meta.registerClosureParameter(
          expression.expression.getText(),
          signature.getParameters()[index].escapedName.toString(),
          argumentDeclaration
        );
      }

      return value;
    });

    const withRestParameters = parameters.some((parameter) => parameter.valueDeclaration?.dotDotDotToken);

    if (handledArgs.length !== parameters.length && !withRestParameters && !this.isBindExpression(expression)) {
      for (let i = handledArgs.length; i < parameters.length; ++i) {
        const parameterSymbol = parameters[i];
        const parameterDeclaration = parameterSymbol.valueDeclaration;
        if (!parameterDeclaration) {
          throw new Error(`Unable to find declaration for parameter '${parameterSymbol.escapedName}'`);
        }

        if (parameterDeclaration.isOptional()) {
          continue;
        }

        const defaultInitializer = parameterDeclaration.initializer;
        if (!defaultInitializer) {
          throw new Error(`Expected default initializer for parameter '${parameterSymbol.escapedName}'`);
        }

        const handledDefaultParameter = this.generator.handleExpression(defaultInitializer, outerEnv);
        const parameterName = parameters[i].escapedName.toString();

        scope.set(parameterName, handledDefaultParameter);
        handledArgs.push(handledDefaultParameter);
      }
    }

    return handledArgs;
  }

  private makeClosure(fn: LLVMValue, functionDeclaration: Declaration, env: Environment) {
    const closure = this.generator.tsclosure.createClosure(fn, env.untyped, functionDeclaration);
    this.generator.meta.registerClosureEnvironment(closure, env);
    return closure;
  }

  private handleNewExpression(expression: ts.NewExpression, outerEnv?: Environment): LLVMValue {
    const thisType = this.generator.ts.checker.getTypeAtLocation(expression);
    const symbol = thisType.getSymbol();
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
      throw new Error(
        `No value declaration found for class of type '${thisType.toString()}'. Error at: '${expression.getText()}'`
      );
    }

    if (!valueDeclaration.isClass()) {
      throw new Error(
        `Expected class declaration, got '${ts.SyntaxKind[valueDeclaration.kind]}'. Error at: '${expression.getText()}'`
      );
    }

    if ((!valueDeclaration.isAmbient() && valueDeclaration.typeParameters) || !thisType.isDeclared()) {
      addClassScope(expression, this.generator.symbolTable.globalScope, this.generator);
    }

    const argumentTypes = expression.arguments?.map((arg) => this.generator.ts.checker.getTypeAtLocation(arg)) || [];

    let constructorDeclaration = valueDeclaration.findConstructor(argumentTypes);

    const classWithoutConstructor = !constructorDeclaration;

    if (!constructorDeclaration) {
      constructorDeclaration = Declaration.create(
        ts.createConstructor(undefined, undefined, [], undefined),
        this.generator
      );
    }

    const manglingResult = FunctionMangler.mangle(
      constructorDeclaration,
      expression,
      thisType,
      argumentTypes,
      this.generator
    );

    const { isExternalSymbol } = manglingResult;
    const { qualifiedName } = manglingResult;

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleNewExpression(expression, qualifiedName, outerEnv);
    }

    if (valueDeclaration.isAmbient()) {
      throw new Error(
        `Unable to find constructor symbol for ambient class '${valueDeclaration.getText()}'. Error at: '${expression.getText()}'`
      );
    }

    const thisValue = this.generator.ts.obj.create();

    const parentScope = valueDeclaration.getScope(thisType);

    const oldThis = parentScope.get(this.generator.internalNames.This);
    if (oldThis) {
      parentScope.overwrite(this.generator.internalNames.This, thisValue);
    } else {
      parentScope.set(this.generator.internalNames.This, thisValue);
    }

    let signature: Signature | undefined;
    const args: LLVMValue[] = [];

    if (!classWithoutConstructor) {
      signature = this.generator.ts.checker.getSignatureFromDeclaration(constructorDeclaration);
      args.push(
        ...this.generator.symbolTable.withLocalScope((localScope: Scope) => {
          return this.handleCallArguments(expression, signature!, localScope, outerEnv);
        }, this.generator.symbolTable.currentScope)
      );
    }

    if (!classWithoutConstructor && !constructorDeclaration.body) {
      throw new Error(`Constructor body required at '${expression.getText()}'`);
    }

    const environmentVariables: string[] = [];

    if (constructorDeclaration.body || valueDeclaration.isDerived) {
      const baseClassConstructorDeclaration = valueDeclaration.isDerived
        ? valueDeclaration.getBases()[0].members.find((m) => m.isConstructor())
        : undefined;
      const body = constructorDeclaration.body || baseClassConstructorDeclaration?.body;

      if (body) {
        environmentVariables.push(
          ...ConciseBody.create(body, this.generator).getEnvironmentVariables(signature, parentScope, outerEnv)
        );
      }
    }

    environmentVariables.push(...valueDeclaration.environmentVariables(expression, parentScope, outerEnv));
    environmentVariables.push(this.generator.internalNames.This);

    const env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv,
      /* prefer local this = */ true
    );

    const { fn: constructor, existing } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      [env.voidStar],
      qualifiedName
    );

    if (!existing) {
      this.populateGenericTypes(valueDeclaration, parentScope);

      if (expression.typeArguments) {
        const declaredTypeParameters = valueDeclaration.typeParameters;
        if (!declaredTypeParameters) {
          throw new Error(
            `Expected type parameters in value declaration: '${valueDeclaration.getText()}'. Error at: '${expression.getText()}'`
          );
        }

        expression.typeArguments.forEach((typeArg, index) => {
          const type = this.generator.ts.checker.getTypeFromTypeNode(typeArg);
          parentScope.typeMapper.register(declaredTypeParameters[index].getText(), type);
        });
      }

      this.handleConstructor(expression, valueDeclaration, constructor, parentScope, env);
      setLLVMFunctionScope(constructor, parentScope, this.generator, expression);
    }

    const body = constructorDeclaration.isFunctionLike() ? constructorDeclaration.body : undefined;
    this.invoke(expression, body, constructor, [env.untyped]);

    this.patchVTable(valueDeclaration, parentScope, thisValue, env);

    return thisValue;
  }

  private populateGenericTypes(valueDeclaration: Declaration, scope: Scope) {
    if (!valueDeclaration.heritageClauses) {
      return;
    }

    for (const clause of valueDeclaration.heritageClauses) {
      for (const baseType of clause.types) {
        const typeArguments = baseType.typeArguments;
        if (!typeArguments) {
          continue;
        }

        const baseSymbol = this.generator.ts.checker.getSymbolAtLocation(baseType.expression);
        const baseClassDeclaration = baseSymbol.valueDeclaration;

        if (!baseClassDeclaration) {
          throw new Error(`Unable to find base class declaration at '${baseType.expression.getText()}'`);
        }

        const typeMapper = this.generator.meta.try(MetaInfoStorage.prototype.getClassTypeMapper, baseClassDeclaration);

        if (!typeMapper) {
          continue;
        }

        typeMapper.mergeTo(scope.typeMapper);
      }
    }
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

      const env = createEnvironment(parentScope, environmentVariables, this.generator, undefined, outerEnv);

      const tsReturnType = signature.getReturnType();
      const llvmReturnType = tsReturnType.getLLVMReturnType();

      const functionName = method.name.getText() + "__" + this.generator.randomString;

      const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

      this.handleFunctionBody(method, fn, env);
      LLVMFunction.verify(fn, valueDeclaration);

      const closure = this.makeClosure(fn, method, env);

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
      const virtualDestructorsOffset = 2; // @todo: handcoded cause all the CXX class expected to be derived from Object and thus have virtual destructor
      const objectVirtualMethodsCount = 2; // @todo: how this can be non-handcoded?

      const virtualFnPtr = this.generator.builder.createSafeInBoundsGEP(vtableAsArray, [
        0,
        virtualDestructorsOffset + objectVirtualMethodsCount + vtableIdx,
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

    const llvmArgumentTypes: LLVMType[] = [];
    if (!declaration.typeParameters) {
      this.visitFunctionParameters(parameters);
      const tsArgumentTypes = parameters.map((parameter) => this.generator.ts.checker.getTypeAtLocation(parameter));
      llvmArgumentTypes.push(
        ...tsArgumentTypes.map((argType) => {
          return argType.getLLVMType();
        })
      );
    } else {
      llvmArgumentTypes.push(...new Array(parameters.length).fill(LLVMType.getInt8Type(this.generator).getPointer()));
    }

    const scope = declaration.getScope(undefined);

    // these dummy arguments will be substituted by actual arguments once called
    const dummyArguments = llvmArgumentTypes.map((t) => {
      let nullArg = LLVMConstant.createNullValue(t.unwrapPointer(), this.generator);

      const allocated = this.generator.gc.allocate(nullArg.type.unwrapPointer());
      this.generator.builder.createSafeStore(nullArg, allocated);
      nullArg = allocated;

      if (nullArg.type.isUnion()) {
        nullArg = this.generator.ts.union.create();
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
      outerEnv
    );

    if (declaration.typeParameters) {
      return this.generator.tsclosure.lazyClosure.create(env.typed);
    }

    const expressionDeclaration = Declaration.create(expression, this.generator);
    this.generator.meta.registerFunctionEnvironment(expressionDeclaration, env);

    const tsReturnType = signature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const functionName = expression.name
      ? expression.name.getText() + "__" + this.generator.randomString
      : this.generator.randomString;
    const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

    this.handleFunctionBody(expressionDeclaration, fn, env);
    LLVMFunction.verify(fn, expression);

    return this.makeClosure(fn, expressionDeclaration, env);
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

  private handleFunctionBody(declaration: Declaration, fn: LLVMValue, env?: Environment) {
    const dbg = this.generator.getDebugInfo();
    this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope(
        (bodyScope) => {
          return this.withEnvironmentPointerFromArguments(
            (environment) => {
              const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", fn.unwrapped as llvm.Function);
              this.generator.builder.setInsertionPoint(entryBlock);

              if (dbg) {
                dbg.emitProcedure(
                  declaration.unwrapped,
                  fn.unwrapped as llvm.Function,
                  declaration.name ? declaration.name.getText() : fn.name,
                  fn.name
                );
                dbg.emitLocation(declaration?.body);
              }

              if (ts.isBlock(declaration.body!) && declaration.body!.statements.length > 0) {
                declaration.body.forEachChild((node) => {
                  // @todo
                  if (ts.isReturnStatement(node) && node.expression) {
                    if (ts.isFunctionExpression(node.expression)) {
                      const closure = this.generator.handleExpression(node.expression, environment);
                      this.generator.builder.createSafeRet(closure);
                      return;
                    }
                  }

                  this.generator.handleNode(node, bodyScope, environment);
                });
              } else if (!ts.isBlock(declaration.body!)) {
                const currentReturnType = LLVMType.make(
                  this.generator.currentFunction.type.elementType.returnType,
                  this.generator
                );

                let blocklessArrowFunctionReturn = this.generator.handleExpression(declaration.body!, environment);
                blocklessArrowFunctionReturn = this.generator.builder.createBitCast(
                  blocklessArrowFunctionReturn,
                  currentReturnType
                );
                this.generator.builder.createSafeRet(blocklessArrowFunctionReturn);
              }

              if (!this.generator.isCurrentBlockTerminated) {
                if (this.generator.builder.getInsertBlock()?.name.startsWith("after.try")) {
                  const eh = new llvm.ExceptionHandlingGenerator(this.generator.module, this.generator.builder.unwrap());
                  eh.createUnreachable();
                } else {
                  const currentReturnType = LLVMType.make(
                    this.generator.currentFunction.type.elementType.returnType,
                    this.generator
                  );
                  const returnsOptional = currentReturnType.isUnion();

                  if (returnsOptional) {
                    const nullOptional = this.generator.ts.union.create();
                    this.generator.builder.createSafeRet(nullOptional);
                  } else {
                    let undef = this.generator.ts.undef.get();
                    undef = this.generator.builder.createBitCast(undef, currentReturnType);
                    this.generator.builder.createSafeRet(undef);
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
    if (dbg) {
      dbg.emitProcedureEnd(fn.unwrapped as llvm.Function);
    }
  }

  private handleConstructor(
    expression: ts.NewExpression | ts.CallExpression,
    classDeclaration: Declaration,
    constructor: LLVMValue,
    parentScope: Scope,
    env: Environment
  ): void {
    const dbg = this.generator.getDebugInfo();
    const constructorDeclaration = classDeclaration.members.find((m) => m.isConstructor());

    this.generator.withInsertBlockKeeping(() => {
      this.generator.symbolTable.withLocalScope((bodyScope) => {
        this.withEnvironmentPointerFromArguments(
          (environment) => {
            const entryBlock = llvm.BasicBlock.create(
              this.generator.context,
              "entry",
              constructor.unwrapped as llvm.Function
            );
            this.generator.builder.setInsertionPoint(entryBlock);

            if (dbg) {
              dbg.emitProcedure(
                constructorDeclaration?.unwrapped,
                constructor.unwrapped as llvm.Function,
                constructor.name,
                constructor.name
              );
            }

            const thisValueIdx = environment!.getVariableIndex("this");
            if (thisValueIdx === -1) {
              throw new Error(`Expected 'this' to be provided to constructor. Error at '${expression.getText()}'`);
            }

            const thisValuePtr = this.generator.builder.createInBoundsGEP(environment!.typed, [
              LLVMConstantInt.get(this.generator, 0),
              LLVMConstantInt.get(this.generator, thisValueIdx),
            ]);

            const isSuperCall =
              ts.isCallExpression(expression) && expression.expression.kind === ts.SyntaxKind.SuperKeyword;

            const originalThisValue = this.generator.builder.createLoad(thisValuePtr);
            let thisValue = originalThisValue;

            if (isSuperCall) {
              thisValue = this.generator.ts.obj.get(thisValue, "super");
              thisValue = this.generator.ts.union.get(thisValue);
            } else {
              this.generator.meta.setCurrentClassDeclaration(classDeclaration);
            }

            if (classDeclaration.isDerived) {
              const superValue = this.generator.ts.obj.create();

              const parentKey = this.generator.ts.str.create("parent");
              this.generator.ts.obj.set(superValue, parentKey, thisValue);

              const superKey = this.generator.ts.str.create("super");
              this.generator.ts.obj.set(thisValue, superKey, superValue);
            }

            if (isSuperCall) {
              this.generator.meta.enterSuperCall();
            }

            this.handleClassOwnProperties(expression, classDeclaration, thisValue, environment!);
            this.handleClassOwnMethods(expression, classDeclaration, thisValue, bodyScope, environment!);

            if (isSuperCall) {
              this.generator.builder.createSafeStore(thisValue, thisValuePtr);
            }

            if (constructorDeclaration) {
              constructorDeclaration.body?.forEachChild((node) => {
                this.generator.handleNode(node, bodyScope, environment);
              });
            } else if (classDeclaration.isDerived) {
              const bases = classDeclaration.getBases();
              const baseClassDeclaration = bases[0];

              const superCall = ts.createCall(ts.createSuper(), undefined, []) as ts.SuperCall;

              superCall.parent = baseClassDeclaration.unwrapped;

              this.handleSuperCall(superCall, environment);
            }

            if (isSuperCall) {
              this.generator.builder.createSafeStore(originalThisValue, thisValuePtr);
            } else {
              this.generator.meta.exitSuperCall();
              this.generator.meta.resetCurrentClassDeclaration();
            }

            this.generator.builder.createRetVoid();
          },
          (constructor.unwrapped as llvm.Function)
            .getArguments()
            .map((argument) => LLVMValue.create(argument, this.generator)),
          env
        );
      }, parentScope);
    });
    if (dbg) {
      dbg.emitProcedureEnd(constructor.unwrapped as llvm.Function);
    }
  }

  private handleClassOwnProperties(
    expression: ts.Expression,
    classDeclaration: Declaration,
    thisValue: LLVMValue,
    environment: Environment
  ) {
    classDeclaration.ownProperties.forEach((prop) => {
      if (!prop.initializer) {
        return;
      }

      if (!prop.name) {
        throw new Error(`Property name expected. Error at: '${expression.getText()}'`);
      }

      const key = this.generator.ts.str.create(prop.name.getText());
      const value = this.generator.handleExpression(prop.initializer, environment);

      this.generator.ts.obj.set(thisValue, key, value);
    });
  }

  private handleClassOwnMethods(
    expression: ts.Expression,
    classDeclaration: Declaration,
    thisValue: LLVMValue,
    bodyScope: Scope,
    environment: Environment
  ) {
    const thisType = classDeclaration.type;

    classDeclaration.getOwnMethods().forEach((method) => {
      this.generator.symbolTable.withLocalScope((scope) => {
        if (!method.name) {
          throw new Error(`Method name expected. Error at: '${expression.getText()}', method '${method.getText()}'`);
        }

        if (method.isOptional() && !method.body) {
          const key = this.generator.ts.str.create(method.name.getText());
          this.generator.ts.obj.set(thisValue, key, this.generator.ts.undef.get());
          return;
        }

        if (!method.body) {
          throw new Error(
            `Method body expected. Error at: '${expression.getText()}', method '${method.name.getText()}', declaration: '${method.getText()}'`
          );
        }

        const signature = this.generator.ts.checker.getSignatureFromDeclaration(method);
        const parameters = signature.getDeclaredParameters();
        const argumentTypes = parameters.map((p) => this.generator.ts.checker.getTypeAtLocation(p));

        const llvmArgumentTypes = argumentTypes.map((argType) => {
          if (argType.isSupported()) {
            return argType.getLLVMType();
          }

          const mapped = this.generator.symbolTable.currentScope.typeMapper.get(argType.toString());
          return mapped.getLLVMType();
        });

        // these dummy arguments will be substituted by actual arguments once called
        const dummyArguments = llvmArgumentTypes.map((t) => {
          let nullArg = LLVMConstant.createNullValue(t.unwrapPointer(), this.generator);

          const allocated = this.generator.gc.allocate(nullArg.type.unwrapPointer());
          this.generator.builder.createSafeStore(nullArg, allocated);
          nullArg = allocated;

          if (nullArg.type.isUnion()) {
            nullArg = this.generator.ts.union.create();
          }

          return nullArg;
        });

        let { qualifiedName } = FunctionMangler.mangle(
          method,
          undefined,
          thisType, // @todo
          argumentTypes,
          this.generator
        );

        const environmentVariables = ConciseBody.create(method.body, this.generator).getEnvironmentVariables(
          signature,
          scope,
          environment
        );

        const env = createEnvironment(
          scope,
          environmentVariables,
          this.generator,
          {
            args: dummyArguments,
            signature,
          },
          environment
        );

        let tsReturnType = signature.getReturnType();
        if (tsReturnType.isThisType()) {
          tsReturnType = thisType;
        }
        const llvmReturnType = tsReturnType.getLLVMReturnType();

        // @todo: handle methods once
        qualifiedName += this.generator.randomString;
        const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], qualifiedName);

        this.handleFunctionBody(method, fn, env);
        LLVMFunction.verify(fn, expression);

        const closure = this.makeClosure(fn, method, env);

        let key = method.name.getText();
        if (method.isGetAccessor()) {
          key += "__get";
        } else if (method.isSetAccessor()) {
          key += "__set";
        }

        const llvmKey = this.generator.ts.str.create(key);
        this.generator.ts.obj.set(thisValue, llvmKey, closure);
      }, bodyScope);
    });
  }

  private visitFunctionParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>) {
    parameters.forEach((parameter) => {
      addClassScope(parameter, this.generator.symbolTable.globalScope, this.generator);
    });
  }

  private isInFunction(expression: ts.Expression) {
    let parentFunction = expression.parent;

    while (parentFunction && !ts.isFunctionLike(parentFunction)) {
      parentFunction = parentFunction.parent;
    }

    return Boolean(parentFunction);
  }

  invoke(
    expression: ts.CallExpression | ts.NewExpression | ts.PropertyAccessExpression,
    declarationBody: ts.Block | ts.Expression | undefined,
    callee: LLVMValue,
    args: LLVMValue[]
  ): LLVMValue {
    // TODO REMOVE AND CHECK IT
    this.generator.emitLocation(expression);
    if (!declarationBody) return this.generator.builder.createSafeCall(callee, args);

    const { module, builder, currentFunction, context } = this.generator;

    const entry = builder.functionMetaEntry.get(declarationBody);
    if (entry && entry.needUnwind) {
      const eh = new llvm.ExceptionHandlingGenerator(module, builder.unwrap());
      if (needUnwind(expression)) {
        const lpadBB = builder.landingPadStack[builder.landingPadStack.length - 1];
        const continueBB = llvm.BasicBlock.create(context, "continue", currentFunction);
        eh.createInvoke(
          callee.unwrapped,
          continueBB,
          lpadBB,
          args.map((arg) => arg.unwrapped)
        );
        const invokeInst = builder.getInsertBlock()?.getTerminator();
        builder.setInsertionPoint(continueBB);
        return invokeInst ? LLVMValue.create(invokeInst, this.generator) : LLVMConstantInt.getFalse(this.generator);
      } else {
        const expressionBody = getInvocableBody(expression);
        if (expressionBody) this.generator.builder.functionMetaEntry.set(expressionBody, { needUnwind: true });
      }
    }
    return this.generator.builder.createSafeCall(callee, args);
  }
}

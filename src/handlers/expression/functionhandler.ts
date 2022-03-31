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
import { LLVMConstant, LLVMGlobalVariable, LLVMValue } from "../../llvm/value";
import { LLVMArrayType, LLVMStructType, LLVMType } from "../../llvm/type";
import { ConciseBody } from "../../ts/concisebody";
import { Declaration } from "../../ts/declaration";
import { Expression } from "../../ts/expression";
import { Signature } from "../../ts/signature";
import { LLVMFunction } from "../../llvm/function";

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

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature!, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);

    if (knownFunction.type.isClosure()) {
      return this.handleTSClosureCall(expression, signature, args, knownFunction);
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

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature!, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);

    if (ptr.type.unwrapPointer().isFunction()) {
      return this.generator.builder.createSafeCall(ptr, args);
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

    if (!constructorDeclaration.body) {
      throw new Error("Constructor body required");
    }

    const signature = this.generator.ts.checker.getSignatureFromDeclaration(constructorDeclaration)!;

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);

    const environmentVariables = ConciseBody.create(
      constructorDeclaration.body,
      this.generator
    ).getEnvironmentVariables(signature, parentScope, outerEnv);

    // Memory to initialization is provided by outer environment. Force its usage by mention it in variables list.
    environmentVariables.push(this.generator.internalNames.This);
    const env = createEnvironment(parentScope, environmentVariables, this.generator, { args, signature }, outerEnv);

    // mkrv: @todo: extra checks required. in fact unique suffix should be added only if there is (in)direct polymorphic calls inside constructor body
    qualifiedName += "__" + this.generator.randomString;

    const { fn: constructor } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      [env.voidStar],
      qualifiedName
    );

    this.handleConstructorBody(constructorDeclaration, constructor, env);
    setLLVMFunctionScope(constructor, parentScope, this.generator, expression);

    this.generator.builder.createSafeCall(constructor, [env.untyped]);

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
    const dummyArguments = llvmArgumentTypes.map((t, index) => {
      let nullArg = LLVMConstant.createNullValue(t.unwrapPointer(), this.generator);

      const allocated = this.generator.gc.allocate(nullArg.type.unwrapPointer());
      this.generator.builder.createSafeStore(nullArg, allocated);
      nullArg = allocated;

      const tsType = tsArgumentTypes[index];
      if (!tsType.isSymbolless() && !tsType.isEnum() && !tsType.isNumber() && !tsType.isString()) {
        const argSymbol = tsType.getSymbol();
        const argDeclaration = argSymbol.valueDeclaration;
        if (argDeclaration && !argDeclaration.isAmbient()) {
          const prototype = argDeclaration.getPrototype();
          nullArg.attachPrototype(prototype);
        }
      }

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

    this.handleFunctionBody(expressionDeclaration, fn, env);
    LLVMFunction.verify(fn, expression);

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

    const env = createEnvironment(parentScope, environmentVariables, this.generator, undefined, outerEnv);

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
      this.handleFunctionBody(valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope, this.generator, expression);
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

    if (isExternalSymbol) {
      return this.sysVFunctionHandler.handleSetAccessExpression(expression, qualifiedName, outerEnv);
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

    const env = createEnvironment(parentScope, environmentVariables, this.generator, { args, signature }, outerEnv);

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
      this.handleFunctionBody(valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope, this.generator, expression);
    }

    return this.generator.builder.createSafeCall(fn, callArgs);
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
      throw new Error("Expected property access expression");
    }

    const argumentTypes = Expression.create(expression, this.generator).getArgumentTypes();

    const bindable = expression.expression.expression;
    const bindableSymbol = this.generator.ts.checker.getTypeAtLocation(bindable).getSymbol();

    let bindableValueDeclaration = bindableSymbol.declarations.find((value: Declaration) => {
      return value.parameters.length === argumentTypes.length;
    });

    // mkrv: @todo: duplicate functionality
    if (ts.isPropertyAccessExpression(expression.expression)) {
      const propertyAccess = expression.expression;

      if (this.generator.ts.checker.nodeHasSymbolAndDeclaration(propertyAccess.expression)) {
        let propertyAccessRoot: ts.Expression = propertyAccess;
        let functionName = propertyAccess.name.getText();

        while (ts.isPropertyAccessExpression(propertyAccessRoot)) {
          functionName = propertyAccessRoot.name.getText();
          propertyAccessRoot = propertyAccessRoot.expression;
        }

        const propertyAccessRootSymbol = this.generator.ts.checker.getSymbolAtLocation(propertyAccessRoot);
        const propertyAccessDeclaration = propertyAccessRootSymbol.valueDeclaration;

        if (propertyAccessDeclaration?.isParameter()) {
          const maybePrototype = outerEnv?.getPrototype(propertyAccessRoot.getText());

          if (maybePrototype) {
            const candidates = maybePrototype.methods.filter((m) => m.name?.getText() === functionName);
            if (candidates.length === 0) {
              throw new Error(
                `Unable to find '${functionName}' in prototype of '${propertyAccessDeclaration.getText()}'`
              );
            }

            const isSuperAccess = propertyAccessRoot.kind === ts.SyntaxKind.SuperKeyword;
            if (isSuperAccess && candidates.length < 2) {
              throw new Error(
                `Unable to find '${functionName}' in prototype of '${propertyAccessDeclaration.getText()}' for base class`
              );
            }

            // methods in prototype are in order from derived to base, so in case of 'super' access take previous one declaration
            const methodIndex = isSuperAccess ? 1 : 0;
            const functionDeclaration = candidates[methodIndex];

            bindableValueDeclaration = functionDeclaration;
          }
        }
      }
    }

    if (!bindableValueDeclaration) {
      bindableValueDeclaration = bindableSymbol.declarations[0];
    }

    if (!bindableValueDeclaration.body) {
      throw new Error(`No function declaration body found at '${expression.getText()}'`);
    }

    const bindableSignature = this.generator.ts.checker.getSignatureFromDeclaration(bindableValueDeclaration)!;

    const thisArg = this.generator.handleExpression(expression.arguments[0], outerEnv);
    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, bindableSignature, localScope, outerEnv, true);
    }, this.generator.symbolTable.currentScope);

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
      const dummyArguments = llvmArgumentTypes.slice(fixesArgsCount).map((t) => {
        const nullArg = LLVMConstant.createNullValue(t.unwrapPointer(), this.generator);

        let allocated = this.generator.gc.allocate(nullArg.type.unwrapPointer());
        this.generator.builder.createSafeStore(nullArg, allocated);

        if (nullArg.type.isUnion()) {
          allocated = this.generator.ts.union.create();
        }

        return allocated;
      });

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
      outerEnv
    );
    e.fixedArgsCount = fixesArgsCount;

    const tsReturnType = bindableSignature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const { fn } = this.generator.llvm.function.create(llvmReturnType, [e.voidStar], this.generator.randomString);

    this.handleFunctionBody(bindableValueDeclaration, fn, e);
    LLVMFunction.verify(fn, expression);

    const functionType = this.generator.ts.checker.getTypeAtLocation(bindable);
    return this.makeClosure(fn, functionType, e);
  }

  ss: LLVMValue | undefined;

  private handleCallExpression(expression: ts.CallExpression, outerEnv?: Environment): LLVMValue {
    const argumentTypes = Expression.create(expression, this.generator).getArgumentTypes();

    if (ts.isPropertyAccessExpression(expression.expression)) {
      const propertySymbol = this.generator.ts.checker.getSymbolAtLocation(expression.expression.name);

      if (propertySymbol.isProperty() || propertySymbol.isOptionalMethod()) {
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
          const initializerType = declaration.type;
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

          const closure = this.makeClosure(fn, initializerType, e);

          return this.handleTSClosureCall(expression, signature, args, closure);
        }

        throw new Error(`Unhandled call '${expression.getText()}'`);
      }
    }

    const isMethod = Expression.create(expression.expression, this.generator).isMethod();
    let thisType: TSType | undefined;

    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      thisType = this.generator.ts.checker.getTypeAtLocation(propertyAccess.expression);
    }

    const symbol = this.generator.ts.checker.getTypeAtLocation(expression.expression).getSymbol();

    let valueDeclaration =
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

      if (thisVal.hasPrototype()) {
        const prototype = thisVal.getPrototype();

        const functionName = propertyAccess.name.getText();
        const candidates = prototype.methods.filter((m) => m.name?.getText() === functionName);
        if (candidates.length === 0) {
          throw new Error(`Unable to find '${functionName}' in prototype of '${thisVal.type.toString()}'`);
        }

        const isSuperAccess = propertyAccess.expression.kind === ts.SyntaxKind.SuperKeyword;
        if (isSuperAccess && candidates.length < 2) {
          throw new Error(
            `Unable to find '${functionName}' in prototype of '${thisVal.type.toString()}' for base class`
          );
        }

        // methods in prototype are in order from derived to base, so in case of 'super' access take previous one declaration
        const methodIndex = isSuperAccess ? 1 : 0;
        const functionDeclaration = candidates[methodIndex];

        valueDeclaration = functionDeclaration;
        thisType = isSuperAccess
          ? this.generator.ts.checker.getTypeAtLocation(functionDeclaration.parent)
          : prototype.parentType;

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

    let env = createEnvironment(
      parentScope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv,
      isMethod
    );

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
    if (llvmThisType) {
      llvmArgumentTypes.push(llvmThisType);
    }

    let functionName = qualifiedName + "__" + valueDeclaration.unique;

    const haveArgumentWithPrototype = args.some((arg) => arg.hasPrototype());
    const haveLazyClosureArgument = args.some((arg) => this.generator.tsclosure.lazyClosure.isLazyClosure(arg));

    if (haveArgumentWithPrototype || haveLazyClosureArgument) {
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
      this.handleFunctionBody(valueDeclaration, fn, env);
      setLLVMFunctionScope(fn, parentScope, this.generator, expression);
    }

    return this.generator.builder.createSafeCall(fn, callArgs);
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
      const parameter = parameters[index];
      const parameterName = parameter.escapedName.toString();
      const parameterDeclaration = parameter.valueDeclaration || parameter.declarations[0];
      const parameterType = parameterDeclaration.type;

      let value = this.generator.handleExpression(argument, outerEnv);

      if (value.isTSPrimitivePtr()) {
        // mimics 'value' semantic for primitives
        value = value.clone();
      }

      if (parameterType.isSupported()) {
        const parameterLLVMType = parameterType.getLLVMType();

        if (parameterLLVMType.isUnion() && !value.type.isUnion()) {
          value = this.generator.ts.union.create(value);
        }
      }

      scope.set(parameterName, value);
      if (outerEnv && value.hasPrototype()) {
        outerEnv.setPrototype(parameterName, value.getPrototype());
      }

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

  private makeClosure(fn: LLVMValue, functionType: TSType, env: Environment) {
    const functionDeclaration = functionType.getSymbol().declarations[0];
    const closure = this.generator.tsclosure.createClosure(fn, env.untyped, functionDeclaration);
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
      addClassScope(expression, this.generator.symbolTable.globalScope, this.generator);
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
    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);

    const parentScope = valueDeclaration.getScope(thisType);

    const thisValue = this.generator.ts.obj.create();
    thisValue.attachPrototype(valueDeclaration.getPrototype());

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
      /* prefer local this = */ true
    );

    if (args.some((arg) => arg.hasPrototype())) {
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
      setLLVMFunctionScope(constructor, parentScope, this.generator, expression);
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

      const env = createEnvironment(parentScope, environmentVariables, this.generator, undefined, outerEnv);

      const tsReturnType = signature.getReturnType();
      const llvmReturnType = tsReturnType.getLLVMReturnType();

      const functionName = method.name.getText() + "__" + this.generator.randomString;

      const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

      this.handleFunctionBody(method, fn, env);
      LLVMFunction.verify(fn, valueDeclaration);

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
      let nullArg = LLVMConstant.createNullValue(t.unwrapPointer(), this.generator);

      const allocated = this.generator.gc.allocate(nullArg.type.unwrapPointer());
      this.generator.builder.createSafeStore(nullArg, allocated);
      nullArg = allocated;

      const tsType = tsArgumentTypes[index];
      if (!tsType.isSymbolless()) {
        const argSymbol = tsType.getSymbol();
        const argDeclaration = argSymbol.valueDeclaration;
        if (argDeclaration && !argDeclaration.isAmbient()) {
          const prototype = argDeclaration.getPrototype();
          nullArg.attachPrototype(prototype);
        }
      }

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

    this.handleFunctionBody(expressionDeclaration, fn, env);
    LLVMFunction.verify(fn, expression);

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

  private handleFunctionBody(declaration: Declaration, fn: LLVMValue, env?: Environment) {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope(
        (bodyScope) => {
          return this.withEnvironmentPointerFromArguments(
            (environment) => {
              const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", fn.unwrapped as llvm.Function);
              this.generator.builder.setInsertionPoint(entryBlock);

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
              } else if (ts.isBlock(declaration.body!)) {
                // Empty block
                // @todo
                this.generator.builder.createRetVoid();
              } else {
                const blocklessArrowFunctionReturn = this.generator.handleExpression(declaration.body!, environment);
                if ((this.generator.currentFunction.type.elementType as llvm.FunctionType).returnType.isVoidTy()) {
                  this.generator.builder.createRetVoid();
                } else {
                  this.generator.builder.createSafeRet(blocklessArrowFunctionReturn);
                }
              }

              if (!this.generator.isCurrentBlockTerminated) {
                const currentReturnType = LLVMType.make(
                  this.generator.currentFunction.type.elementType.returnType,
                  this.generator
                );
                const returnsOptional = currentReturnType.isUnion();

                if (returnsOptional) {
                  const nullOptional = this.generator.ts.union.create();
                  this.generator.builder.createSafeRet(nullOptional);
                } else {
                  this.generator.builder.createRetVoid();
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

  private isInFunction(expression: ts.Expression) {
    let parentFunction = expression.parent;

    while (parentFunction && !ts.isFunctionLike(parentFunction)) {
      parentFunction = parentFunction.parent;
    }

    return Boolean(parentFunction);
  }
}

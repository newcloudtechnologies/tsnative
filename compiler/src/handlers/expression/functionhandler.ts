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

import { GenericTypeMapper, LLVMGenerator, MetaInfoStorage } from "../../generator";
import { FunctionMangler } from "../../mangling";
import {
  setLLVMFunctionScope,
  addClassScope,
  Scope,
  Environment,
  createEnvironment,
} from "../../scope";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { SysVFunctionHandler } from "./functionhandler_sysv";
import { last } from "lodash";
import { TSType } from "../../ts/type";
import { LLVMConstantInt, LLVMGlobalVariable, LLVMValue } from "../../llvm/value";
import { LLVMArrayType, LLVMType } from "../../llvm/type";
import { ConciseBody } from "../../ts/concisebody";
import { Declaration } from "../../ts/declaration";
import { Expression } from "../../ts/expression";
import { Signature } from "../../ts/signature";
import { LLVMFunction } from "../../llvm/function";
import { getInvocableBody, needUnwind } from "../../builder/builder";
import { TSSymbol } from "../../ts/symbol";
import { DummyArgumentsCreator } from "../dummyargumentscreator";
import { VariableFinder } from "../variablefinder"

export class FunctionHandler extends AbstractExpressionHandler {
  private readonly sysVFunctionHandler: SysVFunctionHandler;
  private readonly dummyArgsCreator: DummyArgumentsCreator;

  constructor(generator: LLVMGenerator) {
    super(generator);
    this.sysVFunctionHandler = new SysVFunctionHandler(generator);
    this.dummyArgsCreator = new DummyArgumentsCreator(this.generator);
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
            throw new Error(`Unhandled property access '${expression.getText()}'`);
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

        return this.generator.symbolTable.withLocalScope(
          (_: Scope) => this.handleCallExpression(call, env),
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

  private storeActualArguments(args: LLVMValue[], closureFunctionData: LLVMValue, fixedArgsCount?: number) {
    // Closure data consists of null-valued arguments. Replace dummy arguments with actual ones.
    for (let i = 0; i < args.length; ++i) {
      const elementPtrPtrPtr = this.generator.builder.createSafeInBoundsGEP(closureFunctionData, [
        0,
        i + (fixedArgsCount || 0),
      ]);

      let argument = args[i];
      if (elementPtrPtrPtr.type.getPointerLevel() !== 3 || argument.type.getPointerLevel() !== 1) {
        throw new Error("Env element should be ** and function argument should be *");
      }

      const elementPtrPtr = this.generator.builder.createLoad(elementPtrPtrPtr);

      this.generator.builder.createSafeStore(argument, elementPtrPtr);
    }
  }

  private handleLazyClosureCall(expression: ts.CallExpression,
    valueDeclaration: Declaration,
    signature: Signature,
    lazyClosure: LLVMValue,
    outerEnv?: Environment) {

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

    const registeredEnvironment = this.generator.meta.getFunctionEnvironment(valueDeclaration);
    const passedEnvironment = this.generator.tsclosure.lazyClosure.retrieveEnviroment(lazyClosure);

    registeredEnvironment.untyped = passedEnvironment;

    let env = createEnvironment(
      this.generator.symbolTable.currentScope,
      environmentVariables,
      this.generator,
      {
        signature,
        args,
      },
      outerEnv
    );

    env = Environment.merge(env, [registeredEnvironment], this.generator);

    const tsReturnType = signature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const functionName = this.generator.randomString;
    const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

    FunctionHandler.handleFunctionBody(valueDeclaration, fn, this.generator, env);
    LLVMFunction.verify(fn, expression);

    const closure = this.makeClosure(fn, valueDeclaration, env);
    const closureCall = this.generator.tsclosure.getLLVMCall();
    const callResult = this.invoke(expression, valueDeclaration.body, closureCall, [closure]);

    return this.generator.builder.createBitCast(callResult, llvmReturnType);
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
    } else if (tsReturnType.isThisType()) {
      llvmReturnType = this.generator.ts.obj.getLLVMType();
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

    let adjustedArgs: LLVMValue[] = []
    if (withRestParameters) {
      adjustedArgs = args.map((arg, index) => {
        const llvmArgType = types[index];
        if (!arg.type.equals(llvmArgType)) {
          if (llvmArgType.isUnion()) {
            arg = this.generator.ts.union.create(arg);
          }
        }
        return arg;
      });
    } else {
      adjustedArgs = types.map((type, index) => {
        let arg = args[index];
        if (!arg) {
          return this.generator.ts.union.create();
        }

        if (!arg.type.equals(type)) {
          if (type.isUnion()) {
            arg = this.generator.ts.union.create(arg);
          }
        }
        return arg;
      });
    }

    const fixedArgsCount = this.generator.meta.getFixedArgsCount(closure);

    const getEnvironment = this.generator.tsclosure.getLLVMGetEnvironment();
    const environment = this.generator.builder.createSafeCall(getEnvironment, [closure]);
    const environmentAsArray = this.generator.builder.createBitCast(
      environment,
      LLVMArrayType.get(
        this.generator,
        LLVMType.getInt8Type(this.generator).getPointer().getPointer(),
        fixedArgsCount + args.length
      ).getPointer()
    );

    this.storeActualArguments(adjustedArgs, environmentAsArray, fixedArgsCount);

    const closureCall = this.generator.tsclosure.getLLVMCall();

    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);

    const valueDeclaration = !type.isSymbolless() ? type.getSymbol().valueDeclaration : undefined;
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

    const currentScope = this.generator.symbolTable.currentScope;

    if (isExternalSymbol) {
      if (!outerEnv) {
        throw new Error(`Expected outer environment to be provided at '${expression.getText()}'`);
      }

      const thisValueIdx = outerEnv.getVariableIndex("this");
      if (thisValueIdx === -1) {
        throw new Error(`Expected 'this' to be provided to constructor. Error at '${expression.getText()}'`);
      }

      const thisValuePtrPtrPtr = this.generator.builder.createInBoundsGEP(outerEnv.typed, [
        LLVMConstantInt.get(this.generator, 0),
        LLVMConstantInt.get(this.generator, thisValueIdx),
      ]);

      const cxxObjectType = valueDeclaration.type.getLLVMType();
      const memoryPtr = this.generator.gc.allocate(cxxObjectType.getPointerElementType());
      let memoryPtrPtr = this.generator.gc.allocate(cxxObjectType);

      this.generator.builder.createSafeStore(memoryPtr, memoryPtrPtr);

      memoryPtrPtr = this.generator.builder.createBitCast(memoryPtrPtr, this.generator.ts.obj.getLLVMType().getPointer());

      const tsThisValuePtr = thisValuePtrPtrPtr.derefToPtrLevel1();

      this.generator.builder.createSafeStore(memoryPtrPtr, thisValuePtrPtrPtr);

      const cxxObject = this.sysVFunctionHandler.handleNewExpression(expression, qualifiedName, outerEnv)

      this.generator.ts.obj.copyProps(tsThisValuePtr, cxxObject);

      return cxxObject;
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
          ...ConciseBody.create(body, this.generator).getEnvironmentVariables(signature, currentScope, outerEnv)
        );
      }
    }

    environmentVariables.push(...valueDeclaration.environmentVariables(expression, currentScope, outerEnv));
    environmentVariables.push(this.generator.internalNames.This);

    const env = createEnvironment(currentScope, environmentVariables, this.generator, { args, signature }, outerEnv);

    // hack for polymorphic 'this' using
    qualifiedName += this.generator.randomString;

    const { fn: constructor } = this.generator.llvm.function.create(
      LLVMType.getVoidType(this.generator),
      [env.voidStar],
      qualifiedName
    );
    this.handleConstructor(expression, valueDeclaration, constructor, currentScope, env);

    setLLVMFunctionScope(constructor, parentScope, this.generator, expression, false);

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
    const scope = this.generator.symbolTable.currentScope;

    this.generator.symbolTable.currentScope.initializeVariablesAndFunctionDeclarations(expression.body, this.generator);

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
    const dummyArguments = this.dummyArgsCreator.create(llvmArgumentTypes);

    const env = createEnvironment(
      scope,
      environmentVariables,
      this.generator,
      { args: dummyArguments, signature },
      outerEnv
    );

    if (declaration.typeParameters) {
      this.generator.meta.registerFunctionEnvironment(expressionDeclaration, env);
      return this.generator.tsclosure.lazyClosure.create(env);
    }

    const tsReturnType = signature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const random = this.generator.randomString;
    const functionName = ts.isVariableDeclaration(expression.parent) ? `${expression.parent.name.getText()}__arrowfn__${random}` : random;

    const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

    FunctionHandler.handleFunctionBody(expressionDeclaration, fn, this.generator, env);
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

    const thisType = this.generator.ts.checker.getTypeAtLocation(valueDeclaration.parent);

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

    if (!valueDeclaration.isStatic()) {
      const thisValue = this.generator.handleExpression(expression.expression, outerEnv).derefToPtrLevel1();

      const key = valueDeclaration.name.getText() + "__get";

      let getterClosure = this.generator.ts.obj.get(thisValue, key);
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
        FunctionHandler.handleFunctionBody(valueDeclaration, fn, this.generator, env);
        setLLVMFunctionScope(fn, parentScope, this.generator, expression, false);
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

    let thisType: TSType | undefined;
    if (!valueDeclaration.isStatic()) {
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
    const value = this.generator.handleExpression(parent.right, outerEnv).derefToPtrLevel1();

    if (!valueDeclaration.isStatic()) {
      const thisValue = this.generator.handleExpression(expression.expression, outerEnv).derefToPtrLevel1();

      const args = [value];

      const key = valueDeclaration.name.getText() + "__set";

      let setterClosure = this.generator.ts.obj.get(thisValue, key);
      setterClosure = this.generator.builder.createBitCast(setterClosure, this.generator.tsclosure.getLLVMType());

      const getEnvironment = this.generator.tsclosure.getLLVMGetEnvironment();
      const environment = this.generator.builder.createSafeCall(getEnvironment, [setterClosure]);
      const environmentAsArray = this.generator.builder.createBitCast(
        environment,
        LLVMArrayType.get(this.generator, LLVMType.getInt8Type(this.generator).getPointer().getPointer(), args.length).getPointer()
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
        FunctionHandler.handleFunctionBody(valueDeclaration, fn, this.generator, env);
        setLLVMFunctionScope(fn, parentScope, this.generator, expression, false);
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
    let thisValuePtrPtr: LLVMValue | undefined;
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

      thisValuePtrPtr = this.generator.builder.createInBoundsGEP(outerEnv!.typed, [
        LLVMConstantInt.get(this.generator, 0),
        LLVMConstantInt.get(this.generator, thisValueIdx),
      ]);
      thisValuePtr = this.generator.builder.createLoad(thisValuePtrPtr);

      originalThisValue = thisValuePtr.derefToPtrLevel1();
      let thisValue = this.generator.handleExpression(expression.expression.expression.expression, outerEnv).derefToPtrLevel1();
      thisValue = this.generator.ts.obj.get(thisValue, "parent");

      this.generator.builder.createSafeStore(thisValue, thisValuePtr);
    }

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature, localScope, outerEnv, !valueDeclaration.isMethod());
    }, this.generator.symbolTable.currentScope);

    const functionToBind = this.generator.handleExpression(bindable, outerEnv).derefToPtrLevel1();

    if (originalThisValue && thisValuePtr) {
      this.generator.builder.createSafeStore(originalThisValue, thisValuePtr);
    }

    const getEnvironment = this.generator.tsclosure.getLLVMGetEnvironment();
    const environment = this.generator.builder.createSafeCall(getEnvironment, [functionToBind]);
    const environmentAsArray = this.generator.builder.createBitCast(
      environment,
      LLVMArrayType.get(this.generator, LLVMType.getInt8Type(this.generator).getPointer().getPointer(), args.length).getPointer()
    );

    this.storeActualArguments(args, environmentAsArray);

    this.generator.meta.registerFixedArgsCount(functionToBind, args.length);

    return functionToBind;
  }

  private tryCallMethod(expression: ts.CallExpression, outerEnv?: Environment) {
    // method calling is always property access
    if (!ts.isPropertyAccessExpression(expression.expression)) {
      return;
    }

    const rootType = this.generator.ts.checker.getTypeAtLocation(expression.expression.expression);
    // functions from namespaces are not a methods
    if (rootType.isNamespace()) {
      return;
    }

    const functionType = this.generator.ts.checker.getTypeAtLocation(expression.expression);

    // external method calls are handled using CXX symbols search
    if (functionType.isAmbient()) {
      return;
    }

    // static methods calls handling require value declaration
    if (functionType.isStaticFunctionType()) {
      return;
    }

    return this.handleMethodCall(expression.expression, outerEnv);
  }

  private handleCallExpression(expression: ts.CallExpression, outerEnv?: Environment): LLVMValue {
    const maybeMethodCalled = this.tryCallMethod(expression, outerEnv);
    if (maybeMethodCalled) {
      return maybeMethodCalled;
    }

    const isMethod = Expression.create(expression.expression, this.generator).isMethod();
    let thisType: TSType | undefined;

    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      thisType = this.generator.ts.checker.getTypeAtLocation(propertyAccess.expression);
    }

    const functionType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const symbol = functionType.getSymbol();

    const argumentTypes = Expression.create(expression, this.generator).getArgumentTypes();
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

    const thisTypeForMangling = valueDeclaration.isStatic()
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

    if (valueDeclaration.isStatic()) {
      return this.handleStaticMethodCall(expression, signature, valueDeclaration, qualifiedName, outerEnv);
    }

    const functionToCallPtrPtr = this.generator.handleExpression(expression.expression, outerEnv);
    let functionToCall = functionToCallPtrPtr.derefToPtrLevel1();
    if (functionToCall.type.isUnion()) {
      functionToCall = this.generator.ts.union.get(functionToCall);
    }

    this.generator.meta.registerFixedArgsCount(functionToCall, this.generator.meta.getFixedArgsCount(functionToCallPtrPtr));

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);

    if (functionToCall.type.isLazyClosure()) {
      return this.handleLazyClosureCall(expression, valueDeclaration, resolvedSignature, functionToCall, outerEnv);
    }

    const declaredLLVMFunctionType = this.generator.tsclosure.getLLVMType();
    return this.handleTSClosureCall(
      expression,
      resolvedSignature,
      args,
      this.generator.builder.createBitCast(functionToCall, declaredLLVMFunctionType)
    );
  }

  private handleMethodCall(expression: ts.PropertyAccessExpression, outerEnv?: Environment) {
    const propertyAccessExpression = expression;
    const callExpression = expression.parent as ts.CallExpression;

    let object: LLVMValue;
    if (propertyAccessExpression.expression.kind === ts.SyntaxKind.SuperKeyword) {
      if (!outerEnv) {
        throw new Error(
          `Expected environment to be provided at 'super' access point. Error at '${callExpression.getText()}'`
        );
      }

      const thisValueIdx = outerEnv.getVariableIndex("this");
      if (thisValueIdx === -1) {
        throw new Error(
          `Expected 'this' to be provided at 'super' access point. Error at '${callExpression.getText()}'`
        );
      }

      const thisValuePtrPtrPtr = this.generator.builder.createInBoundsGEP(outerEnv.typed, [
        LLVMConstantInt.get(this.generator, 0),
        LLVMConstantInt.get(this.generator, thisValueIdx!),
      ]);

      const thisValuePtrPtr = this.generator.builder.createLoad(thisValuePtrPtrPtr);
      const thisValuePtr = this.generator.builder.createLoad(thisValuePtrPtr);
      object = this.generator.ts.obj.get(thisValuePtr, "super");
    } else {
      object = this.generator.handleExpression(propertyAccessExpression.expression, outerEnv).derefToPtrLevel1();

      if (propertyAccessExpression.expression.getText() === "this" && this.generator.meta.inSuperCall()) {
        object = this.generator.ts.obj.get(object, "parent");
      }

      // 'obj.method()' where obj is of type T | U and T and U have no common base 'obj' is a union
      // extract a value
      if (object.type.isUnion()) {
        object = this.generator.ts.union.get(object);
      }
    }

    const objectType = this.generator.ts.checker.getTypeAtLocation(propertyAccessExpression.expression);
    const methodType = this.generator.ts.checker.getTypeAtLocation(propertyAccessExpression.name);

    let signature: Signature;

    if (!methodType.isSymbolless()) {
      const symbol = methodType.getSymbol();

      const declaration = symbol.valueDeclaration || symbol.declarations[0];
      signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);
    } else {
      // signatures are merged into one:
      // (() => string | () => number) ---> () => string | number
      // ((_: string) => string | () => number) ---> (_: string) => string | number
      // and so on
      signature = this.generator.ts.checker.getSignaturesOfType(methodType)[0];
    }

    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(callExpression, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);


    const methodName = propertyAccessExpression.name.getText();
    let closure = this.generator.ts.obj.get(object, methodName);
    const methodSymbol = objectType.getProperty(methodName);

    if (methodSymbol.isOptional() || methodSymbol.valueDeclaration?.isMethodDeclaredOptional()) {
      closure = this.generator.ts.union.get(closure);
    }

    closure = this.generator.builder.createBitCast(closure, this.generator.tsclosure.getLLVMType());

    return this.handleTSClosureCall(callExpression, signature, args, closure);
  }

  private handleStaticMethodCall(expression: ts.CallExpression, signature: Signature, valueDeclaration: Declaration, qualifiedName: string, outerEnv?: Environment) {
    const args = this.generator.symbolTable.withLocalScope((localScope: Scope) => {
      return this.handleCallArguments(expression, signature, localScope, outerEnv);
    }, this.generator.symbolTable.currentScope);

    if (!valueDeclaration.body) {
      throw new Error(`Function body required for '${qualifiedName}'. Error at '${expression.getText()}'`);
    }

    const scope = this.generator.symbolTable.currentScope;

    const environmentVariables: string[] = [];

    environmentVariables.push(
      ...ConciseBody.create(valueDeclaration.body, this.generator).getEnvironmentVariables(
        signature,
        scope,
        outerEnv
      )
    );

    const env = createEnvironment(
      scope,
      environmentVariables,
      this.generator,
      { args, signature },
      outerEnv
    );

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);
    const tsReturnType = resolvedSignature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const llvmArgumentTypes = [env.voidStar];

    qualifiedName += "__static";

    const creationResult = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);
    const { fn } = creationResult;
    const { existing } = creationResult;

    // All the actual arguments are passing by typeless environment.
    const callArgs = [env.untyped];

    if (!existing) {
      FunctionHandler.handleFunctionBody(valueDeclaration, fn, this.generator, env);
      setLLVMFunctionScope(fn, scope, this.generator, expression);
    }

    return this.invoke(expression, valueDeclaration.body, fn, callArgs);
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

    const handledArgs: LLVMValue[] = [];

    const parameters = signature.getParameters();
    const lastParameter = parameters[parameters.length - 1];

    // rest parameters for cxx-declared functions are considered to be variadic templates
    // @todo maybe rest parameters should be represented as array on cxx side?
    const ambient = Boolean(lastParameter?.valueDeclaration?.isAmbient());
    const withRestParameters = Boolean(lastParameter?.valueDeclaration?.dotDotDotToken) && !ambient;

    const restArgumentsStartIndex = withRestParameters ? parameters.length - 1 : 0;
    const nonRestArguments = args.slice(0, withRestParameters ? restArgumentsStartIndex : args.length);

    nonRestArguments.forEach((argument, index) => {
      let value = this.generator.handleExpression(argument, outerEnv).derefToPtrLevel1();

      if (value.isTSPrimitivePtr()) {
        // mimics 'value' semantic for primitives
        value = value.clone();
      }

      const parameter = parameters[index];

      if (parameter && !parameter.valueDeclaration?.dotDotDotToken) {
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
      }

      handledArgs.push(value);
    });

    if (withRestParameters) {
      const restArguments = this.handleCallRestArguments(args, lastParameter, restArgumentsStartIndex, scope, outerEnv);
      handledArgs.push(restArguments);
    }

    const defaultArguments = this.handleCallDefaultArguments(parameters, handledArgs.length, scope, outerEnv);
    handledArgs.push(...defaultArguments);

    return handledArgs;
  }

  private handleCallDefaultArguments(parameters: TSSymbol[], startIndex: number, scope: Scope, outerEnv?: Environment) {
    const defaultArguments: LLVMValue[] = [];

    for (let i = startIndex; i < parameters.length; ++i) {
      const parameterSymbol = parameters[i];

      const parameterDeclaration = parameterSymbol.valueDeclaration;
      if (!parameterDeclaration) {
        throw new Error(`Unable to find declaration for parameter '${parameterSymbol.escapedName}'`);
      }

      const defaultInitializer = parameterDeclaration.initializer;
      if (!defaultInitializer) {
        continue;
      }

      const handledDefaultParameter = this.generator.handleExpression(defaultInitializer, outerEnv).derefToPtrLevel1();
      const parameterName = parameters[i].escapedName.toString();

      scope.set(parameterName, handledDefaultParameter);
      defaultArguments.push(handledDefaultParameter);
    }

    return defaultArguments;
  }

  private handleCallRestArguments(args: ts.Expression[], lastParameter: TSSymbol, restArgumentsStartIndex: number, scope: Scope, outerEnv?: Environment) {
    const fakeLiteral = ts.createArrayLiteral();
    fakeLiteral.parent = lastParameter.valueDeclaration!.unwrapped;

    const arrayType = lastParameter.valueDeclaration!.type;

    let arrayPtr = this.generator.gc.allocateObject(this.generator.ts.array.getLLVMType().getPointerElementType());
    this.generator.ts.array.callDefaultConstructor(this.generator.builder.asVoidStar(arrayPtr), arrayType);

    for (let i = restArgumentsStartIndex; i < args.length; ++i) {
      const arg = args[i];
      const isSpread = ts.isSpreadElement(arg);

      const expr = isSpread ? (arg as ts.SpreadElement).expression : arg;
      let value = this.generator.handleExpression(expr, outerEnv).derefToPtrLevel1();

      if (value.type.isArray()) {
        arrayPtr = value;
        continue;
      }

      if (value.isTSPrimitivePtr()) {
        // mimics 'value' semantic for primitives
        value = value.clone();
      }

      this.generator.ts.array.callPush(arrayType, arrayPtr, value, isSpread);
    }

    scope.set(lastParameter.escapedName.toString(), arrayPtr);
    return arrayPtr;
  }

  private makeClosure(fn: LLVMValue, functionDeclaration: Declaration, env: Environment) {
    return this.generator.tsclosure.createClosure(fn, env, functionDeclaration);
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

    let matchingConstructorDeclaration = valueDeclaration.findConstructor(argumentTypes);
    const hasDeclaredConstructor = valueDeclaration.getConstructors().length > 0;
    if (hasDeclaredConstructor && !matchingConstructorDeclaration) {
      throw new Error(`Unable to find constructor matching arguments`);
    }

    const classWithoutConstructor = !hasDeclaredConstructor;

    if (!matchingConstructorDeclaration) {
      matchingConstructorDeclaration = Declaration.create(
        ts.createConstructor(undefined, undefined, [], undefined),
        this.generator
      );
    }

    const manglingResult = FunctionMangler.mangle(
      matchingConstructorDeclaration,
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

    let thisValuePtr = this.getThisForConstructorCall(expression, outerEnv);

    const scope = this.generator.symbolTable.currentScope;
    scope.setOrAssign(this.generator.internalNames.This, thisValuePtr);

    let signature: Signature | undefined;
    const args: LLVMValue[] = [];

    if (!classWithoutConstructor) {
      signature = this.generator.ts.checker.getSignatureFromDeclaration(matchingConstructorDeclaration);
      args.push(
        ...this.generator.symbolTable.withLocalScope((localScope: Scope) => {
          return this.handleCallArguments(expression, signature!, localScope, outerEnv);
        }, this.generator.symbolTable.currentScope)
      );
    }

    if (!classWithoutConstructor && !matchingConstructorDeclaration.body) {
      throw new Error(`Constructor body required at '${expression.getText()}'`);
    }

    const environmentVariables: string[] = [];

    if (matchingConstructorDeclaration.body || valueDeclaration.isDerived) {
      const baseClassConstructorDeclaration = valueDeclaration.isDerived
        ? valueDeclaration.getBases()[0].members.find((m) => m.isConstructor())
        : undefined;
      const body = matchingConstructorDeclaration.body || baseClassConstructorDeclaration?.body;

      if (body) {
        scope.initializeVariablesAndFunctionDeclarations(body, this.generator);
        environmentVariables.push(
          ...ConciseBody.create(body, this.generator).getEnvironmentVariables(signature, scope, outerEnv)
        );
      }
    }

    scope.initializeVariablesAndFunctionDeclarations(expression, this.generator);
    environmentVariables.push(...valueDeclaration.environmentVariables(expression, scope, outerEnv));
    environmentVariables.push(this.generator.internalNames.This);

    const env = createEnvironment(
      scope,
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
      this.populateGenericTypes(valueDeclaration, scope);

      if (expression.typeArguments) {
        const declaredTypeParameters = valueDeclaration.typeParameters;
        if (!declaredTypeParameters) {
          throw new Error(
            `Expected type parameters in value declaration: '${valueDeclaration.getText()}'. Error at: '${expression.getText()}'`
          );
        }

        expression.typeArguments.forEach((typeArg, index) => {
          const type = this.generator.ts.checker.getTypeFromTypeNode(typeArg);
          scope.typeMapper.register(declaredTypeParameters[index].getText(), type);
        });
      }

      this.handleConstructor(expression, valueDeclaration, constructor, scope, env);
      setLLVMFunctionScope(constructor, scope, this.generator, expression, false);
    }

    const body = matchingConstructorDeclaration.isFunctionLike() ? matchingConstructorDeclaration.body : undefined;
    this.invoke(expression, body, constructor, [env.untyped]);

    if (valueDeclaration.cxxBase) {
      const thisValueIdx = env.getVariableIndex("this");
      if (thisValueIdx === -1) {
        throw new Error(`Expected 'this' to be provided for CXX-derived class at '${expression.getText()}'`);
      }

      const thisValuePtrFromEnv = this.generator.builder.createInBoundsGEP(env.typed, [
        LLVMConstantInt.get(this.generator, 0),
        LLVMConstantInt.get(this.generator, thisValueIdx),
      ]);

      thisValuePtr = this.generator.builder.createLoad(thisValuePtrFromEnv);
      thisValuePtr = this.generator.builder.createBitCast(thisValuePtr, valueDeclaration.type.getLLVMType().getPointer());
    }

    this.patchVTable(valueDeclaration, scope, thisValuePtr.derefToPtrLevel1(), env);

    return thisValuePtr;
  }

  private getThisForConstructorCall(expression: ts.NewExpression, outerEnv?: Environment) {
    const isVariableDeclaration = ts.isVariableDeclaration(expression.parent);
    const isReassignment = ts.isBinaryExpression(expression.parent) && expression.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(expression.parent.left);

    if (!isVariableDeclaration && !isReassignment) {
      return this.generator.ts.obj.create();
    }

    let variableName = "";

    if (isVariableDeclaration) {
      variableName = (expression.parent as ts.VariableDeclaration).name.getText();
    } else {
      variableName = (expression.parent as ts.BinaryExpression).left.getText();
    }

    const varFinder = new VariableFinder(this.generator);
    const hoistedPtrPtr = varFinder.find(variableName, outerEnv);
    if (!hoistedPtrPtr || !(hoistedPtrPtr instanceof LLVMValue)) {
      throw new Error(`Expected hoisted variable '${variableName}' should be LLVMValue with ** inside`);
    }

    let hoisted = this.generator.builder.createLoad(hoistedPtrPtr);
    if (hoisted.type.isUnion()) {
      this.generator.ts.union.set(hoisted, this.generator.ts.obj.create());
      hoisted = this.generator.ts.union.get(hoisted);
    }

    return this.generator.builder.createBitCast(hoisted, this.generator.ts.obj.getLLVMType());
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

      FunctionHandler.handleFunctionBody(method, fn, this.generator, env);
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
        return this.generator.symbolTable.withLocalScope((_: Scope) => {
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
      },
      this.generator.symbolTable.currentScope)});

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
      const objectVirtualMethodsCount = 5; // @todo: how this can be non-handcoded?

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

    const scope = this.generator.symbolTable.currentScope;
    const dummyArguments = this.dummyArgsCreator.create(llvmArgumentTypes);

    this.generator.symbolTable.currentScope.initializeVariablesAndFunctionDeclarations(expression.body, this.generator);

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
      this.generator.meta.registerFunctionEnvironment(declaration, env);
      return this.generator.tsclosure.lazyClosure.create(env);
    }

    const expressionDeclaration = Declaration.create(expression, this.generator);

    const tsReturnType = signature.getReturnType();
    const llvmReturnType = tsReturnType.getLLVMReturnType();

    const functionName = expression.name
      ? expression.name.getText() + "__" + this.generator.randomString
      : this.generator.randomString;
    const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

    FunctionHandler.handleFunctionBody(expressionDeclaration, fn, this.generator, env);
    LLVMFunction.verify(fn, expression);

    return this.makeClosure(fn, expressionDeclaration, env);
  }

  public static withEnvironmentPointerFromArguments<R>(
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

  public static handleFunctionBody(declaration: Declaration, fn: LLVMValue, generator: LLVMGenerator, env?: Environment) {
    const dbg = generator.getDebugInfo();
    generator.withInsertBlockKeeping(() => {
      return generator.symbolTable.withLocalScope(
        (bodyScope) => {
          return FunctionHandler.withEnvironmentPointerFromArguments(
            (environment) => {
              const entryBlock = llvm.BasicBlock.create(generator.context, "entry", fn.unwrapped as llvm.Function);
              generator.builder.setInsertionPoint(entryBlock);

              if (dbg) {
                dbg.emitProcedure(
                  declaration.unwrapped,
                  fn.unwrapped as llvm.Function,
                  declaration.name ? declaration.name.getText() : fn.name,
                  fn.name
                );
                dbg.emitLocation(declaration?.body);
              }

              bodyScope.initializeVariablesAndFunctionDeclarations(declaration.body!, generator);

              if (ts.isBlock(declaration.body!) && declaration.body!.statements.length > 0) {
                declaration.body.forEachChild((node) => {
                  // @todo
                  if (ts.isReturnStatement(node) && node.expression) {
                    if (ts.isFunctionExpression(node.expression)) {
                      const closure = generator.handleExpression(node.expression, environment).derefToPtrLevel1();
                      bodyScope.deinitialize();
                      generator.builder.createSafeRet(closure);
                      return;
                    }
                  }

                  generator.handleNode(node, bodyScope, environment);
                });
              } else if (!ts.isBlock(declaration.body!)) {
                const currentReturnType = LLVMType.make(
                  generator.currentFunction.type.elementType.returnType,
                  generator
                );

                let blocklessArrowFunctionReturn = generator.handleExpression(declaration.body!, environment).derefToPtrLevel1();
                blocklessArrowFunctionReturn = generator.builder.createBitCast(
                  blocklessArrowFunctionReturn,
                  currentReturnType
                );
                bodyScope.deinitialize();
                generator.builder.createSafeRet(blocklessArrowFunctionReturn);
              }

              if (!generator.isCurrentBlockTerminated) {
                const currentReturnType = LLVMType.make(
                  generator.currentFunction.type.elementType.returnType,
                  generator
                );
                const returnsOptional = currentReturnType.isUnion();

                if (returnsOptional) {
                  const nullOptional = generator.ts.union.create();
                  bodyScope.deinitialize();
                  generator.builder.createSafeRet(nullOptional);
                } else {
                  let undef = generator.ts.undef.get();
                  undef = generator.builder.createBitCast(undef, currentReturnType);
                  bodyScope.deinitialize();
                  generator.builder.createSafeRet(undef);
                }
              }
            },
            (fn.unwrapped as llvm.Function)
              .getArguments()
              .map((argument) => LLVMValue.create(argument, generator)),
            env
          );
        },
        generator.symbolTable.currentScope,
        generator.symbolTable.currentScope.name === generator.internalNames.FunctionScope
          ? undefined
          : generator.internalNames.FunctionScope
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
        FunctionHandler.withEnvironmentPointerFromArguments(
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
              const isSynthetic = expression.pos === -1;
              // synthetic 'super' calls may be generated if derived class doesn't provide constructor
              // at this point it is the only case to meet synthetic node, so substitute location
              const location = isSynthetic ? "super()" : expression.getText();
              throw new Error(`Expected 'this' to be provided to constructor. Error at '${location}'`);
            }

            const thisValuePtrPtrPtr = this.generator.builder.createInBoundsGEP(environment!.typed, [
              LLVMConstantInt.get(this.generator, 0),
              LLVMConstantInt.get(this.generator, thisValueIdx),
            ]);

            const isSuperCall =
              ts.isCallExpression(expression) && expression.expression.kind === ts.SyntaxKind.SuperKeyword;

            const originalThisValuePtr = thisValuePtrPtrPtr.derefToPtrLevel1();
            let thisValuePtr = originalThisValuePtr;

            if (isSuperCall) {
              thisValuePtr = this.generator.ts.obj.get(thisValuePtr, "super");
            } else {
              this.generator.meta.setCurrentClassDeclaration(classDeclaration);
            }

            if (classDeclaration.isDerived) {
              const superValue = this.generator.ts.obj.create();
              this.generator.ts.obj.set(superValue, "parent", thisValuePtr);
              this.generator.ts.obj.set(thisValuePtr, "super", superValue);
            }

            if (isSuperCall) {
              this.generator.meta.enterSuperCall();
            }

            this.handleClassOwnProperties(expression, classDeclaration, thisValuePtr, environment!);
            this.handleClassOwnMethods(expression, classDeclaration, thisValuePtr, bodyScope, environment!);

            if (isSuperCall) {
              const thisValuePtrPtr = this.generator.gc.allocate(thisValuePtr.type);
              this.generator.builder.createSafeStore(thisValuePtr, thisValuePtrPtr);
              this.generator.builder.createSafeStore(thisValuePtrPtr, thisValuePtrPtrPtr);
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
              const originalThisValuePtrPtr = this.generator.gc.allocate(originalThisValuePtr.type);
              this.generator.builder.createSafeStore(originalThisValuePtr, originalThisValuePtrPtr);
              this.generator.builder.createSafeStore(originalThisValuePtrPtr, thisValuePtrPtrPtr);
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
      const propertyName = prop.name?.getText();
      if (!propertyName) {
        throw new Error(`Property name expected. Error at: '${expression.getText()}'`);
      }

      const propertyInitializer = prop.initializer;
      if (!propertyInitializer) {
        return;
      }

      let propertyValue = this.generator.handleExpression(propertyInitializer, environment).derefToPtrLevel1();

      if (prop.type.isUnion() && !propertyValue.type.isUnion()) {
        propertyValue = this.generator.ts.union.create(propertyValue);
      }

      this.generator.ts.obj.set(thisValue, propertyName, propertyValue);
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
        const dummyArguments = this.dummyArgsCreator.create(llvmArgumentTypes);

        let { qualifiedName } = FunctionMangler.mangle(
          method,
          undefined,
          thisType, // @todo
          argumentTypes,
          this.generator
        );

        this.generator.symbolTable.currentScope.initializeVariablesAndFunctionDeclarations(method.body, this.generator);

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

        FunctionHandler.handleFunctionBody(method, fn, this.generator, env);
        LLVMFunction.verify(fn, expression);

        let closure = this.makeClosure(fn, method, env);
        if (method.isMethodDeclaredOptional()) {
          closure = this.generator.ts.union.create(closure);
        }

        let key = method.name.getText();
        if (method.isGetAccessor()) {
          key += "__get";
        } else if (method.isSetAccessor()) {
          key += "__set";
        }

        this.generator.ts.obj.set(thisValue, key, closure);
      }, bodyScope);
    });
  }

  private visitFunctionParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>) {
    parameters.forEach((parameter) => {
      addClassScope(parameter, this.generator.symbolTable.globalScope, this.generator);
    });
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
      if (needUnwind(expression)) {
        const lpadBB = builder.landingPadStack[builder.landingPadStack.length - 1];
        const continueBB = llvm.BasicBlock.create(context, "continue", currentFunction);
        const invokeInst = builder.unwrap().CreateInvoke(
          callee.unwrapped,
          continueBB,
          lpadBB,
          args.map((arg) => arg.unwrapped)
        );
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

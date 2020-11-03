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

import * as ts from "typescript";
import {
  checkIfReturnsValueType,
  getLLVMType,
  createLLVMFunction,
  error,
  getAliasedSymbolIfNecessary,
  checkIfMethod,
  getArgumentTypes,
  getReturnType,
  isCppPrimitiveType,
  adjustLLVMValueToType,
  isUnionLLVMType,
  zip,
  checkIfFunction,
  tryResolveGenericTypeIfNecessary,
  isIntersectionLLVMType,
  isClosure,
} from "@utils";
import { getFunctionDeclarationScope } from "@handlers";
import { LLVMGenerator } from "@generator";
import * as llvm from "llvm-node";
import { Environment } from "@scope";

export class SysVFunctionHandler {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  handleGetAccessExpression(
    expression: ts.PropertyAccessExpression,
    qualifiedName: string,
    env?: Environment
  ): llvm.Value {
    const thisType = this.generator.checker.getTypeAtLocation(expression.expression);
    const symbol = this.generator.checker.getSymbolAtLocation(expression);
    const valueDeclaration = symbol!.valueDeclaration as ts.GetAccessorDeclaration;

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = parentScope.thisData!.llvmType;
    const returnType: ts.Type = this.generator.checker.getTypeAtLocation(expression);

    const llvmReturnType = getLLVMType(returnType, expression, this.generator);
    const llvmArgumentTypes = [llvmThisType];

    const returnsValue = checkIfReturnsValueType(valueDeclaration);
    if (returnsValue) {
      llvmArgumentTypes.unshift(llvmReturnType as llvm.PointerType);
    }

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
    const body = valueDeclaration.body;
    if (body) {
      error(`External symbol '${qualifiedName}' cannot have function body`);
    }

    const thisValue = this.generator.handleExpression(expression.expression, env);
    const args = [thisValue];

    if (returnsValue) {
      const shadowReturnType = llvmReturnType.isPointerTy() ? llvmReturnType.elementType : llvmReturnType;
      const sret = this.generator.gc.allocate(shadowReturnType);
      args.unshift(sret);
    }

    if (returnsValue) {
      return args[0];
    }

    return this.generator.xbuilder.createSafeCall(fn, args);
  }

  private handleFunctionBody(
    llvmReturnType: llvm.Type,
    thisType: ts.Type | undefined,
    declaration: ts.FunctionLikeDeclaration,
    fn: llvm.Function
  ): void {
    this.generator.withInsertBlockKeeping(() => {
      this.generator.symbolTable.withLocalScope((bodyScope) => {
        const parameters = this.generator.checker.getSignatureFromDeclaration(declaration)!.parameters;
        const parameterNames = parameters.map((parameter) => parameter.name);

        if (thisType) {
          parameterNames.unshift("this");
        }
        for (const [parameterName, argument] of zip(parameterNames, fn.getArguments())) {
          argument.name = parameterName;
          bodyScope.set(parameterName, argument);
        }

        const entryBlock = llvm.BasicBlock.create(this.generator.context, "entry", fn);
        this.generator.builder.setInsertionPoint(entryBlock);

        if (ts.isBlock(declaration.body!) && declaration.body!.statements.length > 0) {
          declaration.body!.forEachChild((node) => {
            if (ts.isReturnStatement(node) && node.expression) {
              this.checkIfSupportedReturn(node.expression, llvmReturnType);
              let returnValue = this.generator.handleExpression(node.expression);
              if (!returnValue.type.equals(llvmReturnType)) {
                returnValue = adjustLLVMValueToType(returnValue, llvmReturnType, this.generator);
              }
              this.generator.xbuilder.createSafeRet(returnValue);
              return;
            }

            this.generator.handleNode(node, bodyScope);
          });
        } else if (ts.isBlock(declaration.body!)) {
          // Empty block
          this.generator.builder.createRetVoid();
        } else {
          this.checkIfSupportedReturn(declaration.body! as ts.Expression, llvmReturnType);

          const blocklessArrowFunctionReturn = this.generator.handleExpression(declaration.body! as ts.Expression);

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
      }, this.generator.symbolTable.currentScope);
    });
  }

  private handleArrowFunctionOrFunctionExpression(expression: ts.ArrowFunction | ts.FunctionExpression): llvm.Value {
    const signature = this.generator.checker.getSignatureFromDeclaration(expression)!;
    const tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    const tsArgumentTypes = expression.parameters.map(this.generator.checker.getTypeAtLocation);
    let llvmReturnType = getLLVMType(tsReturnType, expression, this.generator);
    if (llvmReturnType.isPointerTy() && isCppPrimitiveType(llvmReturnType.elementType)) {
      llvmReturnType = llvmReturnType.elementType;
    }

    const llvmArgumentTypes = tsArgumentTypes.map((arg) => {
      let type = getLLVMType(arg, expression, this.generator);
      if (type.isPointerTy() && isCppPrimitiveType(type.elementType)) {
        type = type.elementType;
      }
      return type;
    });

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, "", this.generator.module);

    this.handleFunctionBody(llvmReturnType, undefined, expression, fn);
    return fn;
  }

  private getFunctionType(tsType: ts.Type, node: ts.Node) {
    const signature = this.generator.checker.getSignaturesOfType(tsType, ts.SignatureKind.Call)[0];
    let tsReturnType = this.generator.checker.getReturnTypeOfSignature(signature);
    tsReturnType = tryResolveGenericTypeIfNecessary(tsReturnType, this.generator);

    const tsParameterTypes = signature.getParameters().map((parameter) => {
      let type = this.generator.checker.getTypeOfSymbolAtLocation(parameter, node);
      type = tryResolveGenericTypeIfNecessary(type, this.generator);
      return type;
    });

    let llvmReturnType = getLLVMType(tsReturnType, node, this.generator);
    if (llvmReturnType.isPointerTy() && isCppPrimitiveType(llvmReturnType.elementType)) {
      llvmReturnType = llvmReturnType.elementType;
    }

    const llvmParameters = [];

    llvmParameters.push(
      ...tsParameterTypes.map((parameterType) => {
        let type = getLLVMType(parameterType, node, this.generator);

        if (type.isPointerTy() && isCppPrimitiveType(type.elementType)) {
          type = type.elementType;
        }

        return type;
      })
    );

    const functionType = llvm.FunctionType.get(llvmReturnType, llvmParameters, false);
    return functionType.getPointerTo();
  }

  handleCallExpression(expression: ts.CallExpression, qualifiedName: string, env?: Environment): llvm.Value {
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

    const parentScope = getFunctionDeclarationScope(valueDeclaration, thisType, this.generator);
    const llvmThisType = thisType ? parentScope.thisData!.llvmType : undefined;

    const returnType = getReturnType(expression, this.generator);
    let llvmReturnType = getLLVMType(returnType, expression, this.generator);
    if (llvmReturnType.isPointerTy() && isCppPrimitiveType(llvmReturnType.elementType)) {
      llvmReturnType = llvmReturnType.elementType;
    }

    const llvmArgumentTypes = argumentTypes.map((argumentType) => {
      if (checkIfFunction(argumentType)) {
        return this.getFunctionType(argumentType, expression);
      }

      const type = getLLVMType(argumentType, expression, this.generator);

      if (type.isPointerTy() && isCppPrimitiveType(type.elementType)) {
        return type.elementType;
      }
      return type;
    });

    let args = expression.arguments.map((argument) => {
      if (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)) {
        return this.handleArrowFunctionOrFunctionExpression(argument);
      }

      const arg = this.generator.handleExpression(argument, env);

      if (isClosure(arg)) {
        const originalType = this.generator.checker.getTypeAtLocation(argument);
        const originalSymbol = originalType.symbol;
        const originalDeclaration = originalSymbol!.declarations[0];

        if (ts.isArrowFunction(originalDeclaration) || ts.isFunctionExpression(originalDeclaration)) {
          return this.handleArrowFunctionOrFunctionExpression(originalDeclaration);
        }
      }

      return this.generator.createLoadIfNecessary(arg);
    });

    args = this.adjustParameters(args, llvmArgumentTypes);

    if (args.some((arg, index) => !arg.type.equals(llvmArgumentTypes[index]))) {
      error("Parameters adjusting failed");
    }

    if (llvmThisType) {
      llvmArgumentTypes.unshift(llvmThisType);
    }

    const returnsValue = checkIfReturnsValueType(valueDeclaration);
    if (returnsValue) {
      llvmArgumentTypes.unshift(llvmReturnType);
    }

    const { fn } = createLLVMFunction(llvmReturnType, llvmArgumentTypes, qualifiedName, this.generator.module);
    if (valueDeclaration.body) {
      error(`External symbol '${qualifiedName}' cannot have function body`);
    }

    if (isMethod) {
      const propertyAccess = expression.expression as ts.PropertyAccessExpression;
      const thisValue = this.generator.handleExpression(propertyAccess.expression, env);
      args.unshift(thisValue);
    }

    if (returnsValue) {
      const shadowReturnType = llvmReturnType.isPointerTy() ? llvmReturnType.elementType : llvmReturnType;
      const sret = this.generator.gc.allocate(shadowReturnType);
      args.unshift(sret);
      this.generator.xbuilder.createSafeCall(fn, args);
      return sret;
    }

    return this.generator.xbuilder.createSafeCall(fn, args);
  }

  handleNewExpression(expression: ts.NewExpression, qualifiedName: string, env?: Environment): llvm.Value {
    const thisType = this.generator.checker.getTypeAtLocation(expression);
    const classDeclaration = getAliasedSymbolIfNecessary(thisType.symbol, this.generator.checker)
      .valueDeclaration as ts.ClassLikeDeclaration;
    const constructorDeclaration = classDeclaration.members.find(ts.isConstructorDeclaration)!;
    const argumentTypes = expression.arguments?.map(this.generator.checker.getTypeAtLocation) || [];

    const parentScope = getFunctionDeclarationScope(classDeclaration, thisType, this.generator);
    const llvmThisType: llvm.PointerType = parentScope.thisData!.llvmType as llvm.PointerType;

    const parameterTypes = argumentTypes.map((argumentType) => {
      const type = getLLVMType(argumentType, expression, this.generator);
      if (type.isPointerTy() && isCppPrimitiveType(type.elementType)) {
        return type.elementType;
      }
      return type;
    });

    parameterTypes.unshift(llvmThisType);
    const { fn: constructor, existing } = createLLVMFunction(
      llvmThisType,
      parameterTypes,
      qualifiedName,
      this.generator.module
    );

    const body = constructorDeclaration.body;
    const args =
      expression.arguments?.map((argument) =>
        this.generator.createLoadIfNecessary(this.generator.handleExpression(argument, env))
      ) || [];

    let thisValue: llvm.Value | undefined;
    if (body && !existing) {
      error(`External symbol '${qualifiedName}' cannot have constructor body`);
    }

    thisValue = this.generator.gc.allocate(llvmThisType.elementType);
    args.unshift(thisValue);
    this.generator.xbuilder.createSafeCall(constructor, args);
    return thisValue;
  }

  private adjustParameters(parameters: llvm.Value[], types: llvm.Type[]) {
    if (parameters.length !== types.length) {
      error("Expected arrays of same length");
    }

    return parameters.map((parameter, index) => adjustLLVMValueToType(parameter, types[index], this.generator));
  }

  private checkIfSupportedReturn(expression: ts.Expression, llvmReturnType: llvm.Type) {
    if (ts.isFunctionExpression(expression)) {
      error("Function values in return are not supported");
    }

    if (isUnionLLVMType(llvmReturnType)) {
      error("Unions in return are not supported");
    }

    if (isIntersectionLLVMType(llvmReturnType)) {
      error("Intersections in return are not supported");
    }
  }
}

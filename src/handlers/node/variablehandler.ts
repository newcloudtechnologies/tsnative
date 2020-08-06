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

import { adjustValue, isCppNumericType } from "@cpp";
import { Scope, HeapVariableDeclaration, Environment, addClassScope } from "@scope";
import {
  isConst,
  checkIfUnion,
  initializeUnion,
  tryResolveGenericTypeIfNecessary,
  InternalNames,
  getUnionStructType,
  getLLVMType,
  isUnionWithUndefinedLLVMType,
  isUnionWithNullLLVMType,
  getTypeGenericArguments,
} from "@utils";
import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import * as llvm from "llvm-node";
import { createArrayConstructor, createArrayPush } from "@handlers";

type VariableLike = ts.VariableStatement | ts.VariableDeclarationList;
export class VariableHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.VariableDeclarationList:
        this.handleVariables(node as VariableLike, parentScope, env);
        return true;
      case ts.SyntaxKind.VariableDeclaration:
        this.handleVariableDeclaration(node as ts.VariableDeclaration, parentScope, env);
        return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private handleVariableDeclaration(declaration: ts.VariableDeclaration, parentScope: Scope, env?: Environment): void {
    const name = (declaration.name as ts.Identifier).escapedText.toString() || declaration.name.getText();
    let initializer = this.getInitializer(declaration, name, parentScope, env);
    if (!initializer) {
      return;
    }

    if (initializer.name.startsWith(InternalNames.Closure)) {
      // @todo: cls__ check
      parentScope.set(name, initializer);
      return;
    }

    let type = this.generator.checker.getTypeAtLocation(declaration);
    type = tryResolveGenericTypeIfNecessary(type, this.generator);
    const typename = this.generator.checker.typeToString(type);
    if (isCppNumericType(typename)) {
      initializer = adjustValue(initializer, typename, this.generator);
    }

    if (isConst(declaration)) {
      if (!(initializer instanceof llvm.Argument)) {
        initializer.name = name;
      }
      parentScope.set(name, initializer);
    } else {
      if (checkIfUnion(type)) {
        const llvmUnionType = getUnionStructType(type as ts.UnionType, declaration, this.generator).getPointerTo();
        initializer = initializeUnion(llvmUnionType, initializer, this.generator);
      }

      // @todo
      parentScope.set(name, new HeapVariableDeclaration(initializer, initializer, declaration));
    }
  }

  private handleVariables(statement: VariableLike, parentScope: Scope, env?: Environment): void {
    const declarations = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations
      : statement.declarations;
    declarations.forEach((declaration) => {
      this.handleVariableDeclaration(declaration, parentScope, env);
    });
  }

  private getInitializer(declaration: ts.VariableDeclaration, name: string, parentScope: Scope, env?: Environment) {
    let initializer;
    if (!declaration.initializer || declaration.initializer.kind === ts.SyntaxKind.NullKeyword) {
      let declarationLLVMType;
      const typeReference = declaration.type as ts.TypeReferenceNode;
      if (typeReference && typeReference.typeName) {
        const typename = (declaration.type as ts.TypeReferenceNode).typeName.getText();
        const typeAliasScope = this.generator.symbolTable.currentScope.tryGetThroughParentChain(typename) as Scope;
        if (typeAliasScope) {
          declarationLLVMType = typeAliasScope.thisData!.type;
        }
      }

      if (!declarationLLVMType) {
        const declarationType = this.generator.checker.getTypeAtLocation(declaration);
        declarationLLVMType = getLLVMType(declarationType, declaration, this.generator);
      }

      initializer = llvm.Constant.getNullValue(
        declarationLLVMType.isPointerTy() ? declarationLLVMType.elementType : declarationLLVMType
      );
      if (isUnionWithUndefinedLLVMType(declarationLLVMType) || isUnionWithNullLLVMType(declarationLLVMType)) {
        initializer = this.generator.builder.createInsertValue(
          initializer,
          llvm.ConstantInt.get(this.generator.context, -1, 8),
          [0]
        );
      }
      const alloca = this.generator.gc.allocate(declarationLLVMType);
      this.generator.builder.createStore(initializer, alloca);
      parentScope.set(name, new HeapVariableDeclaration(alloca, initializer, declaration));
      initializer = undefined;
    } else if (ts.isArrayLiteralExpression(declaration.initializer)) {
      addClassScope(declaration, this.generator.symbolTable.globalScope, this.generator);

      const arrayType = this.generator.checker.getTypeAtLocation(declaration);
      const elementType = getTypeGenericArguments(arrayType)[0];

      const { constructor, allocated } = createArrayConstructor(arrayType, declaration.initializer, this.generator);
      this.generator.builder.createCall(constructor, [allocated]);

      const push = createArrayPush(arrayType, elementType, declaration.initializer, this.generator);
      for (const element of declaration.initializer.elements) {
        const elementValue = this.generator.createLoadIfNecessary(this.generator.handleExpression(element));
        this.generator.builder.createCall(push, [allocated, elementValue]);
      }

      initializer = allocated;
    } else {
      initializer = this.generator.handleExpression(declaration.initializer, env);
    }

    return initializer;
  }
}

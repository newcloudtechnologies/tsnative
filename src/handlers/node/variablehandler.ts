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
  checkIfUnion,
  initializeUnion,
  tryResolveGenericTypeIfNecessary,
  getUnionStructType,
  getLLVMType,
  isUnionWithUndefinedLLVMType,
  isUnionWithNullLLVMType,
  checkIfIntersection,
  initializeIntersection,
  getIntersectionStructType,
  unwrapPointerType,
  error,
  getStructType,
  isClosure,
} from "@utils";
import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import * as llvm from "llvm-node";

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

    if (isClosure(initializer)) {
      parentScope.set(name, initializer);
      return;
    }

    let type = this.generator.checker.getTypeAtLocation(declaration);
    type = tryResolveGenericTypeIfNecessary(type, this.generator);
    const typename = this.generator.checker.typeToString(type);
    if (isCppNumericType(typename)) {
      initializer = adjustValue(initializer, typename, this.generator);
    }

    if (checkIfUnion(type)) {
      const llvmUnionType = getUnionStructType(type as ts.UnionType, declaration, this.generator).getPointerTo();
      initializer = initializeUnion(llvmUnionType, initializer, this.generator);
    } else if (checkIfIntersection(type)) {
      const llvmIntersectionType = getIntersectionStructType(
        type as ts.IntersectionType,
        declaration,
        this.generator
      ).getPointerTo();
      initializer = initializeIntersection(llvmIntersectionType, initializer, this.generator);
    } else if (type.isClassOrInterface()) {
      const initializerNakedType = unwrapPointerType(initializer.type);
      if (!initializerNakedType.isStructTy()) {
        error(`Expected initializer to be of StructType`);
      }

      const declarationLLVMType = getStructType(type, declaration, this.generator);

      if (!initializerNakedType.equals(declarationLLVMType)) {
        if (initializerNakedType.numElements === declarationLLVMType.numElements) {
          const allocated = this.generator.gc.allocate(declarationLLVMType);
          for (let i = 0; i < initializerNakedType.numElements; ++i) {
            const destinationPtr = this.generator.xbuilder.createSafeInBoundsGEP(allocated, [0, i]);
            const sourceValue = this.generator.builder.createLoad(
              this.generator.xbuilder.createSafeInBoundsGEP(initializer, [0, i])
            );
            this.generator.xbuilder.createSafeStore(sourceValue, destinationPtr);
          }

          initializer = allocated;
        }
      }
    }

    // @todo
    parentScope.set(name, new HeapVariableDeclaration(initializer, initializer, name, declaration));
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
    addClassScope(declaration, this.generator.symbolTable.globalScope, this.generator);

    let initializer;
    if (!declaration.initializer || declaration.initializer.kind === ts.SyntaxKind.NullKeyword) {
      let declarationLLVMType;
      const typeReference = declaration.type as ts.TypeReferenceNode;
      if (typeReference && typeReference.typeName) {
        const typename = (declaration.type as ts.TypeReferenceNode).typeName.getText();
        const typeAliasScope = this.generator.symbolTable.currentScope.tryGetThroughParentChain(typename) as Scope;
        if (typeAliasScope) {
          declarationLLVMType = typeAliasScope.thisData!.llvmType;
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
        initializer = this.generator.xbuilder.createSafeInsert(
          initializer,
          llvm.ConstantInt.get(this.generator.context, -1, 8),
          [0]
        );
      }
      const alloca = this.generator.gc.allocate(declarationLLVMType);
      this.generator.xbuilder.createSafeStore(initializer, alloca);
      parentScope.set(name, new HeapVariableDeclaration(alloca, initializer, name, declaration));
      initializer = undefined;
    } else {
      initializer = this.generator.handleExpression(declaration.initializer, env);
    }

    return initializer;
  }
}

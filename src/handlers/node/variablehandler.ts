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

import { Scope, HeapVariableDeclaration, Environment, addClassScope } from "../../scope";
import { LLVMStructType, LLVMType } from "../../llvm/type";
import { LLVMConstant, LLVMConstantInt, LLVMIntersection, LLVMUnion, LLVMValue } from "../../llvm/value";
import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";

type VariableLike = ts.VariableStatement | ts.VariableDeclarationList;
export class VariableHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.VariableDeclarationList:
        this.handleVariables(node as VariableLike, parentScope, env);
        return true;
      case ts.SyntaxKind.VariableDeclaration:
        const variableDeclaration = node as ts.VariableDeclaration;

        if (ts.isArrayBindingPattern(variableDeclaration.name)) {
          this.handleArrayBindingPattern(variableDeclaration, parentScope, env);
          return true;
        }

        this.handleVariableDeclaration(variableDeclaration, parentScope, env);
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

    const type = this.generator.ts.checker.getTypeAtLocation(declaration);
    const typename = type.toString();
    if (type.isCppIntegralType()) {
      initializer = initializer.adjustToIntegralType(typename);
    }

    if (type.isUnion()) {
      const llvmUnionType = type.getLLVMType();
      const nullUnion = LLVMUnion.createNullValue(llvmUnionType, this.generator);
      initializer = nullUnion.initialize(initializer);
    } else if (type.isIntersection()) {
      const llvmIntersectionType = type.getLLVMType();
      const nullIntersection = LLVMIntersection.createNullValue(llvmIntersectionType, this.generator);
      initializer = nullIntersection.initialize(initializer);
    } else if (type.isClassOrInterface()) {
      if (!declaration.initializer) {
        throw new Error(`Expected initializer at variable declaration '${declaration.getText()}'`);
      }

      const initializerNakedType = initializer.type.unwrapPointer();
      if (!initializerNakedType.isStructType()) {
        throw new Error(`Expected initializer to be of StructType`);
      }

      const declarationLLVMType = type.getLLVMType().unwrapPointer() as LLVMStructType;

      if (!initializerNakedType.equals(declarationLLVMType)) {
        const initializerType = this.generator.ts.checker.getTypeAtLocation(declaration.initializer);

        if (initializerType.isUpcastableTo(type)) {
          initializer = this.generator.builder.createBitCast(initializer, type.getLLVMType());
        } else if (initializerNakedType.numElements === declarationLLVMType.numElements) {
          const allocated = this.generator.gc.allocate(declarationLLVMType);
          for (let i = 0; i < initializerNakedType.numElements; ++i) {
            const destinationPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, i]);
            const sourceValue = this.generator.builder.createLoad(
              this.generator.builder.createSafeInBoundsGEP(initializer, [0, i])
            );
            this.generator.builder.createSafeStore(sourceValue, destinationPtr);
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
      this.generator.handleNode(declaration, parentScope, env);
    });
  }

  private getInitializer(declaration: ts.VariableDeclaration, name: string, parentScope: Scope, env?: Environment) {
    addClassScope(declaration, this.generator.symbolTable.globalScope, this.generator);

    let initializer: LLVMValue | undefined;
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
        const declarationType = this.generator.ts.checker.getTypeAtLocation(declaration);
        declarationLLVMType = declarationType.getLLVMType();
      }
      initializer = LLVMConstant.createNullValue(declarationLLVMType.unwrapPointer(), this.generator);

      if (declarationLLVMType.isUnionWithUndefined() || declarationLLVMType.isUnionWithNull()) {
        initializer = this.generator.builder.createSafeInsert(initializer, LLVMConstantInt.get(this.generator, -1, 8), [
          0,
        ]);
      }
      const alloca = this.generator.gc.allocate(declarationLLVMType.unwrapPointer());
      this.generator.builder.createSafeStore(initializer, alloca);
      parentScope.set(name, new HeapVariableDeclaration(alloca, initializer, name, declaration));
      initializer = undefined;
    } else {
      initializer = this.generator.handleExpression(declaration.initializer, env);
    }

    if (initializer && declaration.initializer) {
      const initializerType = this.generator.ts.checker.getTypeAtLocation(declaration.initializer);

      if (initializerType.isClassOrInterface()) {
        const initializerSymbol = initializerType.getSymbol();
        const initializerDeclaration = initializerSymbol.valueDeclaration;
        if (initializerDeclaration) {
          const prototype = initializerDeclaration.getPrototype();
          initializer.attachPrototype(prototype);
        }
      }
    }

    return initializer;
  }

  private handleArrayBindingPattern(declaration: ts.VariableDeclaration, parentScope: Scope, env?: Environment) {
    if (!declaration.initializer) {
      throw new Error(`Expected initializer at '${declaration.getText()}'`);
    }

    const bindingPattern = declaration.name as ts.ArrayBindingPattern;

    const identifiers: ts.Identifier[] = [];
    bindingPattern.elements.forEach((element) => {
      if (!ts.isBindingElement(element) || element.initializer) {
        throw new Error("Array destructuring is not support omitting nor default initializers.");
      }

      if (!ts.isIdentifier(element.name)) {
        throw new Error(
          `Array destructuring is not support non-identifiers, got '${
            ts.SyntaxKind[element.kind]
          }' at '${element.getText()}'`
        );
      }

      identifiers.push(element.name);
    });

    const arrayInitializer = this.generator.handleExpression(declaration.initializer, env);
    const arrayUntyped = this.generator.builder.asVoidStar(arrayInitializer);
    const arrayType = this.generator.ts.checker.getTypeAtLocation(declaration.initializer);
    let elementType = arrayType.getTypeGenericArguments()[0];
    if (elementType.isFunction()) {
      elementType = this.generator.tsclosure.getTSType();
    }

    const subscription = this.generator.ts.array.createSubscription(arrayType);

    identifiers.forEach((identifier, index) => {
      const name = identifier.getText();
      const llvmIntegralIndex = LLVMConstantInt.get(this.generator, index);
      const llvmDoubleIndex = this.generator.builder.createSIToFP(
        llvmIntegralIndex,
        LLVMType.getDoubleType(this.generator)
      );
      const destructedValueUntyped = this.generator.builder.createSafeCall(subscription, [
        arrayUntyped,
        llvmDoubleIndex,
      ]);
      const destructedValue = this.generator.builder.createBitCast(destructedValueUntyped, elementType.getLLVMType());

      parentScope.set(name, destructedValue);
    });
  }
}

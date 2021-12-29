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

import { Scope, HeapVariableDeclaration, Environment, addClassScope } from "../../scope";
import { LLVMStructType, LLVMType } from "../../llvm/type";
import { LLVMConstant, LLVMConstantInt, LLVMIntersection, LLVMUnion, LLVMValue } from "../../llvm/value";
import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";

type VariableLike = ts.VariableStatement | ts.VariableDeclarationList;
export class VariableHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, outerEnv?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.VariableDeclarationList:
        this.handleVariables(node as VariableLike, parentScope, outerEnv);
        return true;
      case ts.SyntaxKind.VariableDeclaration:
        const variableDeclaration = node as ts.VariableDeclaration;

        if (ts.isArrayBindingPattern(variableDeclaration.name)) {
          this.handleArrayBindingPattern(variableDeclaration, parentScope, outerEnv);
          return true;
        }

        this.handleVariableDeclaration(variableDeclaration, parentScope, outerEnv);
        return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, outerEnv);
    }

    return false;
  }

  private handleVariableDeclaration(
    declaration: ts.VariableDeclaration,
    parentScope: Scope,
    outerEnv?: Environment
  ): void {
    const name = (declaration.name as ts.Identifier).escapedText.toString() || declaration.name.getText();

    let initializer = this.getInitializer(declaration, name, parentScope, outerEnv);
    if (!initializer) {
      return;
    }

    const type = this.generator.ts.checker.getTypeAtLocation(declaration);
    if (type.isCppIntegralType()) {
      const typename = type.toString();
      initializer = initializer.adjustToIntegralType(typename);
    }

    if (!type.isArray() && !type.isSet() && !type.isMap()) {
      if (initializer.isTSPrimitivePtr()) {
        // mimics 'value' semantic for primitives
        initializer = this.generator.builder.createLoad(initializer).createHeapAllocated();
      }
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

  private getInitializer(
    declaration: ts.VariableDeclaration,
    name: string,
    parentScope: Scope,
    outerEnv?: Environment
  ) {
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

      const allocated = this.generator.gc.allocate(declarationLLVMType.unwrapPointer());
      this.generator.builder.createSafeStore(initializer, allocated);

      if (declarationLLVMType.isUnionWithUndefined() || declarationLLVMType.isUnionWithNull()) {
        const markerPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, 0]);

        const allocatedMarker = this.generator.gc.allocate(LLVMType.getInt8Type(this.generator));
        const markerValue = LLVMConstantInt.get(this.generator, -1, 8);
        this.generator.builder.createSafeStore(markerValue, allocatedMarker);

        this.generator.builder.createSafeStore(allocatedMarker, markerPtr);
      }

      parentScope.set(name, new HeapVariableDeclaration(allocated, initializer, name, declaration));
      initializer = undefined;
    } else {
      this.checkAssignmentFromMethod(declaration);
      initializer = this.generator.handleExpression(declaration.initializer, outerEnv);
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

  private handleArrayBindingPattern(declaration: ts.VariableDeclaration, parentScope: Scope, outerEnv?: Environment) {
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

    const arrayInitializer = this.generator.handleExpression(declaration.initializer, outerEnv);
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

  private checkAssignmentFromMethod(declaration: ts.VariableDeclaration) {
    if (!declaration.initializer) {
      return;
    }

    if (!ts.isPropertyAccessExpression(declaration.initializer)) {
      return;
    }

    const isPropertyAccessWithSymbol = this.generator.ts.checker.nodeHasSymbol(declaration.initializer);
    if (!isPropertyAccessWithSymbol) {
      return;
    }

    const propertyAccessSymbol = this.generator.ts.checker.getSymbolAtLocation(declaration.initializer);
    const propertyAccessDeclaration = propertyAccessSymbol.valueDeclaration;

    if (
      propertyAccessDeclaration &&
      propertyAccessDeclaration.isFunctionLike() &&
      ts.isClassDeclaration(propertyAccessDeclaration.parent)
    ) {
      throw new Error(`It seems like '${declaration.getText()}' is an assignment a method to variable.
       This code is ill-formed and will lead to runtime crash because of context 'this' loss.
       Use 'bind' with '${declaration.initializer.getText()}.bind(this, ...)' instead`);
    }
  }
}

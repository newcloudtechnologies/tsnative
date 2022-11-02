/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { Scope, HeapVariableDeclaration, Environment, addClassScope } from "../../scope";
import { LLVMConstantFP, LLVMValue } from "../../llvm/value";
import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";

type VariableLike = ts.VariableStatement | ts.VariableDeclarationList;
export class VariableHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, outerEnv?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.VariableDeclarationList:
        this.generator.emitLocation(node);
        this.handleVariables(node as VariableLike, parentScope, outerEnv);
        return true;
      case ts.SyntaxKind.VariableDeclaration:
        this.generator.emitLocation(node);
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
    let name = (declaration.name as ts.Identifier).escapedText.toString() || declaration.name.getText();

    // Note about 'escapedText' from tsc: Text of identifier, but if the identifier begins with two underscores, this will begin with three;
    // Cut leading underscore
    if (name.startsWith("___")) {
      name = name.substring(1);
    }

    let initializer = this.getInitializer(declaration, name, parentScope, outerEnv);
    if (!initializer) {
      return;
    }

    const type = this.generator.ts.checker.getTypeAtLocation(declaration);

    if (initializer.isTSPrimitivePtr()) {
      // mimics 'value' semantic for primitives
      initializer = initializer.clone();

      // convert c++ enumerator values to ts' number
      if (type.isEnum() && initializer.type.isIntegerType()) {
        initializer = this.generator.builtinNumber.create(initializer);
      }
    }

    if (type.isUnion() && !initializer.type.isUnion()) {
      initializer = this.generator.ts.union.create(initializer);
    }

    if (type.isVoid()) {
      initializer = this.generator.builder.createBitCast(initializer, this.generator.ts.undef.getLLVMType());
    }

    let existing = parentScope.get(name);

    if (existing && existing instanceof LLVMValue) {
      // overwrite pointers that possibly captured in some environments
      existing.makeAssignment(initializer);
      // overwrite value for future uses
      parentScope.overwrite(name, new HeapVariableDeclaration(initializer, initializer, name, declaration));
    } else {
      parentScope.set(name, new HeapVariableDeclaration(initializer, initializer, name, declaration));
    }

    if (outerEnv?.variables.includes(name)) {
      const index = outerEnv.getVariableIndex(name);
      const valuePtr = this.generator.builder.createSafeInBoundsGEP(outerEnv.typed, [0, index]);
      const value = this.generator.builder.createLoad(valuePtr);

      value.makeAssignment(initializer);
    }

    const dbg = this.generator.getDebugInfo();
    if (dbg) {
      dbg.emitDeclare(name, initializer, declaration, type);
    }
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
    if (
      !declaration.initializer ||
      declaration.initializer.kind === ts.SyntaxKind.NullKeyword ||
      declaration.initializer.kind === ts.SyntaxKind.UndefinedKeyword
    ) {
      const type = this.generator.ts.checker.getTypeAtLocation(declaration);

      let allocated: LLVMValue;
      if (type.isUndefined() || type.isNull()) {
        allocated = this.generator.ts.undef.get();
      } else {
        const allocateUnion = declaration.initializer || type.isOptionalUnion();
        if (allocateUnion) {
          allocated = this.generator.ts.union.create();
        } else {
          const variableSymbol = type.getSymbol();
          const variableTypeDeclaration = variableSymbol.valueDeclaration;

          if (!variableTypeDeclaration) {
            throw new Error(`Unable to find value declaration for type '${type.toString()}'. Error at: '${declaration.getText()}'`);
          }

          if (!variableTypeDeclaration.isAmbient()) {
            allocated = this.generator.ts.obj.create();
          } else {
            allocated = this.generator.gc.allocate(type.getLLVMType().getPointerElementType());
          }
        }
      }

      const value = new HeapVariableDeclaration(allocated, allocated, name, declaration);
      if (parentScope.get(name)) {
        parentScope.overwrite(name, value);
      } else {
        parentScope.set(name, value);
      }
      initializer = undefined;
    } else {
      this.checkAssignmentFromMethod(declaration);
      initializer = this.generator.handleExpression(declaration.initializer, outerEnv);
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
          `Array destructuring is not support non-identifiers, got '${ts.SyntaxKind[element.kind]
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
      const llvmDoubleIndex = LLVMConstantFP.get(this.generator, index);
      const llvmNumberIndex = this.generator.builtinNumber.create(llvmDoubleIndex);

      const destructedValueUntyped = this.generator.builder.createSafeCall(subscription, [
        arrayUntyped,
        llvmNumberIndex,
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

    const isPropertyAccessWithSymbol = this.generator.ts.checker.nodeHasSymbolAndDeclaration(declaration.initializer);
    if (!isPropertyAccessWithSymbol) {
      return;
    }

    const propertyAccessSymbol = this.generator.ts.checker.getSymbolAtLocation(declaration.initializer);
    const propertyAccessDeclaration = propertyAccessSymbol.valueDeclaration;

    if (!propertyAccessDeclaration) {
      return;
    }

    if (propertyAccessDeclaration.isGetAccessor()) {
      return;
    }

    if (propertyAccessDeclaration.isMethod()) {
      throw new Error(`It seems like '${declaration.getText()}' is an assignment a method to variable.
       This code is ill-formed and will lead to runtime crash because of context 'this' loss.
       Use 'bind' with '${declaration.initializer.getText()}.bind(this, ...)' instead`);
    }
  }
}

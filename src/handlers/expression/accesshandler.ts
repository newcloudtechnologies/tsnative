import { Environment, HeapVariableDeclaration, Scope, ScopeValue } from "@scope";
import { error, InternalNames } from "@utils";
import * as ts from "typescript";

import { AbstractExpressionHandler } from "./expressionhandler";
import { createArraySubscription } from "@handlers";
import { LLVMValue } from "../../llvm/value";
import { LLVMStructType } from "../../llvm/type";

export class AccessHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PropertyAccessExpression:
        const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);
        if (symbol.declarations.some((declaration) => ts.isGetAccessor(declaration) || ts.isSetAccessor(declaration))) {
          // Handle accessors in FunctionHandler.
          break;
        }

        return this.handlePropertyAccessExpression(expression as ts.PropertyAccessExpression, env);
      case ts.SyntaxKind.ElementAccessExpression:
        return this.handleElementAccessExpression(expression as ts.ElementAccessExpression, env);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private hasProperty(declaration: ts.ClassDeclaration | ts.InterfaceDeclaration, property: string): boolean {
    const has =
      declaration.members.findIndex(
        (member: ts.TypeElement | ts.ClassElement) => member.name?.getText() === property
      ) !== -1;
    if (has) {
      return has;
    }

    if (declaration.heritageClauses) {
      for (const clause of declaration.heritageClauses) {
        for (const type of clause.types) {
          const symbol = this.generator.ts.checker.getSymbolAtLocation(type.expression);
          const baseDeclaration = symbol.valueDeclaration;
          const baseHas = this.hasProperty(baseDeclaration as ts.ClassDeclaration | ts.InterfaceDeclaration, property);

          if (baseHas) {
            return baseHas;
          }
        }
      }
    }

    return false;
  }

  private handlePropertyAccessExpression(expression: ts.PropertyAccessExpression, env?: Environment): LLVMValue {
    const left = expression.expression;
    let propertyName = expression.name.text;

    if (env) {
      let index = env.getVariableIndex(left.getText() + "." + propertyName);
      if (index < 0) {
        index = env.getVariableIndex(propertyName);
      }

      if (index > -1) {
        return this.generator.builder.createSafeExtractValue(env.typed.getValue(), [index]);
      }
    }

    let scope;
    try {
      const symbol = this.generator.ts.checker.getSymbolAtLocation(left);
      const declaration = symbol.valueDeclaration;

      let identifier = left.getText();

      if (
        (ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration)) &&
        this.hasProperty(declaration, propertyName)
      ) {
        const type = this.generator.ts.checker.getTypeOfSymbolAtLocation(symbol, expression);
        identifier = type.mangle();
      }

      scope = this.generator.symbolTable.get(identifier);

      // Ignore empty catch block
      // tslint:disable-next-line
    } catch (_) { }

    while (scope && scope instanceof Scope) {
      const value: ScopeValue | HeapVariableDeclaration | undefined =
        scope.get(propertyName) || scope.getStatic(propertyName);

      if (!value) {
        // @todo: this leads to error postpone in some cases. need some extra checks if can break here
        break;
      }

      if (value instanceof HeapVariableDeclaration) {
        return value.allocated;
      } else if (value instanceof LLVMValue) {
        return value;
      } else if (value instanceof Scope) {
        scope = value;
        // Consider the only case to get here is a property access chain handling.
        propertyName = (expression.parent as ts.PropertyAccessExpression).name.getText();
        continue;
      }
    }

    return this.handlePropertyAccessGEP(propertyName, left, env);
  }

  private handleElementAccessExpression(expression: ts.ElementAccessExpression, env?: Environment): LLVMValue {
    const subscription = createArraySubscription(expression, this.generator);
    const array = this.generator.handleExpression(expression.expression, env);
    const arrayUntyped = this.generator.builder.asVoidStar(array);
    const index = this.generator.createLoadIfNecessary(
      this.generator.handleExpression(expression.argumentExpression, env)
    );

    return this.generator.builder.createSafeCall(subscription, [arrayUntyped, index]);
  }

  private handlePropertyAccessGEP(propertyName: string, expression: ts.Expression, env?: Environment): LLVMValue {
    let llvmValue = this.generator.handleExpression(expression, env);
    if (!llvmValue.type.isPointer()) {
      error(`Expected pointer, got '${llvmValue.type}'`);
    }

    while (llvmValue.type.getPointerElementType().isPointer()) {
      llvmValue = this.generator.builder.createLoad(llvmValue);
    }

    if (this.generator.types.union.isLLVMUnion(llvmValue.type)) {
      const unionName = (llvmValue.type.unwrapPointer() as LLVMStructType).getName();
      if (!unionName) {
        error("Name required for UnionStruct");
      }

      const unionMeta = this.generator.meta.getUnionMeta(unionName);
      const index = unionMeta.propsMap.get(propertyName);
      if (typeof index === "undefined") {
        error(`Mapping not found for ${propertyName}`);
      }

      return this.generator.builder.createLoad(this.generator.builder.createSafeInBoundsGEP(llvmValue, [0, index]));
    } else if (this.generator.types.intersection.isLLVMIntersection(llvmValue.type)) {
      const intersectionName = (llvmValue.type.unwrapPointer() as LLVMStructType).getName();
      if (!intersectionName) {
        error("Name required for IntersectionStruct");
      }

      const intersectionMeta = this.generator.meta.getIntersectionMeta(intersectionName);
      const index = intersectionMeta.props.indexOf(propertyName);
      if (index === -1) {
        error(`Mapping not found for ${propertyName}`);
      }

      return this.generator.builder.createLoad(this.generator.builder.createSafeInBoundsGEP(llvmValue, [0, index]));
    } else {
      let propertyIndex = -1;

      if (!llvmValue.name || llvmValue.name === InternalNames.This) {
        const type = this.generator.ts.checker.getTypeAtLocation(expression);
        propertyIndex = type.indexOfProperty(propertyName);
      } else {
        // Object name is its properties names reduced to string, delimited with the dot ('.').
        const propertyNames = llvmValue.getTSObjectPropsFromName();
        propertyIndex = propertyNames.indexOf(propertyName);
      }

      if (propertyIndex === -1) {
        error(`Property '${propertyName}' not found in '${expression.getText()}'`);
      }

      const elementPtr = this.generator.builder.createSafeInBoundsGEP(llvmValue, [0, propertyIndex], propertyName);

      const inTSClassConstructor = () => Boolean(this.generator.currentFunction.name?.endsWith("__constructor"));

      // In ts class constructor we cannot dereference 'this' pointer since the memory was just allocated and was not initialized.
      // Dereferencing will lead to segfault.
      return inTSClassConstructor() && expression.getText() === InternalNames.This
        ? elementPtr
        : this.generator.builder.createLoad(elementPtr);
    }
  }
}

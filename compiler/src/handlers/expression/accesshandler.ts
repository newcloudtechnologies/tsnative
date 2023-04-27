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

import { Environment, IdentifierNotFound, Scope } from "../../scope";
import * as ts from "typescript";

import { AbstractExpressionHandler } from "./expressionhandler";
import { LLVMValue } from "../../llvm/value";
import { Declaration } from "../../ts/declaration";
import { IfBlockCreator } from "../ifblockcreator"

export class AccessHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PropertyAccessExpression:
        const symbol = this.generator.ts.checker.getSymbolAtLocation(expression);

        if (symbol.declarations.some((declaration) => declaration.isGetAccessor() || declaration.isSetAccessor())) {
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

  private hasProperty(declaration: Declaration, property: string): boolean {
    const has = declaration.members.findIndex((member: Declaration) => member.name?.getText() === property) !== -1;
    if (has) {
      return has;
    }

    if (declaration.heritageClauses) {
      for (const clause of declaration.heritageClauses) {
        for (const type of clause.types) {
          const symbol = this.generator.ts.checker.getSymbolAtLocation(type.expression);
          const baseDeclaration = symbol.valueDeclaration;
          const baseHas = baseDeclaration && this.hasProperty(baseDeclaration, property);

          if (baseHas) {
            return baseHas;
          }
        }
      }
    }

    return false;
  }

  private handlePropertyAccessExpression(expression: ts.PropertyAccessExpression, env?: Environment): LLVMValue {
    if (env) {
      const index = env.getVariableIndex(expression.getText());
      if (index > -1) {
        return this.generator.builder.createSafeExtractValue(env.typed.getValue(), [index]);
      }
    }
    
    const maybeStaticProperty = this.tryHandleStaticPropertyAccess(expression);
    if (maybeStaticProperty) {
      return maybeStaticProperty;
    }

    return this.handlePropertyAccessGEP(expression, env);
  }

  private tryHandleStaticPropertyAccess(expression: ts.PropertyAccessExpression) {
    const left = expression.expression;
    const propertyName = expression.name.text;

    let scope;
    let identifier = left.getText();

    if (this.generator.ts.checker.nodeHasSymbolAndDeclaration(left)) {
      const symbol = this.generator.ts.checker.getSymbolAtLocation(left);
      const valueDeclaration = symbol.valueDeclaration || symbol.declarations[0];

      if (valueDeclaration.isClass() && this.hasProperty(valueDeclaration, propertyName)) {
        const type = this.generator.ts.checker.getTypeOfSymbolAtLocation(symbol, expression);
        identifier = type.mangle();
      }
    }

    try {
      scope = this.generator.symbolTable.get(identifier);

      // Ignore empty catch block
      // tslint:disable-next-line
    } catch (_) { }

    if (scope && scope instanceof Scope) {
      const value = scope.getStatic(propertyName);

      if (value instanceof LLVMValue) {
        return value;
      }
    }

    return;
  }

  private handleElementAccessExpression(expression: ts.ElementAccessExpression, env?: Environment): LLVMValue {
    const type = this.generator.ts.checker.getTypeAtLocation(expression.expression);

    if (type.isArray()) {
      return this.handleArrayElementAccess(expression, env);
    } else if (type.isTuple()) {
      return this.handleTupleElementAccess(expression, env);
    } else if (type.isString()) {
      return this.handleStringElementAccess(expression, env);
    } else if (type.isObject()) {
      return this.handlePropertyAccessGEP(expression, env);
    } else {
      throw new Error(`Unsupported element access for type: ${type.toString()}`);
    }
  }

  private handleArrayElementAccess(expression: ts.ElementAccessExpression, env?: Environment): LLVMValue {
    const arrayType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const subscription = this.generator.ts.array.createSubscription(arrayType);
    const array = this.generator.handleExpression(expression.expression, env).derefToPtrLevel1();
    const arrayUntyped = this.generator.builder.asVoidStar(array);
    const index = this.generator.handleExpression(expression.argumentExpression, env).derefToPtrLevel1();

    let elementType = arrayType.getTypeGenericArguments()[0];

    const element = this.generator.builder.createSafeCall(subscription, [arrayUntyped, index]);
    if (!elementType.isSupported()) {
      elementType = this.generator.symbolTable.currentScope.typeMapper.get(elementType.toString());
    }
    const elementLLVMType = elementType.getLLVMType();

    return this.generator.builder.createBitCast(element, elementLLVMType);
  }

  private handleStringElementAccess(expression: ts.ElementAccessExpression, env?: Environment): LLVMValue {
    const subscription = this.generator.ts.str.createSubscription();
    const string = this.generator.handleExpression(expression.expression, env).derefToPtrLevel1();
    const stringUntyped = this.generator.builder.asVoidStar(string);
    const index = this.generator.handleExpression(expression.argumentExpression, env).derefToPtrLevel1();
    const element = this.generator.builder.createSafeCall(subscription, [stringUntyped, index]);
    return element;
  }

  private handleTupleElementAccess(expression: ts.ElementAccessExpression, env?: Environment): LLVMValue {
    const tuple = this.generator.handleExpression(expression.expression, env).derefToPtrLevel1();
    const index = this.generator.handleExpression(expression.argumentExpression, env).derefToPtrLevel1();
    const element = this.generator.ts.tuple.createSubscriptionCallForLLVMValue(tuple, index);
    const elementIndex = parseInt(expression.argumentExpression.getText(), 10);

    // Handle case with runtime index access.
    if (isNaN(elementIndex)) {
      return this.generator.ts.union.create(element);
    }

    const tupleType = this.generator.ts.checker.getTypeAtLocation(expression.expression);

    let elementType = tupleType.getTypeGenericArguments()[elementIndex];
    if (elementType.isFunction()) {
      elementType = this.generator.tsclosure.getTSType();
    }

    return this.generator.builder.createBitCast(element, elementType.getLLVMType());
  }

  private handlePropertyAccessGEP(expression: ts.PropertyAccessExpression | ts.ElementAccessExpression, env?: Environment): LLVMValue {
    const left = expression.expression;
    let propertyName = ts.isPropertyAccessExpression(expression) ? expression.name.text : expression.argumentExpression.getText().replace(/['"]+/g, '');

    let llvmValue = this.generator.handleExpression(left, env).derefToPtrLevel1();
    if (!llvmValue.type.isPointer()) {
      throw new Error(`Expected pointer, got '${llvmValue.type}'`);
    }

    if (!llvmValue.type.isPointerToStruct()) {
      throw new Error(
        `Expected '${left.getText()}' to be a pointer to struct, got '${llvmValue.type.toString()}'. Error at '${expression.getText()}'`
      );
    }

    if (llvmValue.type.isUnion()) {
      llvmValue = this.generator.ts.union.get(llvmValue);
    }

    // Check if statement is property assignment, e.g.
    // this.v = 22
    // ^^^^ expression
    // ^^^^^^ expression.parent
    // ^^^^^^^^^^^ expression.parent.parent
    const isPropertyAssignment =
      ts.isBinaryExpression(left.parent.parent) &&
      left.parent.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      left.parent.parent.left === left.parent;

    if (isPropertyAssignment) {
      return llvmValue;
    }

    let value = this.generator.ts.obj.get(llvmValue, propertyName);
    const objectType = this.generator.ts.checker.getTypeAtLocation(left);

    const propertySymbol = objectType.getProperty(propertyName);
    const propertyDeclaration = propertySymbol.valueDeclaration || propertySymbol.declarations[0];

    let propertyType = propertyDeclaration.type;
    propertyType = propertyType.isSupported() ? propertyType : this.generator.ts.obj.getTSType();

    const valuePtrPtr = this.generator.builder.createAlloca(value.type);
    this.generator.builder.createSafeStore(value, valuePtrPtr);

    if (propertyType.isUnion()) {
      const ifBlockCreator = new IfBlockCreator(this.generator);

      const isUndefined = this.generator.ts.obj.createIsUndefined(value);

      const thenAction = () => {
        let wrappedValue = this.generator.ts.union.create(value);
        wrappedValue = this.generator.builder.createBitCast(wrappedValue, this.generator.ts.obj.getLLVMType());
        this.generator.builder.createSafeStore(wrappedValue, valuePtrPtr);
      }

      const elseAction = () => {

      }

      ifBlockCreator.create(isUndefined, thenAction, elseAction);
    }

    const targetLLVMType = propertyType.getLLVMType();

    return this.generator.builder.createBitCast(valuePtrPtr.derefToPtrLevel1(), targetLLVMType);
  }
}

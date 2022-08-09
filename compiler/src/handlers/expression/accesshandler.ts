import { Environment, HeapVariableDeclaration, IdentifierNotFound, Scope, ScopeValue } from "../../scope";
import * as ts from "typescript";

import { AbstractExpressionHandler } from "./expressionhandler";
import { LLVMValue } from "../../llvm/value";
import { LLVMType } from "../../llvm/type";
import { Declaration } from "../../ts/declaration";

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

    const maybeNamespaceMember = this.tryHandleNamespaceMemberAccess(expression);
    if (maybeNamespaceMember) {
      return maybeNamespaceMember;
    }

    const maybeStaticProperty = this.tryHandleStaticPropertyAccess(expression);
    if (maybeStaticProperty) {
      return maybeStaticProperty;
    }

    return this.handlePropertyAccessGEP(expression, env);
  }

  private tryHandleNamespaceMemberAccess(expression: ts.PropertyAccessExpression) {
    const left = expression.expression;
    const propertyName = expression.name.text;

    let scope;
    let identifier = left.getText();

    try {
      scope = this.generator.symbolTable.get(identifier);
    } catch (e) {
      if (!(e instanceof IdentifierNotFound)) {
        throw e;
      }
    }

    if (scope && scope instanceof Scope) {
      const value = scope.get(propertyName);

      if (value instanceof LLVMValue) {
        return value;
      } else if (value instanceof HeapVariableDeclaration) {
        return value.allocated;
      }
    }

    return;
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
    } else {
      throw new Error(`Unsupported element access for type: ${type.toString()}`);
    }
  }

  private handleArrayElementAccess(expression: ts.ElementAccessExpression, env?: Environment): LLVMValue {
    const arrayType = this.generator.ts.checker.getTypeAtLocation(expression.expression);
    const subscription = this.generator.ts.array.createSubscription(arrayType);
    const array = this.generator.handleExpression(expression.expression, env);
    const arrayUntyped = this.generator.builder.asVoidStar(array);
    const index = this.generator.handleExpression(expression.argumentExpression, env);

    let elementType = arrayType.getTypeGenericArguments()[0];

    const element = this.generator.builder.createSafeCall(subscription, [arrayUntyped, index]);
    if (!elementType.isSupported()) {
      elementType = this.generator.symbolTable.currentScope.typeMapper.get(elementType.toString());
    }
    const elementLLVMType = elementType.getLLVMType();

    return this.generator.builder.createBitCast(element, elementLLVMType);
  }

  private handleTupleElementAccess(expression: ts.ElementAccessExpression, env?: Environment): LLVMValue {
    const subscription = this.generator.ts.tuple.createSubscription();
    const tuple = this.generator.handleExpression(expression.expression, env);
    const tupleUntyped = this.generator.builder.asVoidStar(tuple);
    const index = this.generator.handleExpression(expression.argumentExpression, env);

    const element = this.generator.builder.createSafeCall(subscription, [tupleUntyped, index]);
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

  private handlePropertyAccessGEP(expression: ts.PropertyAccessExpression, env?: Environment): LLVMValue {
    const left = expression.expression;
    let propertyName = expression.name.text;

    let llvmValue = this.generator.handleExpression(left, env);

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

    let value = this.generator.ts.obj.get(llvmValue, propertyName);

    let type = this.generator.ts.checker.getTypeAtLocation(left);
    if (!type.isSymbolless()) {
      const propertySymbol = type.getProperty(propertyName);
      const propertyDeclaration = propertySymbol.valueDeclaration || propertySymbol.declarations[0];
      const propertyType = propertyDeclaration.type;

      type = propertyType.isSupported() ? propertyType : this.generator.ts.obj.getTSType();
    } else {
      type = this.generator.ts.checker.getTypeAtLocation(left.parent);
    }

    let targetLLVMType: LLVMType;

    // @todo startsWith?
    const isThisAccess = left.getText() === this.generator.internalNames.This;

    // Check if statement is initialization of 'this' value, e.g.
    // this.v = 22
    // ^^^^ expression
    // ^^^^^^ expression.parent
    // ^^^^^^^^^^^ expression.parent.parent
    const isInitialization =
      ts.isBinaryExpression(left.parent.parent) &&
      left.parent.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      left.parent.parent.left === left.parent;

    if (isThisAccess && isInitialization) {
      targetLLVMType = this.generator.ts.union.getLLVMType();
    } else {
      targetLLVMType = type.getLLVMType();

      if (!type.isOptionalUnion()) {
        value = this.generator.ts.union.get(value);
      }
    }

    return this.generator.builder.createBitCast(value, targetLLVMType);
  }
}

import { Environment, HeapVariableDeclaration, Scope, ScopeValue } from "@scope";
import {
  checkIfStaticProperty,
  error,
  getAliasedSymbolIfNecessary,
  getLLVMValue,
  getTSObjectPropsFromName,
  indexOfProperty,
  InternalNames,
  inTSClassConstructor,
  isIntersectionLLVMType,
  isUnionLLVMType,
  tryResolveGenericTypeIfNecessary,
  unwrapPointerType,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

import { AbstractExpressionHandler } from "./expressionhandler";
import { createArraySubscription } from "@handlers";
import { TypeMangler } from "@mangling";

export class AccessHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PropertyAccessExpression:
        let symbol = this.generator.checker.getSymbolAtLocation(expression);
        if (!symbol) {
          error("No symbol found");
        }

        symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);
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

  private findInHeritageClasses(node: ts.Node, visitor: (classDeclaration: ts.ClassDeclaration) => boolean): boolean {
    const symbol = this.generator.checker.getSymbolAtLocation(node);

    if (symbol && symbol.valueDeclaration && ts.isClassDeclaration(symbol.valueDeclaration)) {
      const classDeclaration = symbol.valueDeclaration;
      if (visitor(classDeclaration)) {
        return true; // found
      } else {
        if (classDeclaration.heritageClauses) {
          for (const clause of classDeclaration.heritageClauses) {
            for (const type of clause.types) {
              if (this.findInHeritageClasses(type.expression, visitor)) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
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
          let symbol = this.generator.checker.getSymbolAtLocation(type.expression);
          if (!symbol) {
            error(`No symbol found at '${type.expression.getText()}'`);
          }

          symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);
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

  private handlePropertyAccessExpression(expression: ts.PropertyAccessExpression, env?: Environment): llvm.Value {
    const left = expression.expression;
    let propertyName = expression.name.text;

    const isStaticProperty = (node: ts.Node, name: string): boolean => {
      return this.findInHeritageClasses(node, (classDeclaration: ts.ClassDeclaration) => {
        const index = classDeclaration.members.findIndex((v: ts.ClassElement) => {
          return ts.isPropertyDeclaration(v) && checkIfStaticProperty(v) && v.name.getText() === name;
        });

        return index !== -1;
      });
    };

    if (env) {
      const index = isStaticProperty(left, propertyName)
        ? env.getVariableIndex(left.getText() + "." + propertyName) // Clazz.i
        : env.getVariableIndex(propertyName);

      if (index > -1) {
        return this.generator.xbuilder.createSafeExtractValue(getLLVMValue(env.typed, this.generator), [index]);
      }
    }

    let scope;
    try {
      let symbol = this.generator.checker.getSymbolAtLocation(left);
      if (!symbol) {
        error("No symbol found");
      }

      symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);

      const declaration = symbol.valueDeclaration;

      let identifier = left.getText();

      if (
        (ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration)) &&
        this.hasProperty(declaration, propertyName)
      ) {
        let type = this.generator.checker.getTypeOfSymbolAtLocation(symbol, expression);
        type = tryResolveGenericTypeIfNecessary(type, this.generator);
        identifier = TypeMangler.mangle(type, this.generator.checker, declaration);
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
      } else if (value instanceof llvm.Value) {
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

  private handleElementAccessExpression(expression: ts.ElementAccessExpression, env?: Environment): llvm.Value {
    const subscription = createArraySubscription(expression, this.generator);
    const array = this.generator.handleExpression(expression.expression, env);
    const arrayUntyped = this.generator.xbuilder.asVoidStar(array);
    const index = this.generator.createLoadIfNecessary(
      this.generator.handleExpression(expression.argumentExpression, env)
    );

    return this.generator.xbuilder.createSafeCall(subscription, [arrayUntyped, index]);
  }

  private handlePropertyAccessGEP(propertyName: string, expression: ts.Expression, env?: Environment): llvm.Value {
    let llvmValue = this.generator.handleExpression(expression, env);
    if (!llvmValue.type.isPointerTy()) {
      error(`Expected pointer, got '${llvmValue.type}'`);
    }

    const { checker, builder, xbuilder, meta } = this.generator;

    while ((llvmValue.type as llvm.PointerType).elementType.isPointerTy()) {
      llvmValue = builder.createLoad(llvmValue);
    }

    if (isUnionLLVMType(llvmValue.type)) {
      const unionName = (unwrapPointerType(llvmValue.type) as llvm.StructType).name;
      if (!unionName) {
        error("Name required for UnionStruct");
      }

      const unionMeta = meta.getUnionMeta(unionName);
      const index = unionMeta.propsMap.get(propertyName);
      if (typeof index === "undefined") {
        error(`Mapping not found for ${propertyName}`);
      }

      return builder.createLoad(xbuilder.createSafeInBoundsGEP(llvmValue, [0, index]));
    } else if (isIntersectionLLVMType(llvmValue.type)) {
      const intersectionName = (unwrapPointerType(llvmValue.type) as llvm.StructType).name;
      if (!intersectionName) {
        error("Name required for IntersectionStruct");
      }

      const intersectionMeta = meta.getIntersectionMeta(intersectionName);
      const index = intersectionMeta.props.indexOf(propertyName);
      if (index === -1) {
        error(`Mapping not found for ${propertyName}`);
      }

      return builder.createLoad(xbuilder.createSafeInBoundsGEP(llvmValue, [0, index]));
    } else {
      let propertyIndex = -1;

      if (!llvmValue.name || llvmValue.name === InternalNames.This) {
        const type = checker.getTypeAtLocation(expression);
        propertyIndex = indexOfProperty(propertyName, checker.getApparentType(type), checker);
      } else {
        // Object name is its properties names reduced to string, delimited with the dot ('.').
        const propertyNames = getTSObjectPropsFromName(llvmValue.name);
        propertyIndex = propertyNames.indexOf(propertyName);
      }

      if (propertyIndex === -1) {
        error(`Property '${propertyName}' not found in '${expression.getText()}'`);
      }

      const elementPtr = xbuilder.createSafeInBoundsGEP(llvmValue, [0, propertyIndex], propertyName);

      // In ts class constructor we cannot dereference this pointer since the memory was just allocated and was not initialized.
      // Dereferencing will lead to segfault.
      return inTSClassConstructor(this.generator) ? elementPtr : builder.createLoad(elementPtr);
    }
  }
}

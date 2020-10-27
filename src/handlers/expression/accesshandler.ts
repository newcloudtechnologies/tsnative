import { Environment, HeapVariableDeclaration, Scope } from "@scope";
import {
  indexOfProperty,
  inTSClassConstructor,
  isUnionLLVMType,
  unwrapPointerType,
  checkIfStaticProperty,
  error,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

import { AbstractExpressionHandler } from "./expressionhandler";
import { createArraySubscription } from "@handlers";

export class AccessHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.PropertyAccessExpression:
        const symbol = this.generator.checker.getSymbolAtLocation(expression);

        let valueDeclaration: ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | undefined;

        if (symbol) {
          for (const it of symbol.declarations) {
            if (it.kind === ts.SyntaxKind.GetAccessor) {
              valueDeclaration = it as ts.GetAccessorDeclaration;
              break;
            }

            if (it.kind === ts.SyntaxKind.SetAccessor) {
              valueDeclaration = it as ts.SetAccessorDeclaration;
              break;
            }
          }

          if (valueDeclaration && ts.isGetAccessorDeclaration(valueDeclaration)) {
            // Handle get accessors in FunctionHandler.
            break;
          }

          if (valueDeclaration && ts.isSetAccessorDeclaration(valueDeclaration)) {
            // Handle set accessors in FunctionHandler.
            break;
          }
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

    if (symbol && ts.isClassDeclaration(symbol.valueDeclaration)) {
      const classDeclaration = symbol.valueDeclaration;
      if (visitor(classDeclaration)) {
        return true; // has found
      } else {
        if (classDeclaration.heritageClauses) {
          for (const clause of classDeclaration.heritageClauses) {
            for (const type of clause.types) {
              if (this.findInHeritageClasses(type.expression, visitor)) return true;
            }
          }
        }
      }
    }

    return false;
  }

  private handlePropertyAccessExpression(expression: ts.PropertyAccessExpression, env?: Environment): llvm.Value {
    const left = expression.expression;
    const propertyName = expression.name.text;

    const isStaticProperty = (node: ts.Node, name: string): boolean => {
      let result = false;

      result = this.findInHeritageClasses(node, (classDeclaration: ts.ClassDeclaration) => {
        const found = classDeclaration.members.findIndex((v: ts.ClassElement) => {
          if (ts.isPropertyDeclaration(v)) {
            const propertyDeclaration = v as ts.PropertyDeclaration;

            return checkIfStaticProperty(propertyDeclaration) && propertyDeclaration.name.getText() === name;
          } else {
            return false;
          }
        });

        return found !== -1;
      });

      return result;
    };

    if (ts.isIdentifier(left)) {
      if (env) {
        const index = isStaticProperty(left, propertyName)
          ? env.varNames.indexOf(left.getText() + "." + propertyName) // Clazz.i
          : env.varNames.indexOf(propertyName);

        if (index > -1) {
          if (!env.data.type.isStructTy()) {
            error(`Expected environment to be of StructType, got '${env.data.type.toString()}'`);
          }
          if (env.data.type.numElements === 0) {
            error("Identifier handler: Trying to extract a value from an empty struct");
          }
          return this.generator.xbuilder.createSafeExtractValue(env.data, [index]);
        }
      }

      let scope;
      try {
        // It's not an error to not find it in symbol table
        scope = this.generator.symbolTable.get(left.getText());

        // Ignore empty catch block
        // tslint:disable-next-line
      } catch (_) { }

      if (scope && scope instanceof Scope) {
        let value = scope.get(propertyName);

        if (!value) {
          value = scope.getStatic(propertyName);
        }

        if (!value) {
          value = scope.getStatic(scope.name + "." + propertyName);
        }

        if (!value) {
          error(`Property '${propertyName}' not found in '${left.getText()}'`);
        }

        if (value instanceof HeapVariableDeclaration) {
          return value.allocated;
        }

        if (!(value instanceof llvm.Value)) {
          error(`Property '${propertyName}' is not a llvm.Value`);
        }

        return value;
      }
    }

    return this.handlePropertyAccessGEP(propertyName, left, env);
  }

  private handleElementAccessExpression(expression: ts.ElementAccessExpression, env?: Environment): llvm.Value {
    const subscription = createArraySubscription(expression, this.generator);
    const array = this.generator.handleExpression(expression.expression, env);
    const index = this.generator.createLoadIfNecessary(
      this.generator.handleExpression(expression.argumentExpression, env)
    );
    return this.generator.xbuilder.createSafeCall(subscription, [array, index]);
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
      if (!unionMeta) {
        error(`No union meta found for ${unionName}`);
      }

      const index = unionMeta.propsMap.get(propertyName);
      if (typeof index === "undefined") {
        error(`Mapping not found for ${propertyName}`);
      }

      return builder.createLoad(xbuilder.createSafeInBoundsGEP(llvmValue, [0, index]));
    } else {
      let propertyIndex = -1;

      if (!llvmValue.name || llvmValue.name === "this") {
        const type = checker.getTypeAtLocation(expression);
        propertyIndex = indexOfProperty(propertyName, checker.getApparentType(type), checker);
      } else {
        // Object name is its properties names reduced to string, delimited with the dot ('.').
        const propertyNames = llvmValue.name.split("__object__")[1].split(".");
        if (propertyNames.length === 0) {
          error(`Expected object name to be its properties names reduced to string, delimited with the dot.`);
        }
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

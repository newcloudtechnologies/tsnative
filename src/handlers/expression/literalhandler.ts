import { createArrayPush, createArrayConstructor } from "@handlers";
import { error, getLLVMType, getTypeGenericArguments } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { addClassScope } from "@scope";

export class LiteralHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        return this.handleBooleanLiteral(expression as ts.BooleanLiteral);
      case ts.SyntaxKind.NumericLiteral:
        return this.handleNumericLiteral(expression as ts.NumericLiteral);
      case ts.SyntaxKind.StringLiteral:
        return this.handleStringLiteral(expression as ts.StringLiteral);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.handleArrayLiteralExpression(expression as ts.ArrayLiteralExpression);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.handleObjectLiteralExpression(expression as ts.ObjectLiteralExpression);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression);
    }

    return;
  }

  private handleBooleanLiteral(expression: ts.BooleanLiteral): llvm.Value {
    if (expression.kind === ts.SyntaxKind.TrueKeyword) {
      return llvm.ConstantInt.getTrue(this.generator.context);
    }
    return llvm.ConstantInt.getFalse(this.generator.context);
  }

  private handleNumericLiteral(expression: ts.NumericLiteral): llvm.Value {
    return llvm.ConstantFP.get(this.generator.context, parseFloat(expression.text));
  }

  private handleStringLiteral(expression: ts.StringLiteral): llvm.Value {
    const llvmThisType = this.generator.builtinString.getLLVMType();
    const constructor = this.generator.builtinString.getLLVMConstructor(expression);
    const ptr = this.generator.builder.createGlobalStringPtr(expression.text) as llvm.Constant;
    const allocated = this.generator.gc.allocate((llvmThisType as llvm.PointerType).elementType);
    this.generator.builder.createCall(constructor, [allocated, ptr]);
    return allocated;
  }

  private handleArrayLiteralExpression(expression: ts.ArrayLiteralExpression): llvm.Value {
    addClassScope(expression, this.generator.symbolTable.globalScope, this.generator);

    const arrayType = this.generator.checker.getTypeAtLocation(expression);
    const elementType = getTypeGenericArguments(arrayType)[0];

    const { constructor, allocated } = createArrayConstructor(arrayType, expression, this.generator);
    this.generator.builder.createCall(constructor, [allocated]);

    const push = createArrayPush(arrayType, elementType, expression, this.generator);
    for (const element of expression.elements) {
      const elementValue = this.generator.handleExpression(element);
      this.generator.builder.createCall(push, [allocated, elementValue]);
    }

    return allocated;
  }

  private handleObjectLiteralExpression(expression: ts.ObjectLiteralExpression): llvm.Value {
    const type = getLLVMType(this.generator.checker.getTypeAtLocation(expression), expression, this.generator);
    const object = this.generator.gc.allocate(type.isPointerTy() ? type.elementType : type);

    let propertyIndex = 0;
    for (const property of expression.properties) {
      switch (property.kind) {
        case ts.SyntaxKind.PropertyAssignment:
        case ts.SyntaxKind.ShorthandPropertyAssignment:
          const value = ts.isPropertyAssignment(property)
            ? this.generator.handleExpression(property.initializer)
            : this.generator.handleExpression(property.name);

          const indexList = [
            llvm.ConstantInt.get(this.generator.context, 0),
            llvm.ConstantInt.get(this.generator.context, propertyIndex++),
          ];
          const pointer = this.generator.builder.createInBoundsGEP(object, indexList, property.name.getText());
          this.generator.builder.createStore(value, pointer);
          break;
        default:
          return error(`Unhandled ts.ObjectLiteralElementLike '${ts.SyntaxKind[property.kind]}'`);
      }
    }

    return object;
  }
}

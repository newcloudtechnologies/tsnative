import { createGCAllocate } from "@builtins";
import { getMethod } from "@emitter";
import { LLVMGenerator } from "@generator";
import { error, getLLVMType, getStringType, getTypeArguments } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export class LiteralEmitter {
  emitBooleanLiteral(expression: ts.BooleanLiteral, generator: LLVMGenerator): llvm.Value {
    if (expression.kind === ts.SyntaxKind.TrueKeyword) {
      return llvm.ConstantInt.getTrue(generator.context);
    } else {
      return llvm.ConstantInt.getFalse(generator.context);
    }
  }

  emitNumericLiteral(expression: ts.NumericLiteral, generator: LLVMGenerator): llvm.Value {
    return llvm.ConstantFP.get(generator.context, parseFloat(expression.text));
  }

  emitStringLiteral(expression: ts.StringLiteral, generator: LLVMGenerator): llvm.Value {
    const ptr = generator.builder.createGlobalStringPtr(expression.text) as llvm.Constant;
    const length = llvm.ConstantInt.get(generator.context, expression.text.length);
    return llvm.ConstantStruct.get(getStringType(generator.context), [ptr, length]);
  }

  emitArrayLiteralExpression(expression: ts.ArrayLiteralExpression, generator: LLVMGenerator): llvm.Value {
    const arrayType = generator.checker.getTypeAtLocation(expression);
    const elementType = getTypeArguments(arrayType)[0];
    const constructor = getMethod(expression, "constructor", [], generator);
    const push = getMethod(expression, "push", [elementType], generator).functionDeclaration!;
    const array = generator.builder.createCall(constructor.functionDeclaration!, [constructor.thisValue!]);

    for (const element of expression.elements) {
      const elementValue = generator.emitExpression(element);
      generator.builder.createCall(push, [array, elementValue]);
    }

    return array;
  }

  emitObjectLiteralExpression(expression: ts.ObjectLiteralExpression, generator: LLVMGenerator): llvm.Value {
    const type = getLLVMType(generator.checker.getTypeAtLocation(expression), expression, generator);
    const object = createGCAllocate(type.isPointerTy() ? type.elementType : type, generator);

    let propertyIndex = 0;
    for (const property of expression.properties) {
      switch (property.kind) {
        case ts.SyntaxKind.PropertyAssignment:
        case ts.SyntaxKind.ShorthandPropertyAssignment:
          const value = ts.isPropertyAssignment(property)
            ? generator.emitExpression(property.initializer)
            : generator.emitExpression(property.name);

          const indexList = [
            llvm.ConstantInt.get(generator.context, 0),
            llvm.ConstantInt.get(generator.context, propertyIndex++)
          ];
          const pointer = generator.builder.createInBoundsGEP(object, indexList, property.name.getText());
          generator.builder.createStore(value, pointer);
          break;
        default:
          return error(`Unhandled ts.ObjectLiteralElementLike '${ts.SyntaxKind[property.kind]}'`);
      }
    }

    return object;
  }
}

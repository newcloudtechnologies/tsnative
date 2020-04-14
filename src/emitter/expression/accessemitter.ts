import { getMethod } from "@emitter";
import { LLVMGenerator } from "@generator";
import { Scope } from "@scope";
import { error, getPropertyIndex, isArray, isString } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export class AccessEmitter {
  emitPropertyAccessExpression(expression: ts.PropertyAccessExpression, generator: LLVMGenerator): llvm.Value {
    const left = expression.expression;
    const propertyName = expression.name.text;

    if (propertyName === "length") {
      if (isArray(generator.checker.getTypeAtLocation(left))) {
        return this.emitArrayLengthAccess(left, generator);
      }

      if (isString(generator.checker.getTypeAtLocation(left))) {
        return this.emitStringLengthAccess(left, generator);
      }
    }

    if (ts.isIdentifier(left)) {
      const value = generator.symbolTable.get((left as ts.Identifier).text);
      if (value instanceof Scope) {
        return value.get(propertyName) as llvm.Value;
      }
    }

    return this.emitPropertyAccessGEP(propertyName, left, generator);
  }

  emitElementAccessExpression(expression: ts.ElementAccessExpression, generator: LLVMGenerator): llvm.Value {
    const subscript = getMethod(
      expression,
      "subscript",
      [generator.checker.getTypeAtLocation(expression.argumentExpression)],
      generator
    ).functionDeclaration!;
    const array = generator.emitExpression(expression.expression);
    const index = generator.emitExpression(expression.argumentExpression);
    return generator.builder.createCall(subscript, [array, index]);
  }

  emitPropertyAccessGEP(propertyName: string, expression: ts.Expression, generator: LLVMGenerator): llvm.Value {
    const value = generator.emitExpression(expression);

    if (!value.type.isPointerTy() || !value.type.elementType.isStructTy()) {
      return error(`Property access left-hand-side must be a pointer to a struct, found '${value.type}'`);
    }

    const type = generator.checker.getTypeAtLocation(expression);
    const index = getPropertyIndex(propertyName, generator.checker.getApparentType(type), generator.checker);
    const indexList = [llvm.ConstantInt.get(generator.context, 0), llvm.ConstantInt.get(generator.context, index)];

    return generator.builder.createInBoundsGEP(value, indexList, propertyName);
  }

  private emitArrayLengthAccess(expression: ts.Expression, generator: LLVMGenerator) {
    const lengthGetter = getMethod(expression, "length", [], generator).functionDeclaration!;
    const array = generator.emitExpression(expression);
    return generator.builder.createCall(lengthGetter, [array]);
  }

  private emitStringLengthAccess(expression: ts.Expression, generator: LLVMGenerator) {
    const string = generator.emitExpression(expression);
    const length = generator.builder.createExtractValue(string, [1]);
    return generator.builder.createUIToFP(length, llvm.Type.getDoubleTy(generator.context), string.name + ".length");
  }
}

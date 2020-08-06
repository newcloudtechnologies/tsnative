import { withObjectProperties } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";

export class LiteralHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        return this.handleBooleanLiteral(expression as ts.BooleanLiteral);
      case ts.SyntaxKind.NumericLiteral:
        return this.handleNumericLiteral(expression as ts.NumericLiteral);
      case ts.SyntaxKind.StringLiteral:
        return this.handleStringLiteral(expression as ts.StringLiteral);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.handleObjectLiteralExpression(expression as ts.ObjectLiteralExpression, env);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleBooleanLiteral(expression: ts.BooleanLiteral): llvm.Value {
    const allocated = this.generator.gc.allocate(llvm.Type.getIntNTy(this.generator.context, 1));
    if (expression.kind === ts.SyntaxKind.TrueKeyword) {
      this.generator.builder.createStore(llvm.ConstantInt.getTrue(this.generator.context), allocated);
    } else {
      this.generator.builder.createStore(llvm.ConstantInt.getFalse(this.generator.context), allocated);
    }
    return allocated;
  }

  private handleNumericLiteral(expression: ts.NumericLiteral): llvm.Value {
    const allocated = this.generator.gc.allocate(llvm.Type.getDoublePtrTy(this.generator.context));
    const value = llvm.ConstantFP.get(this.generator.context, parseFloat(expression.text));
    this.generator.builder.createStore(value, allocated);
    return allocated;
  }

  private handleStringLiteral(expression: ts.StringLiteral): llvm.Value {
    const llvmThisType = this.generator.builtinString.getLLVMType();
    const constructor = this.generator.builtinString.getLLVMConstructor(expression);
    const ptr = this.generator.builder.createGlobalStringPtr(expression.text);
    const allocated = this.generator.gc.allocate(llvmThisType.elementType);
    this.generator.builder.createCall(constructor, [allocated, ptr]);
    return allocated;
  }

  private handleObjectLiteralExpression(expression: ts.ObjectLiteralExpression, env?: Environment): llvm.Value {
    const types: llvm.Type[] = [];
    const llvmValues = withObjectProperties(expression, (property: ts.ObjectLiteralElementLike) => {
      const value = ts.isPropertyAssignment(property)
        ? this.generator.handleExpression(property.initializer, env)
        : this.generator.handleExpression((property as ts.ShorthandPropertyAssignment).name, env);
      types.push(value.type);
      return value;
    });

    const objectType = llvm.StructType.get(this.generator.context, types);
    const object = this.generator.gc.allocate(objectType.isPointerTy() ? objectType.elementType : objectType);

    const propertyNames: string[] = [];
    let propertyIndex = 0;
    withObjectProperties(expression, (property: ts.ObjectLiteralElementLike) => {
      const indexList = [
        llvm.ConstantInt.get(this.generator.context, 0),
        llvm.ConstantInt.get(this.generator.context, propertyIndex),
      ];
      const pointer = this.generator.builder.createInBoundsGEP(object, indexList, property.name!.getText());
      this.generator.builder.createStore(llvmValues[propertyIndex], pointer);

      const propertyTypename = this.generator.checker.typeToString(this.generator.checker.getTypeAtLocation(property));

      propertyNames.push(property.name!.getText() + "__" + propertyTypename);
      ++propertyIndex;
    });

    const objectName = propertyNames.join(",");
    this.generator.symbolTable.addObjectName(objectName);

    return object;
  }
}

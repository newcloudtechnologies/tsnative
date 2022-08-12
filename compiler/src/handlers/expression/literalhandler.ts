import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment, HeapVariableDeclaration } from "../../scope";
import { LLVMConstantFP, LLVMConstantInt, LLVMValue } from "../../llvm/value";
import { TSTuple } from "../../ts/tuple";

export class LiteralHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        this.generator.emitLocation(expression);
        return this.handleBooleanLiteral(expression as ts.BooleanLiteral);
      case ts.SyntaxKind.NumericLiteral:
        this.generator.emitLocation(expression);
        return this.handleNumericLiteral(expression as ts.NumericLiteral);
      case ts.SyntaxKind.StringLiteral:
        this.generator.emitLocation(expression);
        return this.handleStringLiteral(expression as ts.StringLiteral);
      case ts.SyntaxKind.ObjectLiteralExpression:
        this.generator.emitLocation(expression);
        return this.handleObjectLiteralExpression(expression as ts.ObjectLiteralExpression, env);
      case ts.SyntaxKind.ArrayLiteralExpression:
        this.generator.emitLocation(expression);
        if (TSTuple.isTupleFromAssignment(expression)) {
          const arrayLiteralExpression = expression as ts.ArrayLiteralExpression;
          return this.handleTupleLiteral(arrayLiteralExpression.elements, env);
        }

        if (TSTuple.isTupleFromVariableDeclaration(expression)) {
          const variableDeclaration = expression.parent as ts.VariableDeclaration;
          if (!variableDeclaration.initializer) {
            throw new Error(`Tuples without initializer are not implemented`);
          }
          if (!ts.isArrayLiteralExpression(variableDeclaration.initializer)) {
            throw new Error(
              `Unexpected tuple initializer of kind '${ts.SyntaxKind[variableDeclaration.initializer.kind]
              }', expected array literal`
            );
          }

          return this.handleTupleLiteral(variableDeclaration.initializer.elements, env);
        }

        return this.handleArrayLiteralExpression(expression as ts.ArrayLiteralExpression, env);
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }

  private handleTupleLiteral(elements: ts.NodeArray<ts.Expression>, env?: Environment) {
    return this.generator.ts.tuple.create(elements, env);
  }

  private handleBooleanLiteral(expression: ts.BooleanLiteral): LLVMValue {
    const value =
      expression.kind === ts.SyntaxKind.TrueKeyword
        ? LLVMConstantInt.getTrue(this.generator)
        : LLVMConstantInt.getFalse(this.generator);
    return this.generator.builtinBoolean.create(value);
  }

  private handleNumericLiteral(expression: ts.NumericLiteral): LLVMValue {
    const value = LLVMConstantFP.get(this.generator, parseFloat(expression.text));
    return this.generator.builtinNumber.create(value);
  }

  private handleStringLiteral(expression: ts.StringLiteral): LLVMValue {
    const llvmThisType = this.generator.ts.str.getLLVMType();
    const constructor = this.generator.ts.str.getLLVMConstructor();
    const ptr = this.generator.builder.createGlobalStringPtr(expression.text);
    const allocated = this.generator.gc.allocate(llvmThisType.getPointerElementType());
    const thisUntyped = this.generator.builder.asVoidStar(allocated);
    this.generator.builder.createSafeCall(constructor, [thisUntyped, ptr]);
    return allocated;
  }

  private handleObjectLiteralExpression(expression: ts.ObjectLiteralExpression, env?: Environment): LLVMValue {
    const llvmValues = new Map<string, LLVMValue>();
    expression.properties.forEach((property) => {
      switch (property.kind) {
        case ts.SyntaxKind.PropertyAssignment:
          llvmValues.set(property.name.getText(), this.generator.handleExpression(property.initializer, env));
          break;
        case ts.SyntaxKind.ShorthandPropertyAssignment:
          llvmValues.set(property.name.getText(), this.generator.handleExpression(property.name, env));
          break;
        case ts.SyntaxKind.SpreadAssignment:
          const obj = this.generator.handleExpression(property.expression, env);

          const type = this.generator.ts.checker.getTypeAtLocation(property.expression);
          const props = type.getProperties();

          for (const prop of props) {
            const propDeclaration = prop.valueDeclaration || prop.declarations[0];
            const propName = prop.escapedName.toString();
            const maybePropValUntyped = this.generator.ts.obj.get(obj, propName);
            const propValUntyped = this.generator.ts.union.get(maybePropValUntyped);

            let propVal = this.generator.builder.createBitCast(propValUntyped, propDeclaration.type.getLLVMType());
            if (propVal.isTSPrimitivePtr()) {
              // mimics 'value' semantic for primitives
              propVal = propVal.clone();
            }

            llvmValues.set(prop.escapedName.toString(), propVal);
          }

          break;
        default:
          throw new Error(`Unreachable '${ts.SyntaxKind[property.kind]}'`);
      }
    });

    const obj = this.generator.ts.obj.create(this.generator.symbolTable.currentScope);

    llvmValues.forEach((value, key) => {
      this.generator.ts.obj.set(obj, key, value);
    });

    return obj;
  }

  private handleArrayLiteralExpression(expression: ts.ArrayLiteralExpression, outerEnv?: Environment): LLVMValue {
    const constructorAndMemory = this.generator.ts.array.createConstructor(expression);
    const { constructor } = constructorAndMemory;
    let { allocated } = constructorAndMemory;

    this.generator.builder.createSafeCall(constructor, [this.generator.builder.asVoidStar(allocated)]);

    if (expression.elements.length === 0) {
      return allocated;
    }

    const arrayType = this.generator.ts.array.getType(expression);
    const elementType = arrayType.getTypeGenericArguments()[0];

    const push = this.generator.ts.array.createPush(elementType, expression);
    for (const element of expression.elements) {
      if (ts.isSpreadElement(element)) {
        const concat = this.generator.ts.array.createConcat(expression);
        let elementValue = this.generator.handleExpression(element.expression, outerEnv);

        if (elementValue instanceof HeapVariableDeclaration) {
          elementValue = elementValue.allocated;
        }

        if (!elementType.isUnion() && elementValue.type.isUnion()) {
          elementValue = this.generator.ts.union.get(elementValue);
        }

        allocated = this.generator.builder.createSafeCall(concat, [
          this.generator.builder.asVoidStar(allocated),
          this.generator.builder.asVoidStar(elementValue),
        ]);
      } else {
        let elementValue = this.generator.handleExpression(element, outerEnv);
        if (!elementType.isUnion() && elementValue.type.isUnion()) {
          elementValue = this.generator.ts.union.get(elementValue);
        }

        this.generator.builder.createSafeCall(push, [
          this.generator.builder.asVoidStar(allocated),
          this.generator.builder.asVoidStar(elementValue),
        ]);
      }
    }

    return allocated;
  }
}

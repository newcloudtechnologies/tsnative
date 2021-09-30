import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment, HeapVariableDeclaration } from "../../scope";
import { LLVMConstantFP, LLVMConstantInt, LLVMValue } from "../../llvm/value";
import { LLVMStructType, LLVMType } from "../../llvm/type";

export class LiteralHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
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
      case ts.SyntaxKind.ArrayLiteralExpression:
        if (
          ts.isVariableDeclaration(expression.parent) &&
          expression.parent.type &&
          ts.isTupleTypeNode(expression.parent.type)
        ) {
          return this.handleTupleLiteral(expression.parent, env);
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

  private handleTupleLiteral(expression: ts.VariableDeclaration, env?: Environment) {
    if (!expression.initializer) {
      throw new Error(`Tuples without initializer are not implemented`);
    }

    const tupleType = expression.type! as ts.TupleTypeNode;
    const types = tupleType.elementTypes.map((type: ts.TypeNode) =>
      this.generator.ts.checker.getTypeFromTypeNode(type)
    );

    const constructor = this.generator.tuple.getLLVMConstructor(types);
    const type = this.generator.tuple.getLLVMType();

    const allocated = this.generator.gc.allocate(type.getPointerElementType());

    if (!ts.isArrayLiteralExpression(expression.initializer)) {
      throw new Error(
        `Unexpected tuple initializer of king ${ts.SyntaxKind[expression.initializer.kind]}, expected array literal`
      );
    }
    const initializer = expression.initializer.elements.map((element) =>
      this.generator.createLoadIfNecessary(this.generator.handleExpression(element, env))
    );

    this.generator.builder.createSafeCall(constructor, [allocated, ...initializer]);
    return allocated;
  }

  private handleBooleanLiteral(expression: ts.BooleanLiteral): LLVMValue {
    const allocated = this.generator.gc.allocate(LLVMType.getIntNType(1, this.generator));
    if (expression.kind === ts.SyntaxKind.TrueKeyword) {
      this.generator.builder.createSafeStore(LLVMConstantInt.getTrue(this.generator), allocated);
    } else {
      this.generator.builder.createSafeStore(LLVMConstantInt.getFalse(this.generator), allocated);
    }
    return allocated;
  }

  private handleNumericLiteral(expression: ts.NumericLiteral): LLVMValue {
    const allocated = this.generator.gc.allocate(LLVMType.getDoubleType(this.generator));
    const value = LLVMConstantFP.get(this.generator, parseFloat(expression.text));
    this.generator.builder.createSafeStore(value, allocated);
    return allocated;
  }

  private handleStringLiteral(expression: ts.StringLiteral): LLVMValue {
    const llvmThisType = this.generator.builtinString.getLLVMType();
    const constructor = this.generator.builtinString.getLLVMConstructor();
    const ptr = this.generator.builder.createGlobalStringPtr(expression.text);
    const allocated = this.generator.gc.allocate(llvmThisType.getPointerElementType());
    this.generator.builder.createSafeCall(constructor, [allocated, ptr]);
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
          const propertyValue = this.generator.handleExpression(property.expression, env);
          if (!propertyValue.type.isPointer()) {
            throw new Error(`Expected spread initializer to be of PointerType, got ${propertyValue.type.toString()}`);
          }
          if (!propertyValue.type.getPointerElementType().isStructType()) {
            throw new Error(
              `Expected spread initializer element type to be of StructType, got ${propertyValue.type
                .getPointerElementType()
                .toString()}`
            );
          }

          const names = [];
          if (propertyValue.type.isIntersection()) {
            const name = propertyValue.type.getTypename();
            const intersectionMeta = this.generator.meta.getIntersectionMeta(name);
            names.push(...intersectionMeta.props);
          } else {
            if (propertyValue.name) {
              // Try to handle propertyValue as a plain TS object. Its name is in format: %random__object__prop1.prop2.propN
              const props = propertyValue.getTSObjectPropsFromName();
              names.push(...props);
            } else {
              const name = propertyValue.type.getTypename();
              const structMeta = this.generator.meta.getStructMeta(name);
              names.push(...structMeta.props);
            }
          }

          for (let i = 0; i < (propertyValue.type.getPointerElementType() as LLVMStructType).numElements; ++i) {
            const value = this.generator.builder.createLoad(
              this.generator.builder.createSafeInBoundsGEP(propertyValue, [0, i])
            );

            value.name = names[i];
            llvmValues.set(names[i], value);
          }

          break;
        default:
          throw new Error(`Unreachable '${ts.SyntaxKind[property.kind]}'`);
      }
    });

    const types = Array.from(llvmValues.values()).map((value) => value.type);
    const objectType = LLVMStructType.get(this.generator, types);
    const object = this.generator.gc.allocate(objectType);

    Array.from(llvmValues.values()).forEach((value, index) => {
      const destinationPtr = this.generator.builder.createSafeInBoundsGEP(object, [0, index]);
      this.generator.builder.createSafeStore(value, destinationPtr);
    });

    object.name = this.createTSObjectName(Array.from(llvmValues.keys()));

    return object;
  }

  private handleArrayLiteralExpression(expression: ts.ArrayLiteralExpression, outerEnv?: Environment): LLVMValue {
    const arrayType = this.generator.ts.array.getType(expression);
    const elementType = arrayType.getTypeGenericArguments()[0];

    const constructorAndMemory = this.generator.ts.array.createConstructor(expression);
    const { constructor } = constructorAndMemory;
    let { allocated } = constructorAndMemory;

    this.generator.builder.createSafeCall(constructor, [this.generator.builder.asVoidStar(allocated)]);

    const push = this.generator.ts.array.createPush(elementType, expression);
    for (const element of expression.elements) {
      if (ts.isSpreadElement(element)) {
        const concat = this.generator.ts.array.createConcat(expression);
        let elementValue = this.generator.handleExpression(element.expression, outerEnv);

        if (elementValue instanceof HeapVariableDeclaration) {
          elementValue = elementValue.allocated;
        }

        allocated = this.generator.builder.createSafeCall(concat, [
          this.generator.builder.asVoidStar(allocated),
          this.generator.builder.asVoidStar(elementValue),
        ]);
      } else {
        let elementValue = this.generator.handleExpression(element, outerEnv);

        const tsType = this.generator.ts.checker.getTypeAtLocation(element);
        elementValue =
          tsType.isObject() || tsType.isFunction()
            ? this.generator.builder.asVoidStar(elementValue)
            : this.generator.createLoadIfNecessary(elementValue);

        this.generator.builder.createSafeCall(push, [this.generator.builder.asVoidStar(allocated), elementValue]);
      }
    }

    return allocated;
  }

  private createTSObjectName(props: string[]) {
    // Reduce object's props names to string to store them as object's name.
    // Later this name may be used for out-of-order object initialization and property access.
    return this.generator.randomString + "__object__" + props.join(".");
  }
}

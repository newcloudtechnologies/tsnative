import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment, HeapVariableDeclaration } from "../../scope";
import { LLVMConstantFP, LLVMConstantInt, LLVMValue } from "../../llvm/value";
import { LLVMStructType, LLVMType } from "../../llvm/type";
import { TSTuple } from "../../ts/tuple";
import { TSType } from "../../ts/type";

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
              `Unexpected tuple initializer of king ${
                ts.SyntaxKind[variableDeclaration.initializer.kind]
              }, expected array literal`
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
    const initializers = elements.map((e) =>
      this.generator.createLoadIfNecessary(this.generator.handleExpression(e, env))
    );
    const types = elements.map((e) => this.generator.ts.checker.getTypeAtLocation(e));

    const constructor = this.generator.tuple.getLLVMConstructor(types);
    const type = this.generator.tuple.getLLVMType();

    const allocated = this.generator.gc.allocate(type.getPointerElementType());

    this.generator.builder.createSafeCall(constructor, [allocated, ...initializers]);
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
          if (!propertyValue.type.isPointerToStruct()) {
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

    this.correctInterfacePropertiesOrder(expression, llvmValues);

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

  private correctInterfacePropertiesOrder(expression: ts.Expression, llvmValues: Map<string, LLVMValue>) {
    const isAssignment =
      ts.isBinaryExpression(expression.parent) && expression.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
    const isVariableDeclaration = ts.isVariableDeclaration(expression.parent);
    const isArgument = ts.isCallExpression(expression.parent);

    if (!isAssignment && !isVariableDeclaration && !isArgument) {
      return;
    }

    let variableType: TSType;
    if (isAssignment) {
      variableType = this.generator.ts.checker.getTypeAtLocation((expression.parent as ts.BinaryExpression).left);
    } else if (isVariableDeclaration) {
      variableType = this.generator.ts.checker.getTypeAtLocation((expression.parent as ts.VariableDeclaration).name);
    } else if (isArgument) {
      const parentFunction = expression.parent as ts.CallExpression | ts.NewExpression;

      const argumentIndex = parentFunction.arguments?.indexOf(expression);
      if (typeof argumentIndex === "undefined" || argumentIndex === -1) {
        throw new Error(`Unable to find argument '${expression.getText()}' in call '${parentFunction.getText()}'`);
      }

      const parentType = this.generator.ts.checker.getTypeAtLocation(parentFunction.expression);
      const parentSymbol = parentType.getSymbol();

      let parentFunctionDeclaration;

      if (parentFunction.expression.kind === ts.SyntaxKind.SuperKeyword || ts.isNewExpression(parentFunction)) {
        const classDeclaration = parentSymbol.valueDeclaration;
        if (!classDeclaration) {
          throw new Error(
            `Unable to find value declaration for class of type '${parentType.toString()}'. Error at '${parentFunction.getText()}'`
          );
        }

        const constructorDeclaration = classDeclaration.members.find((m) => m.isConstructor());
        if (!constructorDeclaration) {
          throw new Error(
            `Unable to find constructor at '${classDeclaration.getText()}'. Error at '${parentFunction.getText()}'`
          );
        }

        parentFunctionDeclaration = constructorDeclaration;
      } else {
        parentFunctionDeclaration = parentSymbol.valueDeclaration || parentSymbol.declarations[0];
      }

      const parentFunctionSignature = this.generator.ts.checker.getSignatureFromDeclaration(parentFunctionDeclaration);
      const declaredParameter = parentFunctionSignature.getDeclaredParameters()[argumentIndex];
      const declaredParameterType = this.generator.ts.checker.getTypeAtLocation(declaredParameter);

      variableType = declaredParameterType;
    } else {
      throw new Error("Unreachable in interface properties order correction");
    }

    if (variableType.isInterface()) {
      const interfaceSymbol = variableType.getSymbol();
      const interfaceDeclaration = interfaceSymbol.valueDeclaration || interfaceSymbol.declarations[0];

      if (!interfaceDeclaration) {
        throw new Error(`Unable to find declaration for type: '${variableType.toString()}'`);
      }

      if (interfaceDeclaration.members.some((m) => !m.name)) {
        throw new Error(`Expected all interface members to be named. Error at: '${interfaceDeclaration.getText()}'`);
      }

      const propNames = interfaceDeclaration.members.map((m) => m.name!.getText());

      const llvmValuesCopy = new Map(llvmValues);
      llvmValues.clear();

      for (const name of propNames) {
        const value = llvmValuesCopy.get(name);
        if (!value) {
          throw new Error(`Unable to find property name '${name}' in ${Array.from(llvmValuesCopy.keys())}`);
        }
        llvmValues.set(name, value);
      }
    }
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

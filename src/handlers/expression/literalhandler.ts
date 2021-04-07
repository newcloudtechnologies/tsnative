import {
  checkIfFunction,
  checkIfObject,
  createTSObjectName,
  error,
  getAliasedSymbolIfNecessary,
  getLLVMTypename,
  getTSObjectPropsFromName,
  getTypeGenericArguments,
  isIntersectionLLVMType,
  tryResolveGenericTypeIfNecessary,
  unwrapPointerType,
  withObjectProperties,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment, HeapVariableDeclaration } from "@scope";
import { createArrayConcat, createArrayConstructor, createArrayPush, getArrayType } from "@handlers";

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
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.handleArrayLiteralExpression(expression as ts.ArrayLiteralExpression, env);
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
      this.generator.xbuilder.createSafeStore(llvm.ConstantInt.getTrue(this.generator.context), allocated);
    } else {
      this.generator.xbuilder.createSafeStore(llvm.ConstantInt.getFalse(this.generator.context), allocated);
    }
    return allocated;
  }

  private handleNumericLiteral(expression: ts.NumericLiteral): llvm.Value {
    const allocated = this.generator.gc.allocate(llvm.Type.getDoubleTy(this.generator.context));
    const value = llvm.ConstantFP.get(this.generator.context, parseFloat(expression.text));
    this.generator.xbuilder.createSafeStore(value, allocated);
    return allocated;
  }

  private handleStringLiteral(expression: ts.StringLiteral): llvm.Value {
    const llvmThisType = this.generator.builtinString.getLLVMType();
    const constructor = this.generator.builtinString.getLLVMConstructor(expression);
    const ptr = this.generator.builder.createGlobalStringPtr(expression.text);
    const allocated = this.generator.gc.allocate(llvmThisType.elementType);
    this.generator.xbuilder.createSafeCall(constructor, [allocated, ptr]);
    return allocated;
  }

  private handleObjectLiteralExpression(expression: ts.ObjectLiteralExpression, env?: Environment): llvm.Value {
    const llvmValues = new Map<string, llvm.Value>();
    expression.properties.forEach((property) => {
      switch (property.kind) {
        case ts.SyntaxKind.PropertyAssignment:
          llvmValues.set(property.name.getText(), this.generator.handleExpression(property.initializer, env));
          break;
        case ts.SyntaxKind.ShorthandPropertyAssignment:
          llvmValues.set(property.name.getText(), this.generator.handleExpression(property.name, env));
          break;
        case ts.SyntaxKind.SpreadAssignment:
          let propertyType = this.generator.checker.getTypeAtLocation(property.expression);
          propertyType = tryResolveGenericTypeIfNecessary(propertyType, this.generator);

          const propertyValue = this.generator.handleExpression(property.expression, env);
          if (!propertyValue.type.isPointerTy()) {
            error(`Expected spread initializer to be of PointerType, got ${propertyValue.type.toString()}`);
          }
          if (!propertyValue.type.elementType.isStructTy()) {
            error(
              `Expected spread initializer element type to be of StructType, got ${propertyValue.type.elementType.toString()}`
            );
          }

          const names = [];
          if (isIntersectionLLVMType(propertyValue.type)) {
            const name = getLLVMTypename(propertyValue.type);
            const intersectionMeta = this.generator.meta.getIntersectionMeta(name);
            names.push(...intersectionMeta.props);
          } else {
            if (propertyValue.name) {
              // Try to handle propertyValue as a plain TS object. Its name is in format: %random__object__prop1.prop2.propN
              const props = getTSObjectPropsFromName(propertyValue.name);
              names.push(...props);
            } else {
              const name = getLLVMTypename(propertyValue.type);
              const structMeta = this.generator.meta.getStructMeta(name);
              names.push(...structMeta.props);
            }
          }

          for (let i = 0; i < propertyValue.type.elementType.numElements; ++i) {
            const value = this.generator.builder.createLoad(
              this.generator.xbuilder.createSafeInBoundsGEP(propertyValue, [0, i])
            );

            value.name = names[i];
            llvmValues.set(names[i], value);
          }

          break;
        default:
          error(`Unreachable '${ts.SyntaxKind[property.kind]}'`);
      }
    });

    const types = Array.from(llvmValues.values()).map((value) => value.type);
    const objectType = llvm.StructType.get(this.generator.context, types);
    const object = this.generator.gc.allocate(objectType);

    Array.from(llvmValues.values()).forEach((value, index) => {
      const destinationPtr = this.generator.xbuilder.createSafeInBoundsGEP(object, [0, index]);
      this.generator.xbuilder.createSafeStore(value, destinationPtr);
    });

    object.name = createTSObjectName(Array.from(llvmValues.keys()));

    const objectPropertyTypesName = withObjectProperties(expression, (property: ts.ObjectLiteralElementLike) => {
      if (!property.name) {
        return;
      }

      let propertyType = this.generator.checker.getTypeAtLocation(property);
      let propertyTypename = "";
      if (checkIfFunction(propertyType)) {
        // @todo: There should be a better way to get actual signature for generic functions.
        let symbol = propertyType.symbol;
        symbol = getAliasedSymbolIfNecessary(symbol, this.generator.checker);
        const valueDeclaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;

        const signature = this.generator.checker.getSignatureFromDeclaration(
          valueDeclaration as ts.SignatureDeclaration
        )!;
        let returnType = this.generator.checker.getReturnTypeOfSignature(signature);
        returnType = tryResolveGenericTypeIfNecessary(returnType, this.generator);
        const parameters = signature.getParameters();
        const resolvedParameterTypes = parameters.map((parameter) => {
          const parameterDeclaration = parameter.declarations[0];
          const unresolved = this.generator.checker.getTypeAtLocation(parameterDeclaration);
          const resolved = tryResolveGenericTypeIfNecessary(unresolved, this.generator);
          return resolved;
        });

        propertyTypename += "(";
        resolvedParameterTypes.forEach((type, index) => {
          propertyTypename += parameters[index].getName() + ": " + this.generator.checker.typeToString(type);
        });
        propertyTypename += ") => ";
        propertyTypename += this.generator.checker.typeToString(returnType);
      } else {
        propertyType = tryResolveGenericTypeIfNecessary(propertyType, this.generator);
        propertyTypename = this.generator.checker.typeToString(propertyType);
      }

      return property.name!.getText() + "__" + propertyTypename;
    })
      .filter(Boolean)
      .join(",");

    this.generator.symbolTable.addObjectName(objectPropertyTypesName);

    return object;
  }

  private handleArrayLiteralExpression(expression: ts.ArrayLiteralExpression, outerEnv?: Environment): llvm.Value {
    const arrayType = getArrayType(expression, this.generator);
    const elementType = getTypeGenericArguments(arrayType)[0];

    const constructorAndMemory = createArrayConstructor(expression, this.generator);
    const { constructor } = constructorAndMemory;
    let { allocated } = constructorAndMemory;

    this.generator.xbuilder.createSafeCall(constructor, [this.generator.xbuilder.asVoidStar(allocated)]);

    const push = createArrayPush(elementType, expression, this.generator);
    for (const element of expression.elements) {
      if (ts.isSpreadElement(element)) {
        const concat = createArrayConcat(expression, this.generator);
        let elementValue = this.generator.handleExpression(element.expression, outerEnv);

        if (elementValue instanceof HeapVariableDeclaration) {
          elementValue = elementValue.allocated;
        }

        const newmem = this.generator.gc.allocate(unwrapPointerType(allocated.type));

        this.generator.xbuilder.createSafeCall(concat, [
          newmem,
          this.generator.xbuilder.asVoidStar(allocated),
          this.generator.xbuilder.asVoidStar(elementValue),
        ]);
        allocated = newmem;
      } else {
        let elementValue = this.generator.handleExpression(element, outerEnv);

        const tsType = this.generator.checker.getTypeAtLocation(element);
        elementValue =
          checkIfObject(tsType) || checkIfFunction(tsType)
            ? this.generator.xbuilder.asVoidStar(elementValue)
            : this.generator.createLoadIfNecessary(elementValue);

        this.generator.xbuilder.createSafeCall(push, [this.generator.xbuilder.asVoidStar(allocated), elementValue]);
      }
    }

    return allocated;
  }
}

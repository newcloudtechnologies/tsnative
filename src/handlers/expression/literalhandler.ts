import {
  checkIfFunction,
  error,
  getAliasedSymbolIfNecessary,
  tryResolveGenericTypeIfNecessary,
  withObjectProperties,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { LLVMGenerator } from "@generator";

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
      this.generator.xbuilder.createSafeStore(llvm.ConstantInt.getTrue(this.generator.context), allocated);
    } else {
      this.generator.xbuilder.createSafeStore(llvm.ConstantInt.getFalse(this.generator.context), allocated);
    }
    return allocated;
  }

  private handleNumericLiteral(expression: ts.NumericLiteral): llvm.Value {
    const allocated = this.generator.gc.allocate(llvm.Type.getDoublePtrTy(this.generator.context));
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

          if (!propertyType.isIntersection()) {
            const declaration = propertyType.getSymbol()?.declarations[0];
            if (!declaration) {
              error(`No declaration found for '${property.expression.getText()}'`);
            }

            if (ts.isObjectLiteralExpression(declaration)) {
              for (let i = 0; i < declaration.properties.length; ++i) {
                if (!declaration.properties[i].name) {
                  error(`'${declaration.properties[i].getText()} has no name'`);
                }

                const value = this.generator.builder.createLoad(
                  this.generator.xbuilder.createSafeInBoundsGEP(propertyValue, [0, i])
                );

                const name = declaration.properties[i].name!.getText();
                value.name = name; // NB: It's impossible to use `value.name` as a key in map, since non-unique names randomized by this assignment
                llvmValues.set(name, value);
              }
            } else if (ts.isInterfaceDeclaration(declaration)) {
              for (let i = 0; i < declaration.members.length; ++i) {
                if (!declaration.members[i].name) {
                  error(`'${declaration.members[i].getText()} has no name'`);
                }

                const value = this.generator.builder.createLoad(
                  this.generator.xbuilder.createSafeInBoundsGEP(propertyValue, [0, i])
                );

                const name = declaration.members[i].name!.getText();
                value.name = name;

                llvmValues.set(name, value);
              }
            } else {
              error(`Unsupported spread initializer '${ts.SyntaxKind[declaration.kind]}'`);
            }
          } else {
            let counter = 0;

            function handleIntersectionSubtype(type: ts.Type, generator: LLVMGenerator) {
              type = tryResolveGenericTypeIfNecessary(type, generator);
              if (type.isIntersection()) {
                type.types.forEach((subtype) => handleIntersectionSubtype(subtype, generator));
                return;
              }
              const declaration = type.getSymbol()?.declarations[0];
              if (!declaration) {
                error(`No declaration found for '${generator.checker.typeToString(type)}'`);
              }
              if (!ts.isInterfaceDeclaration(declaration)) {
                error(
                  `Only interface types are supported in spread initialization by intersection type, got '${
                    ts.SyntaxKind[declaration.kind]
                  }'`
                );
              }

              for (const member of declaration.members) {
                if (!member.name) {
                  error(`'${member.getText()} has no name'`);
                }

                const value = generator.builder.createLoad(
                  generator.xbuilder.createSafeInBoundsGEP(propertyValue, [0, counter++])
                );

                const name = member.name.getText();
                value.name = name;
                llvmValues.set(name, value);
              }
            }

            propertyType.types.forEach((type) => handleIntersectionSubtype(type, this.generator));
          }

          break;
        default:
          error(`Unreachable ${ts.SyntaxKind[property.kind]}`);
      }
    });

    const types = Array.from(llvmValues.values()).map((value) => value.type);
    const objectType = llvm.StructType.get(this.generator.context, types);
    const object = this.generator.gc.allocate(objectType);

    Array.from(llvmValues.values()).forEach((value, index) => {
      const destinationPtr = this.generator.xbuilder.createSafeInBoundsGEP(object, [0, index]);
      this.generator.xbuilder.createSafeStore(value, destinationPtr);
    });

    // Reduce object's props names to string and store them as object's name.
    // Later this name may be used for out-of-order object initialization and property access.
    const randomPrefix = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "")
      .substr(0, 5);

    object.name = randomPrefix + "__object__" + Array.from(llvmValues.keys()).join(".");

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
}

import {
  checkIfFunction,
  getAliasedSymbolIfNecessary,
  tryResolveGenericTypeIfNecessary,
  withObjectProperties,
} from "@utils";
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
    // Reduce object's props names to string and store them as object's name.
    // Later this name may be used to proper object initialization (allows out-of-order initialization).
    object.name = withObjectProperties(expression, (property) => (property.name as ts.Identifier).getText()).join(".");

    const propertyNames: string[] = [];
    let propertyIndex = 0;
    withObjectProperties(expression, (property: ts.ObjectLiteralElementLike) => {
      const indexList = [
        llvm.ConstantInt.get(this.generator.context, 0),
        llvm.ConstantInt.get(this.generator.context, propertyIndex),
      ];
      const pointer = this.generator.builder.createInBoundsGEP(object, indexList, property.name!.getText());
      this.generator.xbuilder.createSafeStore(llvmValues[propertyIndex], pointer);

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

      propertyNames.push(property.name!.getText() + "__" + propertyTypename);
      ++propertyIndex;
    });

    const objectName = propertyNames.join(",");
    this.generator.symbolTable.addObjectName(objectName);

    return object;
  }
}

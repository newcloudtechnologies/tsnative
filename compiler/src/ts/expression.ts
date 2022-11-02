/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { LLVMGenerator } from "../generator";
import * as ts from "typescript";
import { TSType } from "./type";

export class Expression {
  private readonly expression: ts.Expression;
  private readonly generator: LLVMGenerator;

  private constructor(expression: ts.Expression, generator: LLVMGenerator) {
    this.expression = expression;
    this.generator = generator;
  }

  static create(expression: ts.Expression, generator: LLVMGenerator) {
    return new Expression(expression, generator);
  }

  getExpressionText(): string {
    // @todo: are there any other ts.Kinds we might be interested in?
    if (ts.isParenthesizedExpression(this.expression)) {
      return Expression.create(this.expression.expression, this.generator).getExpressionText();
    }
    if (ts.isAsExpression(this.expression)) {
      return Expression.create(this.expression.expression, this.generator).getExpressionText();
    }

    return this.expression.getText();
  }

  getAccessorType(): ts.SyntaxKind.GetAccessor | ts.SyntaxKind.SetAccessor | undefined {
    let result: ts.SyntaxKind.GetAccessor | ts.SyntaxKind.SetAccessor | undefined;

    const symbol = this.generator.ts.checker.getSymbolAtLocation(this.expression);
    if (symbol.declarations.length === 1) {
      if (symbol.declarations[0].isGetAccessor()) {
        result = ts.SyntaxKind.GetAccessor;
      } else if (symbol.declarations[0].isSetAccessor()) {
        result = ts.SyntaxKind.SetAccessor;
      }
    } else if (
      symbol.declarations.length > 1 &&
      symbol.declarations.some((declaration) => declaration.isGetAccessor() || declaration.isSetAccessor())
    ) {
      if (ts.isBinaryExpression(this.expression.parent)) {
        // @todo: what about property access chains?
        if (
          ts.isPropertyAccessExpression(this.expression.parent.left) ||
          ts.isPropertyAccessExpression(this.expression.parent.right)
        ) {
          result =
            this.expression.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
              ? ts.SyntaxKind.SetAccessor
              : ts.SyntaxKind.GetAccessor;
        } else if (ts.isPropertyAccessExpression(this.expression)) {
          result = ts.SyntaxKind.GetAccessor;
        }
      } else {
        result = ts.SyntaxKind.GetAccessor;
      }
    }

    return result;
  }

  getArgumentTypes(): TSType[] {
    if (!ts.isCallExpression(this.expression)) {
      throw new Error(
        `'getArgumentTypes' expected to be called on ts.CallExpression wrapper, called on '${this.expression.getText()}'`
      );
    }

    const args = this.expression.arguments;

    const type = this.generator.ts.checker.getTypeAtLocation(this.expression.expression);
    if (type.isSymbolless()) {
      throw new Error(`No symbol for called function '${this.expression.getText()}'`);
    }

    const argumentTypes: TSType[] = [];

    const handleArg = (arg: ts.Node) => {
      if (this.generator.ts.checker.nodeHasSymbolAndDeclaration(arg)) {
        const symbol = this.generator.ts.checker.getSymbolAtLocation(arg);
        const declaration = symbol.valueDeclaration || symbol.declarations[0];
        let type = declaration.type;

        if (declaration.isEnumMember() || (declaration.isParameter() && type.isEnum())) {
          type = type.getEnumElementTSType();
        }

        argumentTypes.push(type);
        return;
      }

      let argType = this.generator.ts.checker.getTypeAtLocation(arg);

      if (ts.isSpreadElement(arg)) {
        argType = this.generator.ts.checker.getTypeAtLocation(arg.expression);
      }

      if (argType.isTypeParameter()) {
        const typenameAlias = argType.toString();
        argType = this.generator.symbolTable.currentScope.typeMapper.get(typenameAlias);
      }

      argumentTypes.push(argType);
    };

    const symbol = type.getSymbol();
    const declaration = symbol.valueDeclaration || symbol.declarations[0];

    declaration.parameters.forEach((p, index) => {
      if (p.questionToken) {
        argumentTypes.push(this.generator.ts.union.getDeclaration().type);
        return;
      }

      if (p.dotDotDotToken) {
        const restArgs = args.slice(index);
        restArgs.forEach(handleArg);
        return;
      }

      const arg = args[index];

      if (arg) {
        handleArg(arg);
      }
    });

    return argumentTypes;
  }

  isMethod() {
    const isPropertyAccess = ts.isPropertyAccessExpression(this.expression);
    if (!isPropertyAccess) {
      return false;
    }

    const type = this.generator.ts.checker.getTypeAtLocation(this.expression);
    if (type.isSymbolless()) {
      return false;
    }

    const symbol = type.getSymbol();

    return (symbol.flags & ts.SymbolFlags.Method) !== 0 && !symbol.valueDeclaration!.isStatic();
  }
}

/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { checkIfProperty, error, isSyntheticNode } from "@utils";
import * as ts from "typescript";
import { StringLiteralHelper, AbstractPreprocessor } from "@preprocessing";
import { Type } from "../ts/type";

export class TSObjectConsoleLogPreprocessor extends AbstractPreprocessor {
  transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        if (!isSyntheticNode(node) && node.getText(sourceFile).startsWith("console.log(")) {
          let call: ts.CallExpression;
          if (ts.isExpressionStatement(node)) {
            call = node.expression as ts.CallExpression;
          } else if (ts.isCallExpression(node)) {
            call = node;
          } else if (ts.isSourceFile(node)) {
            call = (node.statements[0] as ts.ExpressionStatement).expression as ts.CallExpression;
          } else {
            error(`Expected 'console.log' call to be of 'ts.CallExpression' kind, got ${ts.SyntaxKind[node.kind]}`);
          }

          const argumentTypes = call.arguments.map((arg) => this.generator.ts.checker.getTypeAtLocation(arg));
          if (argumentTypes.some((type) => type.isTSObjectType())) {
            const logArguments = argumentTypes.reduce((args, type, index) => {
              const callArgument = call.arguments[index];

              if (!type.isTSObjectType()) {
                args.push(callArgument);
                return args;
              }

              args.push(this.objectToString(type, callArgument));
              return args;
            }, new Array<ts.Expression>());

            call = ts.updateCall(call, call.expression, undefined, logArguments);
            ts.addSyntheticLeadingComment(
              call,
              ts.SyntaxKind.SingleLineCommentTrivia,
              "@ts-ignore (Ignore possible access to protected/private fields)"
            );
            node = call;
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };

  private getNestedLevel(property?: string) {
    return property ? property.split(".").length + 1 : 1;
  }

  private isOneliner(type: Type, node: ts.Node): boolean {
    const props = type.getProperties().filter(checkIfProperty);
    if (props.length === 0) {
      return true;
    }

    const firstFieldType = this.generator.ts.checker.getTypeOfSymbolAtLocation(props[0], node);

    return props.length <= 2 && !firstFieldType.isTSObjectType();
  }

  private getPropertyName(property: string, parent?: string) {
    return parent ? parent + "." + property : property;
  }

  private getSpaceCount(isOneliner: boolean, level: number) {
    return !isOneliner ? level * 2 : 0;
  }

  private objectToString(
    type: Type,
    callArgument: ts.Expression,
    nestedProperty?: string
  ): ts.TemplateExpression | ts.StringLiteral {
    const objectSpans: ts.TemplateSpan[] = [];

    const properties = type.getProperties().filter(checkIfProperty);

    const isOneliner = this.isOneliner(type, callArgument);
    const isEmpty = properties.length === 0;

    let classPrelude = StringLiteralHelper.openCurlyBracket;
    classPrelude += isEmpty
      ? StringLiteralHelper.empty
      : isOneliner
      ? StringLiteralHelper.space
      : StringLiteralHelper.newLine;

    const buildMiddleLiteral = (propertyType: Type, nextProperty: ts.Symbol) => {
      const nextPropertyName = nextProperty.escapedName.toString();
      let nextPropertyDescriptor = StringLiteralHelper.createPropertyStringLiteral(
        nextPropertyName,
        this.getSpaceCount(isOneliner, nestedLevel)
      );

      const nextPropertyType = this.generator.ts.checker.getTypeOfSymbolAtLocation(nextProperty, callArgument);
      if (nextPropertyType.isString()) {
        nextPropertyDescriptor += "'";
      }

      const possibleQuote = propertyType.isString() ? "'" : "";
      const fieldSeparator = isOneliner ? StringLiteralHelper.space : StringLiteralHelper.newLine;
      const literal = `${possibleQuote},${fieldSeparator}${nextPropertyDescriptor}`;
      return literal;
    };
    const buildEpilogue = (propertyType: Type, expression?: ts.Expression) => {
      const possibleQuote = propertyType.isString() ? "'" : "";
      const newLineOrSpace = isEmpty
        ? StringLiteralHelper.empty
        : isOneliner
        ? StringLiteralHelper.space
        : StringLiteralHelper.newLine;
      const closingBracket = StringLiteralHelper.getCloseCurlyBracket(this.getSpaceCount(isOneliner, nestedLevel - 1));
      const classEpilogue = `${possibleQuote}${newLineOrSpace}${closingBracket}`;
      if (expression) {
        const classEpilogueTemplate = ts.createTemplateTail(classEpilogue);
        const span = ts.createTemplateSpan(expression, classEpilogueTemplate);
        objectSpans.push(span);
      } else {
        classPrelude += classEpilogue;
      }
    };

    if (!type.isSymbolless()) {
      const typename = type.getSymbol().escapedName.toString();
      if (typename !== ts.InternalSymbolName.Object && typename !== ts.InternalSymbolName.Type) {
        classPrelude = typename + " " + classPrelude;
      }
    }

    const nestedLevel = this.getNestedLevel(nestedProperty);

    for (let i = 0; i < properties.length; ++i) {
      const property = properties[i];
      const propertyType = this.generator.ts.checker.getTypeOfSymbolAtLocation(property, callArgument);

      const propertyName = property.escapedName.toString();

      if (i === 0) {
        let propertyDescriptor = StringLiteralHelper.createPropertyStringLiteral(
          propertyName,
          this.getSpaceCount(isOneliner, nestedLevel)
        );
        if (propertyType.isString()) {
          propertyDescriptor += "'";
        }

        classPrelude += propertyDescriptor;
      }

      const propertyAccessString = this.getPropertyName(propertyName, nestedProperty);
      const propertyAccess = ts.createPropertyAccess(callArgument, propertyAccessString);
      const nextProperty = i !== properties.length - 1 ? properties[i + 1] : undefined;

      if (propertyType.isTSObjectType()) {
        const nestedObjectTemplateExpression = this.objectToString(propertyType, callArgument, propertyAccessString);
        if (!nextProperty) {
          buildEpilogue(propertyType, nestedObjectTemplateExpression);
        } else {
          const spanLiteral = buildMiddleLiteral(propertyType, nextProperty);
          const nestedObjectSpan = ts.createTemplateSpan(
            nestedObjectTemplateExpression,
            ts.createTemplateMiddle(spanLiteral)
          );
          objectSpans.push(nestedObjectSpan);
        }

        continue;
      }

      // @todo: remove function-related stuff once .toString() implemented
      const spanExpression = propertyType.isFunction() ? ts.createStringLiteral(`[Function]`) : propertyAccess;
      ts.addSyntheticLeadingComment(
        spanExpression,
        ts.SyntaxKind.SingleLineCommentTrivia,
        "@ts-ignore (Ignore possible access to protected/private fields)"
      );
      if (nextProperty) {
        const spanLiteral = buildMiddleLiteral(propertyType, nextProperty);
        const span = ts.createTemplateSpan(spanExpression, ts.createTemplateMiddle(spanLiteral));
        objectSpans.push(span);
      } else {
        buildEpilogue(propertyType, spanExpression);
      }
    }

    if (!properties.length) {
      const closingBracket = StringLiteralHelper.getCloseCurlyBracket(this.getSpaceCount(isOneliner, nestedLevel - 1));
      const classEpilogue = `${closingBracket}`;
      classPrelude += classEpilogue;
      return ts.createStringLiteral(classPrelude);
    }

    const classPreludeHead = ts.createTemplateHead(classPrelude);
    return ts.createTemplateExpression(classPreludeHead, objectSpans);
  }
}

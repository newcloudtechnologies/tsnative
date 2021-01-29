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

import { checkIfFunction, error, isTSObjectType } from "@utils";
import { flatten } from "lodash";
import * as ts from "typescript";
import { StringLiteralHelper, AbstractPreprocessor } from "@preprocessing";

export class TSObjectConsoleLogPreprocessor extends AbstractPreprocessor {
  handle(node: ts.Node, sourceFile: ts.SourceFile): ts.Node {
    if (node.getText(sourceFile).startsWith("console.log(")) {
      let call: ts.CallExpression;
      if (ts.isExpressionStatement(node)) {
        call = node.expression as ts.CallExpression;
      } else if (ts.isCallExpression(node)) {
        call = node;
      } else {
        if (ts.isSourceFile(node)) {
          // @todo: have no idea why first statement node is classified as ts.SourceFile
          error(`'console.log' cannot be first statement; file '${node.fileName}'`);
        }

        error(`Expected 'console.log' call to be of 'ts.CallExpression' kind, got ${ts.SyntaxKind[node.kind]}`);
      }

      const argumentTypes = call.arguments.map(this.generator.checker.getTypeAtLocation);
      if (argumentTypes.some((type) => isTSObjectType(type, this.generator.checker))) {
        const logArguments: ts.Expression[] = argumentTypes.reduce((args, type, index) => {
          const callArgument = call.arguments[index];

          if (!isTSObjectType(type, this.generator.checker)) {
            args.push(callArgument);
            return args;
          }

          return this.handleTSObject(type, callArgument);
        }, new Array<ts.Expression>());

        call = ts.updateCall(call, call.expression, undefined, logArguments);
        return call;
      }
    }

    if (this.next) {
      return this.next.handle(node, sourceFile);
    }

    return node;
  }

  private handleTSObject(type: ts.Type, callArgument: ts.Expression, nestedProperty?: string) {
    const nestedLevel = nestedProperty ? nestedProperty.split(".").length + 1 : 1;

    const props = this.generator.checker.getPropertiesOfType(type);

    const objectLog: ts.Expression[] = flatten(
      props.map((prop) => {
        const propType = this.generator.checker.getTypeOfSymbolAtLocation(prop, callArgument);
        let propName = prop.escapedName.toString();
        const propertyStringLiteral = StringLiteralHelper.createPropertyStringLiteral(propName, nestedLevel);

        propName = nestedProperty ? nestedProperty + "." + propName : propName;

        if (isTSObjectType(propType, this.generator.checker)) {
          return [
            propertyStringLiteral,
            ...this.handleTSObject(propType, callArgument, propName),
            StringLiteralHelper.createNewLine(),
          ];
        }

        if (checkIfFunction(propType)) {
          return [
            propertyStringLiteral,
            StringLiteralHelper.createStringLiteral("[Function]"),
            StringLiteralHelper.createNewLine(),
          ];
        }

        const propertyAccess = ts.createPropertyAccess(callArgument, propName);
        return [propertyStringLiteral, propertyAccess, StringLiteralHelper.createNewLine()];
      })
    );

    const classPrelude = [StringLiteralHelper.getOpenCurlyBracket(), StringLiteralHelper.createNewLine()];
    const typename = type.symbol?.escapedName.toString();
    if (typename && typename !== ts.InternalSymbolName.Object) {
      classPrelude.unshift(StringLiteralHelper.createStringLiteral(typename));
    }

    objectLog.unshift(...classPrelude);
    objectLog.push(StringLiteralHelper.getCloseCurlyBracket(nestedLevel - 1));

    return [...objectLog];
  }
}

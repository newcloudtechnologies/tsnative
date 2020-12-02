/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { checkIfFunction, error, getRandomString, isTSObjectType } from "@utils";
import { flatten, first } from "lodash";
import * as path from "path";
import * as fs from "fs";
import * as ts from "typescript";
import { StringLiteralHelper } from "@preprocessing";

export class TSObjectConsoleLogPass {
  private readonly generatedProgram: ts.Program;
  private readonly checker: ts.TypeChecker;

  constructor(files: string[], options: ts.CompilerOptions, host: ts.CompilerHost) {
    const program = ts.createProgram(files, options, host);
    this.checker = program.getTypeChecker();

    const outputDir = path.join(process.cwd(), path.sep, getRandomString() + "_generated");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const generatedSources = program.getSourceFiles().map((file) => {
      let filePath = file.fileName;
      if (!path.isAbsolute(filePath)) {
        filePath = path.resolve(process.cwd(), filePath);
      }

      const outFile = path.join(outputDir, filePath);
      const outDir = path.dirname(outFile);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      let resultFile;
      if (file.isDeclarationFile) {
        resultFile = file;
      } else {
        const result = ts.transform(file, [this.transformer]);
        resultFile = first(result.transformed)!;
      }

      fs.writeFileSync(outFile, ts.createPrinter().printFile(resultFile));
      return outFile;
    });

    const generatedSourcesWithoutDeclarations = generatedSources.filter((file) => !file.endsWith(".d.ts"));
    this.generatedProgram = ts.createProgram(generatedSourcesWithoutDeclarations, options, host);

    generatedSources.forEach(fs.unlinkSync);
    fs.rmdirSync(outputDir, { recursive: true });
  }

  private readonly transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile: ts.SourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
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

          const argumentTypes = call.arguments.map(this.checker.getTypeAtLocation);
          if (argumentTypes.some((type) => isTSObjectType(type, this.checker))) {
            const logArguments: ts.Expression[] = argumentTypes.reduce((args, type, index) => {
              const callArgument = call.arguments[index];

              if (!isTSObjectType(type, this.checker)) {
                args.push(callArgument);
                return args;
              }

              return this.handleTSObject(type, callArgument);
            }, new Array<ts.Expression>());

            call = ts.updateCall(call, call.expression, undefined, logArguments);
            return call;
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };

  private handleTSObject(type: ts.Type, callArgument: ts.Expression, nestedProperty?: string) {
    const nestedLevel = nestedProperty ? nestedProperty.split(".").length + 1 : 1;

    const props = this.checker.getPropertiesOfType(type);
    const objectLog: ts.Expression[] = flatten(
      props.map((prop) => {
        const propType = this.checker.getTypeOfSymbolAtLocation(prop, callArgument);
        let propName = prop.escapedName.toString();
        const propertyStringLiteral = StringLiteralHelper.createPropertyStringLiteral(propName, nestedLevel);

        propName = nestedProperty ? nestedProperty + "." + propName : propName;

        if (isTSObjectType(propType, this.checker)) {
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

  get program() {
    return this.generatedProgram;
  }
}

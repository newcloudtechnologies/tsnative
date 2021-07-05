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

import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import { first } from "lodash";
import {
  AbstractPreprocessor,
  ConstructorGeneratingPreprocessor,
  FunctionDeclarationPreprocessor,
  ParametersRandomizingPreprocessor,
  RestParametersPreprocessor,
  TSObjectConsoleLogPreprocessor,
  DefaultPropertiesPreprocessor,
} from "@preprocessing";
import { LLVMGenerator } from "@generator";

export class Preprocessor {
  private readonly generatedProgram: ts.Program;
  private readonly parts: AbstractPreprocessor[] = [];
  private readonly cleanupFunction: () => void;

  constructor(files: string[], options: ts.CompilerOptions, host: ts.CompilerHost) {
    const program = ts.createProgram(files, options, host);

    const generator = new LLVMGenerator(program);
    this.parts.push(
      new TSObjectConsoleLogPreprocessor(generator),
      new ParametersRandomizingPreprocessor(generator),
      new FunctionDeclarationPreprocessor(generator),
      new ConstructorGeneratingPreprocessor(generator),
      new DefaultPropertiesPreprocessor(generator),
      new RestParametersPreprocessor(generator)
    );

    const outputDir = path.join(process.cwd(), path.sep, generator.randomString + "_generated");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const transformer = (context: ts.TransformationContext) => {
      return (sourceFile: ts.SourceFile) => {
        return this.parts.reduce((source, processor) => {
          return processor.transformer(context)(source);
        }, sourceFile);
      };
    };

    const generatedSources = program.getSourceFiles().map((file) => {
      let filePath = file.fileName;
      if (!path.isAbsolute(filePath)) {
        // @todo: revise this "implementation"
        if (filePath.startsWith("C:/")) {
          filePath = filePath.split("C:/")[1];
        } else if (filePath.startsWith("C:\\")) {
          filePath = filePath.split("C:\\")[1];
        }
        filePath = path.resolve(process.cwd(), filePath);
      }
      // @todo: revise this "implementation"
      if (filePath.startsWith("C:/")) {
        filePath = filePath.split("C:/")[1];
      } else if (filePath.startsWith("C:\\")) {
        filePath = filePath.split("C:\\")[1];
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
        const result = ts.transform(file, [transformer]);
        resultFile = first(result.transformed)!;
      }

      fs.writeFileSync(outFile, ts.createPrinter().printFile(resultFile));
      return outFile;
    });

    const generatedSourcesWithoutDeclarations = generatedSources.filter((file) => !file.endsWith(".d.ts"));

    options.baseUrl = path.join(outputDir, options.baseUrl!);
    this.generatedProgram = ts.createProgram(generatedSourcesWithoutDeclarations, options, host);

    this.cleanupFunction = () => {
      generatedSources.forEach(fs.unlinkSync);
      fs.rmdirSync(outputDir, { recursive: true });
    };
  }

  get program() {
    return this.generatedProgram;
  }

  cleanup() {
    this.cleanupFunction();
  }
}

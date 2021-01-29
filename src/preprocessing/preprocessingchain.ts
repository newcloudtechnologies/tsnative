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
import {
  AbstractPreprocessor,
  TSObjectConsoleLogPreprocessor,
  ParametersRandomizingPreprocessor,
  ConstructorGeneratingPreprocessor,
} from "@preprocessing";

export class PreprocessingChain {
  private readonly root: AbstractPreprocessor;

  constructor(checker: ts.TypeChecker) {
    const tsObjectConsoleLog = new TSObjectConsoleLogPreprocessor(checker);
    const parametersRandomizer = new ParametersRandomizingPreprocessor(checker);
    const defaultConstructorGenerator = new ConstructorGeneratingPreprocessor(checker);

    tsObjectConsoleLog.setNext(parametersRandomizer);
    parametersRandomizer.setNext(defaultConstructorGenerator);

    this.root = tsObjectConsoleLog;
  }

  handle(node: ts.Node, sourceFile: ts.SourceFile, context: ts.TransformationContext): ts.Node {
    const result = this.root.handle(node, sourceFile);
    if (result !== node) {
      return result;
    }

    return ts.visitEachChild(node, (n: ts.Node) => this.handle(n, sourceFile, context), context);
  }
}

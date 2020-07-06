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

import { adjustValue, isCppNumericType } from "@cpp";
import { Scope, HeapVariableDeclaration, Environment } from "@scope";
import {
  isConst,
  checkIfUnion,
  initializeUnion,
  tryResolveGenericTypeIfNecessary,
  InternalNames,
  getUnionStructType,
} from "@utils";
import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import * as llvm from "llvm-node";

type VariableLike = ts.VariableStatement | ts.VariableDeclarationList;
export class VariableHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.VariableDeclarationList:
        this.handleVariables(node as VariableLike, parentScope, env);
        return true;
      case ts.SyntaxKind.VariableDeclaration:
        this.handleVariableDeclaration(node as ts.VariableDeclaration, parentScope, env);
        return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private handleVariableDeclaration(declaration: ts.VariableDeclaration, parentScope: Scope, env?: Environment): void {
    const name = declaration.name.getText();
    let initializer = this.generator.handleExpression(declaration.initializer!, env);
    if (initializer.name.startsWith(InternalNames.Closure)) {
      parentScope.set(name, initializer);
      return;
    }

    let type = this.generator.checker.getTypeAtLocation(declaration);
    type = tryResolveGenericTypeIfNecessary(type, this.generator);
    const typename = this.generator.checker.typeToString(type);
    if (isCppNumericType(typename)) {
      initializer = adjustValue(initializer, typename, this.generator);
    }

    if (isConst(declaration)) {
      if (!(initializer instanceof llvm.Argument)) {
        initializer.name = name;
      }
      parentScope.set(name, initializer);
    } else {
      if (checkIfUnion(type)) {
        const llvmUnionType = getUnionStructType(type as ts.UnionType, declaration, this.generator);
        initializer = initializeUnion(llvmUnionType, initializer, this.generator);
      }

      const alloca = this.generator.gc.allocate(initializer.type);
      this.generator.builder.createStore(initializer, alloca);

      parentScope.set(name, new HeapVariableDeclaration(alloca, initializer));
    }
  }

  private handleVariables(statement: VariableLike, parentScope: Scope, env?: Environment): void {
    const declarations = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations
      : statement.declarations;
    declarations.forEach((declaration) => {
      this.handleVariableDeclaration(declaration, parentScope, env);
    });
  }
}

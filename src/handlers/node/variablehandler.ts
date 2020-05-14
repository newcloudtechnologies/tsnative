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
import { Scope } from "@scope";
import { getLLVMType, isConst, isValueTy } from "@utils";
import { Argument } from "llvm-node";
import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";

type VariableLike = ts.VariableStatement | ts.VariableDeclarationList;
export class VariableHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.VariableDeclarationList:
        this.handleVariables(node as VariableLike, parentScope);
        return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope);
    }

    return false;
  }

  private handleVariables(statement: VariableLike, parentScope: Scope): void {
    const declarations = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations
      : statement.declarations;
    declarations.forEach((declaration) => {
      const name = declaration.name.getText();
      let initializer = this.generator.handleExpression(declaration.initializer!);

      const type = this.generator.checker.getTypeAtLocation(declaration);
      const typename = this.generator.checker.typeToString(type);
      if (isCppNumericType(typename)) {
        initializer = adjustValue(initializer, typename, this.generator);
      }

      if (isConst(declaration)) {
        if (!(initializer instanceof Argument)) {
          initializer.name = name;
        }
        parentScope.set(name, initializer);
      } else {
        const alloca = this.generator.withLocalBuilder(() => {
          const llvmType = getLLVMType(type, declaration, this.generator);
          return this.generator.builder.createAlloca(
            isValueTy(llvmType) ? llvmType : llvmType.getPointerTo(),
            undefined,
            name
          );
        });
        this.generator.builder.createStore(initializer, alloca);
        parentScope.set(name, alloca);
      }
    });
  }
}

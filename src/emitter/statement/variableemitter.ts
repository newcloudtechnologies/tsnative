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

import { adjustValue, isNumericType } from "@cpp";
import { LLVMGenerator } from "@generator";
import { Scope } from "@scope";
import { createEntryBlockAlloca, getLLVMType, isVarConst } from "@utils";
import { Argument } from "llvm-node";
import { VariableDeclarationList, VariableStatement } from "typescript";

export class VariableEmitter {
  emitVariableStatement(statement: VariableStatement, parentScope: Scope, generator: LLVMGenerator): void {
    for (const declaration of statement.declarationList.declarations) {
      // TODO: Handle destructuring declarations.
      const name = declaration.name.getText();
      let initializer = generator.emitExpression(declaration.initializer!);

      const type = generator.checker.getTypeAtLocation(declaration);
      const typename = generator.checker.typeToString(type);
      if (isNumericType(typename)) {
        initializer = adjustValue(initializer, typename, generator);
      }

      if (isVarConst(declaration)) {
        if (!(initializer instanceof Argument)) {
          initializer.name = name;
        }
        parentScope.set(name, initializer);
      } else {
        const alloca = createEntryBlockAlloca(getLLVMType(type, declaration, generator), name, generator);
        generator.builder.createStore(initializer, alloca);
        parentScope.set(name, alloca);
      }
    }
  }

  emitVariableDeclarationList(statement: VariableDeclarationList, parentScope: Scope, generator: LLVMGenerator): void {
    for (const declaration of statement.declarations) {
      // TODO: Handle destructuring declarations.
      const name = declaration.name.getText();
      let initializer = generator.emitExpression(declaration.initializer!);

      const type = generator.checker.getTypeAtLocation(declaration);
      const typename = generator.checker.typeToString(type);
      if (isNumericType(typename)) {
        initializer = adjustValue(initializer, typename, generator);
      }

      if (isVarConst(declaration)) {
        if (!(initializer instanceof Argument)) {
          initializer.name = name;
        }
        parentScope.set(name, initializer);
      } else {
        const alloca = createEntryBlockAlloca(getLLVMType(type, declaration, generator), name, generator);
        generator.builder.createStore(initializer, alloca);
        parentScope.set(name, alloca);
      }
    }
  }
}

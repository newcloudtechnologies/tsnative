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

import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "@scope";
import { getLLVMType, getAliasedSymbolIfNecessary, error } from "@utils";
import * as llvm from "llvm-node";

export class TypeAliasHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.TypeAliasDeclaration:
        const typeAlias = node as ts.TypeAliasDeclaration;
        const name = typeAlias.name.escapedText as string;
        const type = this.generator.checker.getTypeFromTypeNode(typeAlias.type);

        const symbol = getAliasedSymbolIfNecessary(type.getSymbol()!, this.generator.checker);
        const declaration = symbol.valueDeclaration as ts.ClassDeclaration | ts.InterfaceDeclaration;

        let llvmType: llvm.StructType;

        if (ts.isFunctionTypeNode(typeAlias.type)) {
          const tsReturnType = this.generator.checker.getTypeAtLocation(typeAlias.type.type);
          const llvmReturnType = getLLVMType(tsReturnType, node, this.generator);
          const llvmParameters = typeAlias.type.parameters.map((parameter) => {
            if (!parameter.type) {
              error(`Parameter with no type met: '${parameter.getText()}'`);
            }
            const tsType = this.generator.checker.getTypeFromTypeNode(parameter.type);
            return getLLVMType(tsType, node, this.generator);
          });

          llvmType = (llvm.FunctionType.get(llvmReturnType, llvmParameters, false) as llvm.Type) as llvm.StructType;
        } else {
          llvmType = getLLVMType(type, node, this.generator) as llvm.StructType;
        }

        const scope: Scope = new Scope(name, undefined, {
          declaration,
          type: llvmType,
        });

        parentScope.set(name, scope);
        return true;
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }
}

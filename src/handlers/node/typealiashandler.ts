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
import { getLLVMType, getAliasedSymbolIfNecessary } from "@utils";
import * as llvm from "llvm-node";

export class TypeAliasHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.TypeAliasDeclaration:
        const typeAlias = node as ts.TypeAliasDeclaration;
        const name = typeAlias.name.escapedText as string;
        const type = this.generator.checker.getTypeFromTypeNode(typeAlias.type);

        if (ts.isFunctionTypeNode(typeAlias.type)) {
          return true;
        }

        let declaration;
        const typeSymbol = type.getSymbol();
        if (typeSymbol) {
          const symbol = getAliasedSymbolIfNecessary(type.getSymbol()!, this.generator.checker);
          declaration = symbol.valueDeclaration as ts.ClassDeclaration | ts.InterfaceDeclaration;
        }

        const llvmType = getLLVMType(type, node, this.generator) as llvm.StructType;
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

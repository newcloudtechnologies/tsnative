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
import { getLLVMReturnType } from "@handlers";
import { LLVMGenerator } from "@generator";

const utilityReturnType = "ReturnType";
const utilityTypeNames = [utilityReturnType];

function adjustDeducedReturnType(typeReference: ts.TypeReferenceNode, generator: LLVMGenerator) {
  // Handling something like `type DocStoreType = ReturnType<typeof createInitialStore>` where `createInitialStore` (e.g.) is a function that returns a closure
  let llvmType: llvm.Type | undefined;
  const typeArgument = typeReference.typeArguments![0];
  // typeof <name>
  if (ts.isTypeQueryNode(typeArgument)) {
    const initializerName = typeArgument.exprName.getText();

    // Find declaration by `initializerName` in current file.
    generator.currentSourceFile.forEachChild((node) => {
      // @todo: Is there any other node kind we are interested in?
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (declaration.name.getText() === initializerName) {
            if (declaration.initializer) {
              if (ts.isFunctionLike(declaration.initializer)) {
                const symbol = generator.checker.getTypeAtLocation(declaration.initializer).symbol;
                const valueDeclaration = getAliasedSymbolIfNecessary(symbol, generator.checker)
                  .declarations[0] as ts.FunctionLikeDeclaration;
                const signature = generator.checker.getSignatureFromDeclaration(valueDeclaration)!;
                const tsReturnType = generator.checker.getReturnTypeOfSignature(signature);

                if (!declaration.initializer) {
                  error("Declaration initializer required");
                }

                llvmType = getLLVMReturnType(tsReturnType, declaration.initializer, generator);
              } else if (ts.isCallExpression(declaration.initializer)) {
                const type = generator.checker.getTypeAtLocation(declaration.initializer);
                llvmType = getLLVMType(type, declaration.initializer, generator);
              }
            }
          }
        });
      }
    });
  }
  return llvmType;
}

export class TypeAliasHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.TypeAliasDeclaration:
        const typeAlias = node as ts.TypeAliasDeclaration;
        const name = typeAlias.name.escapedText as string;

        if (utilityTypeNames.indexOf(name) > -1) {
          // Utility types are handling by tsc itself.
          return true;
        }

        const type = this.generator.checker.getTypeFromTypeNode(typeAlias.type);
        if (ts.isFunctionTypeNode(typeAlias.type)) {
          // Function types are handling by tsc itself.
          return true;
        }

        let declaration: ts.ClassDeclaration | ts.InterfaceDeclaration | undefined;
        const typeSymbol = type.getSymbol();
        if (typeSymbol) {
          const symbol = getAliasedSymbolIfNecessary(type.getSymbol()!, this.generator.checker);
          declaration = symbol.declarations[0] as ts.ClassDeclaration | ts.InterfaceDeclaration;
        }

        let llvmType: llvm.Type | undefined;
        const typeReference = typeAlias.type as ts.TypeReferenceNode;
        const typeReferenceName = typeReference.typeName;
        if (typeReferenceName?.getText() === utilityReturnType) {
          // Modify ReturnType's behavior since ts.Type may not match actual llvm.Type (e.g. in case of closures)
          llvmType = adjustDeducedReturnType(typeReference, this.generator);
        }
        if (!llvmType) {
          llvmType = getLLVMType(type, node, this.generator);
        }

        const tsType = this.generator.checker.getTypeAtLocation(declaration as ts.Node);

        const scope: Scope = new Scope(name, name, parentScope, {
          declaration,
          llvmType: llvmType.isPointerTy() ? llvmType : llvmType.getPointerTo(),
          tsType,
        });

        // @todo: this logic is required because of builtins
        if (parentScope.get(name)) {
          parentScope.overwrite(name, scope);
        } else {
          parentScope.set(name, scope);
        }

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

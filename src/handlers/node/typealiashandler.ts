/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";
import { LLVMGenerator } from "../../generator";
import { LLVMType } from "../../llvm/type";
import { Declaration } from "../../ts/declaration";

const utilityReturnType = "ReturnType";
const utilityTypeNames = [utilityReturnType];

function adjustDeducedReturnType(typeReference: ts.TypeReferenceNode, generator: LLVMGenerator) {
  // Handling something like `type DocStoreType = ReturnType<typeof createInitialStore>` where `createInitialStore` (e.g.) is a function that returns a closure
  let llvmType: LLVMType | undefined;
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
                const symbol = generator.ts.checker.getTypeAtLocation(declaration.initializer).getSymbol();
                const valueDeclaration = symbol.declarations[0];
                const signature = generator.ts.checker.getSignatureFromDeclaration(valueDeclaration);
                const tsReturnType = signature.getReturnType();

                if (!declaration.initializer) {
                  throw new Error("Declaration initializer required");
                }

                llvmType = tsReturnType.getLLVMReturnType();
              } else if (ts.isCallExpression(declaration.initializer)) {
                const type = generator.ts.checker.getTypeAtLocation(declaration.initializer);
                llvmType = type.getLLVMType();
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

        if (ts.isFunctionTypeNode(typeAlias.type)) {
          // Function types are handling by tsc itself.
          return true;
        }

        let declaration: Declaration | undefined;

        const type = this.generator.ts.checker.getTypeFromTypeNode(typeAlias.type);

        if (!type.isSymbolless()) {
          const symbol = type.getSymbol();
          declaration = symbol.declarations[0];
        }

        let llvmType: LLVMType | undefined;
        const typeReference = typeAlias.type as ts.TypeReferenceNode;
        const typeReferenceName = typeReference.typeName;
        if (typeReferenceName?.getText() === utilityReturnType) {
          // Modify ReturnType's behavior since ts.Type may not match actual LLVMType (e.g. in case of closures)
          llvmType = adjustDeducedReturnType(typeReference, this.generator);
        }
        if (!llvmType) {
          llvmType = type.getLLVMType();
        }

        const scope: Scope = new Scope(name, name, parentScope, {
          declaration,
          llvmType: llvmType.ensurePointer(),
          tsType: type,
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

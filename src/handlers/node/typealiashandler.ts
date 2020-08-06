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
import { Scope, Environment, createEnvironment } from "@scope";
import { getLLVMType, getAliasedSymbolIfNecessary, tryResolveGenericTypeIfNecessary } from "@utils";
import * as llvm from "llvm-node";
import { getLLVMReturnType } from "@handlers";
import { getFunctionEnvironmentVariables } from "@handlers/utils";
import { LLVMGenerator } from "@generator";

const utilityReturnType = "ReturnType";
const utilityTypeNames = [utilityReturnType];

function adjustDeducedReturnType(typeReference: ts.TypeReferenceNode, generator: LLVMGenerator) {
  // Handling something like `type DocStoreType = ReturnType<typeof createInitialStore>` where `createInitialStore` (e.g.) is a function that returns a closure
  let llvmType;
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
            if (declaration.initializer && ts.isFunctionLike(declaration.initializer)) {
              const symbol = generator.checker.getTypeAtLocation(declaration.initializer).symbol;
              const valueDeclaration = getAliasedSymbolIfNecessary(symbol, generator.checker)
                .declarations[0] as ts.FunctionLikeDeclaration;
              const signature = generator.checker.getSignatureFromDeclaration(valueDeclaration)!;
              let tsReturnType = generator.checker.getReturnTypeOfSignature(signature);
              tsReturnType = tryResolveGenericTypeIfNecessary(tsReturnType, generator);

              const tsArgumentTypes = declaration.initializer!.parameters.map(generator.checker.getTypeAtLocation);
              const llvmArgumentTypes = tsArgumentTypes.map((arg) =>
                getLLVMType(arg, declaration.initializer!, generator)
              );
              const dummyArguments = llvmArgumentTypes.map((type) =>
                llvm.Constant.getNullValue(type.isPointerTy() ? type : type.getPointerTo())
              );
              const environmentVariables = getFunctionEnvironmentVariables(
                (declaration.initializer! as ts.FunctionLikeDeclaration).body!,
                signature,
                generator
              );
              const env = createEnvironment(generator.symbolTable.currentScope, environmentVariables, generator, {
                args: dummyArguments,
                signature,
              });

              llvmType = getLLVMReturnType(
                tsReturnType,
                declaration.initializer,
                (declaration.initializer as ts.FunctionDeclaration).body!,
                generator,
                env
              );
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

        let llvmType;
        const typeReference = typeAlias.type as ts.TypeReferenceNode;
        const typeReferenceName = typeReference.typeName;
        if (typeReferenceName?.getText() === utilityReturnType) {
          // Modify ReturnType's behavior since ts.Type may not match actual llvm.Type (e.g. in case of closures)
          llvmType = adjustDeducedReturnType(typeReference, this.generator);
        }
        if (!llvmType) {
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

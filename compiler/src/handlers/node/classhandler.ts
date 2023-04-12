/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
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
import { LLVMValue } from "../../llvm/value";
import { Declaration } from "../../ts/declaration";
import { DebugInfo } from "../../generator/debug_info";
import { TSType } from "../../ts/type";
import * as llvm from "llvm-node";

export class ClassHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isClassDeclaration(node)) {
      this.handleClassDeclaration(Declaration.create(node, this.generator), parentScope);
      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private getStaticPropertiesFromDeclaration(declaration: Declaration, parentScope: Scope) {
    const staticProperties = new Map<string, LLVMValue>();

    if (declaration.heritageClauses) {
      for (const clause of declaration.heritageClauses) {
        for (const type of clause.types) {
          const symbol = this.generator.ts.checker.getSymbolAtLocation(type.expression);
          const baseClassDeclaration = symbol.declarations[0];

          const baseClassThisType = baseClassDeclaration.type;
          const mangledBaseClassTypename = baseClassThisType.mangle();

          const namespace = baseClassDeclaration.getNamespace();
          const qualifiedName = namespace.concat(mangledBaseClassTypename).join(".");
          const baseClassScope = parentScope.get(qualifiedName) as Scope;

          baseClassScope?.thisData?.staticProperties?.forEach((value, key) => {
            if (value.type.getPointerLevel() !== 2) {
              throw new Error(`Expected static property to be of pointer-to-pointer type, got '${value.type.toString()}' (base scope)`);
            }

            staticProperties.set(key, value);
          });
        }
      }
    }

    for (const memberDecl of declaration.members) {
      if (memberDecl.isProperty() && memberDecl.initializer && memberDecl.isStatic()) {
        let initializerValue = this.generator.handleExpression(memberDecl.initializer);
        if (initializerValue.type.getPointerLevel() !== 1 && initializerValue.type.getPointerLevel() !== 2) {
          throw new Error(`Expected static property initializer to be of pointer or pointer-to-pointer type, got '${initializerValue.type.toString()}', error at: '${memberDecl.getText()}'`);
        }

        if (initializerValue.type.getPointerLevel() !== 2) {
          const initializerValuePtrPtr = this.generator.gc.allocate(initializerValue.type);
          this.generator.builder.createSafeStore(initializerValue, initializerValuePtrPtr);
          initializerValue = initializerValuePtrPtr;
        }

        staticProperties.set(memberDecl.name!.getText(), initializerValue);
      }
    }

    return staticProperties;
  }

  private handleClassDeclaration(declaration: Declaration, parentScope: Scope): void {
    if (declaration.typeParameters) {
      // Generics will be handled once constuctor called or class specialization appers in 'extends' clause to figure out actual generic arguments.
      return;
    }

    const name = declaration.name!.getText();
    const thisType = declaration.type;
    const mangledTypename = thisType.mangle();
    if (thisType.isDeclared() && parentScope.get(mangledTypename)) {
      return;
    }

    this.generator.symbolTable.withLocalScope((localScope) => {
      this.handleHeritageClauses(declaration, localScope, parentScope);

      const llvmType = thisType.getLLVMType();
      const staticProperties = this.getStaticPropertiesFromDeclaration(declaration, parentScope);

      const scope = new Scope(name, mangledTypename, this.generator, false, parentScope, {
        declaration,
        llvmType,
        tsType: thisType,
        staticProperties,
      });

      // @todo: this logic is required because of builtins
      parentScope.setOrAssign(mangledTypename, scope);
      if (this.generator.getDebugInfo() && declaration.isAmbient() == false) {
        const debugInfo = this.generator.getDebugInfo();
        if (declaration.members) {
          let typeMap: Map<string, llvm.DIType> = new Map<string, llvm.DIType>();
          let file: llvm.DIFile | undefined = undefined;
          for (let member of declaration.members) {
            for (let type of member.type.types) {
              if (type.isUndefined() == false) { // && member.name !== undefined) {
                if (file == undefined) {
                  const { filename, dir } = DebugInfo.getFileNameAndDir(member.getSourceFile().fileName);
                  file = debugInfo?.createFile(filename, dir);
                }
                const lineNo = member.getSourceFile().getLineStarts();
                let diType = debugInfo?.getOrCreateCompositeType(type,
                  this.generator.module.dataLayout.getPointerSizeInBits(0),
                  debugInfo?.getScope(), lineNo[0]);
                if (diType)
                  typeMap.set(type.toString(), diType);
                break;
              }
            }
          }
          for (let member of declaration.members) {
            for (let type of member.type.types) {
              let diType = typeMap.get(type.toString());
              if (!type.isUndefined() && member.name !== undefined &&
                file !== undefined && diType !== undefined && type !== undefined) {
                const lineNo = member.getSourceFile().getLineStarts();
                debugInfo?.emitMemberDeclaration(diType as llvm.DIScope,
                  member.name.getText(), 0, lineNo[0], file, diType);
              }
            }
          }
        }
      }
    }, parentScope);
  }

  private handleHeritageClauses(declaration: Declaration, localScope: Scope, parentScope: Scope) {
    if (!declaration.heritageClauses) {
      return;
    }

    for (const clause of declaration.heritageClauses) {
      for (const type of clause.types) {
        const typeArguments = type.typeArguments;
        if (typeArguments) {
          const symbol = this.generator.ts.checker.getSymbolAtLocation(type.expression);
          const baseClassDeclaration = symbol.valueDeclaration;

          if (!baseClassDeclaration) {
            throw new Error(`Unable to find valueDeclaration at '${type.expression.getText()}'`);
          }

          const baseTypeParameters = baseClassDeclaration.typeParameters;
          if (!baseTypeParameters) {
            throw new Error(
              `Expected '${baseClassDeclaration.name?.getText()}' to have type parameters. Required from '${type.getText()}'`
            );
          }

          // Register map from generic parameters to actual types
          baseTypeParameters.forEach((typeParameter, index) => {
            localScope.typeMapper.register(
              typeParameter.name.getText(),
              this.generator.ts.checker.getTypeFromTypeNode(typeArguments[index])
            );
          });

          this.generator.meta.registerClassTypeMapper(baseClassDeclaration, localScope.typeMapper);

          // Register generic class specialization since actual types are known at this point
          const thisType = baseClassDeclaration.type;
          const mangledTypename = thisType.mangle();

          if (!parentScope.get(mangledTypename)) {
            const llvmType = thisType.getLLVMType();
            const staticProperties = this.getStaticPropertiesFromDeclaration(declaration, parentScope);

            const scope = new Scope(undefined, mangledTypename, this.generator, false, parentScope, {
              declaration,
              llvmType,
              tsType: thisType,
              staticProperties,
            });

            parentScope.set(mangledTypename, scope);
          }
        }
      }
    }
  }
}

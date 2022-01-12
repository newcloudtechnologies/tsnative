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

import { GenericTypeMapper, LLVMGenerator, MetaInfoStorage } from "../generator";
import { Scope, Environment, HeapVariableDeclaration, Prototype } from "../scope";
import * as llvm from "llvm-node";
import { LLVMConstantInt, LLVMValue, LLVMConstant } from "../llvm/value";
import * as ts from "typescript";
import { Declaration } from "../ts/declaration";
import { Expression } from "../ts/expression";
import { Signature } from "../ts/signature";

export class ConciseBody {
  private readonly body: ts.ConciseBody;
  private readonly generator: LLVMGenerator;

  private constructor(body: ts.ConciseBody, generator: LLVMGenerator) {
    this.body = body;
    this.generator = generator;
  }

  static create(body: ts.ConciseBody, generator: LLVMGenerator) {
    return new ConciseBody(body, generator);
  }

  getEnvironmentVariables(signature: Signature, extendScope: Scope, outerEnv?: Environment) {
    const environmentVariables = this.getEnvironmentVariablesFromBody(signature, extendScope, outerEnv);
    if (outerEnv) {
      environmentVariables.push(...outerEnv.variables);
    }

    return environmentVariables;
  }

  private getEnvironmentVariablesFromBody(signature: Signature, extendScope: Scope, outerEnv?: Environment) {
    const vars = extendScope.withThisKeeping(() =>
      this.getFunctionEnvironmentVariables(signature, extendScope, [], [], outerEnv)
    );
    const varsStatic = this.getStaticFunctionEnvironmentVariables();
    // Do not take 'undefined' since it is injected for every source file and available globally
    // as variable of 'i8' type that breaks further logic (all the variables expected to be pointers). @todo: turn 'undefined' into pointer?
    return vars.concat(varsStatic).filter((variable) => variable !== "undefined");
  }

  private getFunctionEnvironmentVariables(
    signature: Signature,
    extendScope: Scope,
    environmentVariables: string[] = [],
    handled: ts.ConciseBody[] = [],
    outerEnv?: Environment
  ) {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope((bodyScope) => {
        const dummyBlock = llvm.BasicBlock.create(this.generator.context, "dummy", this.generator.currentFunction);
        this.generator.builder.setInsertionPoint(dummyBlock);

        const isStaticProperty = (node: ts.Node): boolean => {
          let result = false;

          if (!this.generator.ts.checker.nodeHasSymbol(node)) {
            return result;
          }

          const symbol = this.generator.ts.checker.getSymbolAtLocation(node);

          if (symbol.valueDeclaration?.kind === ts.SyntaxKind.PropertyDeclaration) {
            const propertyDeclaration = symbol.valueDeclaration;

            result = propertyDeclaration.isStaticProperty();
          } else {
            result = false;
          }

          return result;
        };

        const addNonLocalVariableIfNeeded = (node: ts.Node) => {
          const nodeText = node.getText();

          const isNonThisPropertyAccess =
            ts.isPropertyAccessExpression(node) && !node.getText().startsWith(this.generator.internalNames.This);
          const isIdentifier = ts.isIdentifier(node);
          const isLocal = bodyScope.get(nodeText);
          const isKnown = environmentVariables.includes(nodeText);
          const isThis = nodeText === this.generator.internalNames.This;

          if ((isNonThisPropertyAccess || isIdentifier) && !isLocal && !isKnown && !isThis && !isStaticProperty(node)) {
            environmentVariables.push(nodeText);
          }
        };

        const visitor = (node: ts.Node) => {
          addNonLocalVariableIfNeeded(node);

          if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
            if (!handled.includes(node.body)) {
              handled.push(node.body);

              const innerFunctionSignature = this.generator.ts.checker.getSignatureFromDeclaration(
                Declaration.create(node, this.generator)
              );

              ConciseBody.create(node.body, this.generator).getFunctionEnvironmentVariables(
                innerFunctionSignature,
                extendScope,
                environmentVariables,
                handled
              );
            }
          } else if (ts.isPropertyAccessExpression(node)) {
            const accessorType = Expression.create(node, this.generator).getAccessorType();
            if (accessorType) {
              const symbol = this.generator.ts.checker.getSymbolAtLocation(node);
              const declaration = symbol.declarations.find((decl) =>
                accessorType === ts.SyntaxKind.GetAccessor ? decl.isGetAccessor() : decl.isSetAccessor()
              );
              if (!declaration) {
                throw new Error("No accessor declaration found");
              }

              const declarationBody = declaration.isFunctionLike() && declaration.body;
              if (declarationBody && !handled.includes(declarationBody)) {
                handled.push(declarationBody);

                const innerFunctionSignature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);
                ConciseBody.create(declarationBody, this.generator).getFunctionEnvironmentVariables(
                  innerFunctionSignature,
                  extendScope,
                  environmentVariables,
                  handled
                );
              }
            }
          } else if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
            const type = this.generator.ts.checker.getTypeAtLocation(node.expression);
            let declaration: Declaration | undefined;

            if (ts.isCallExpression(node)) {
              // @todo: less dirty solution
              // For the property accesses to parameters with call, prototype existence is expected.
              // But arrow function and function expressions with (even potentially with) polymorphic parameters are handled once called because actual argument type affects environment state.
              // To make correct environment in such cases it's neccesary to skip calls to polymorphic parameters until actual arguments are became known.
              let skip = false;

              if (
                ts.isPropertyAccessExpression(node.expression) &&
                this.generator.ts.checker.nodeHasSymbol(node.expression.expression)
              ) {
                let propertyAccessRoot: ts.Expression = node.expression;
                let functionName = node.expression.name.getText();

                while (ts.isPropertyAccessExpression(propertyAccessRoot)) {
                  functionName = propertyAccessRoot.name.getText();
                  propertyAccessRoot = propertyAccessRoot.expression;
                }

                const propertyAccessRootSymbol = this.generator.ts.checker.getSymbolAtLocation(propertyAccessRoot);
                const propertyAccessDeclaration = propertyAccessRootSymbol.valueDeclaration;

                if (propertyAccessRoot.kind === ts.SyntaxKind.ThisKeyword) {
                  const thisVal = extendScope.get("this");

                  let prototype: Prototype | undefined;

                  if (thisVal instanceof LLVMValue && thisVal.hasPrototype()) {
                    prototype = thisVal.getPrototype();
                  } else if (outerEnv?.thisPrototype) {
                    prototype = outerEnv.thisPrototype;
                  }

                  if (prototype) {
                    const methodDeclaration = prototype.methods.find(
                      (member) => member.name?.getText() === functionName
                    );

                    if (methodDeclaration) {
                      declaration = methodDeclaration;
                      skip = true;
                    }
                  } else {
                    if (!propertyAccessDeclaration?.isClassOrInterface()) {
                      throw new Error(
                        `Expected class or interface declaration, got '${propertyAccessDeclaration?.getText()}'`
                      );
                    }

                    const methodDeclaration = propertyAccessDeclaration.members.find(
                      (m) => m.name?.getText() === functionName
                    );
                    if (methodDeclaration) {
                      declaration = methodDeclaration;
                      skip = true;
                    }
                  }
                } else {
                  // mkrv: @todo: duplicate functionality
                  if (propertyAccessDeclaration?.isParameter()) {
                    skip = true;

                    const prototype = this.generator.meta.try(
                      MetaInfoStorage.prototype.getParameterPrototype,
                      propertyAccessRoot.getText()
                    );

                    if (prototype) {
                      const methodDeclaration = prototype.methods.find(
                        (method) => method.name?.getText() === functionName
                      );
                      if (!methodDeclaration) {
                        throw new Error(`Unable to find '${functionName}' in prototype of '${type.toString()}'`);
                      }

                      declaration = methodDeclaration;
                    }
                  }
                }
              }

              if (!skip) {
                const symbol = type.getSymbol();
                declaration = symbol.valueDeclaration;

                if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
                  declaration = declaration?.members.find((m) => m.isConstructor());
                }
              }
            } else if (ts.isNewExpression(node)) {
              const symbol = type.getSymbol();
              declaration = symbol.valueDeclaration;
              if (!declaration) {
                throw new Error(`Unable to find valueDeclaration at '${node.getText()}'`);
              }

              const classFileName = declaration.getSourceFile().fileName;
              const classRootScope = this.generator.symbolTable.getScope(classFileName);
              if (!classRootScope) {
                throw new Error(`No scope '${classFileName}' found`);
              }

              if (!extendScope.get(classFileName)) {
                extendScope.set(classFileName, classRootScope);
              }

              const constructorDeclaration = declaration.members.find((m) => m.isConstructor());
              if (!constructorDeclaration) {
                // unreachable if source is preprocessed correctly
                throw new Error(`No constructor provided: ${declaration.getText()}`);
              }

              const externalThis = extendScope.get("this");
              if (externalThis && externalThis instanceof LLVMValue) {
                externalThis.attachPrototype(declaration.getPrototype());
              } else {
                const fakeThis = LLVMConstantInt.getFalse(this.generator);
                fakeThis.attachPrototype(declaration.getPrototype());
                extendScope.set("this", fakeThis);
              }

              declaration = constructorDeclaration;
            }

            if (declaration) {
              const declarationBody = declaration.isFunctionLike() && declaration.body;

              if (declarationBody && !handled.includes(declarationBody)) {
                handled.push(declarationBody);

                const innerFunctionSignature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);
                ConciseBody.create(declarationBody, this.generator).getFunctionEnvironmentVariables(
                  innerFunctionSignature,
                  extendScope,
                  environmentVariables,
                  handled
                );
              }
            }
          }

          node.forEachChild(visitor);
        };

        const fakeVariablesCreator = (node: ts.Node) => {
          if (ts.isFunctionLike(node)) {
            return;
          }

          if (ts.isVariableStatement(node)) {
            node.declarationList.declarations.forEach((declaration) => {
              bodyScope.set(
                declaration.name.getText(),
                new HeapVariableDeclaration(
                  LLVMConstantInt.getFalse(this.generator),
                  LLVMConstantInt.getFalse(this.generator),
                  ""
                )
              );
            });
          }

          node.forEachChild(fakeVariablesCreator);
        };

        this.body.forEachChild(fakeVariablesCreator);

        ts.forEachChild(this.body, visitor);

        dummyBlock.eraseFromParent();
        // @todo: check arguments usage too
        environmentVariables.push(
          ...signature
            .getParameters()
            .map((p) => p.escapedName.toString())
            .filter((name) => !environmentVariables.includes(name))
        );

        const declaredParameters = signature.getDeclaredParameters();
        const defaultParameters = declaredParameters
          .filter((param) => param.initializer)
          .map((param) => param.initializer!.getText());
        environmentVariables.push(...defaultParameters.filter((name) => !environmentVariables.includes(name)));

        return environmentVariables;
      }, this.generator.symbolTable.currentScope);
    });
  }

  private getStaticFunctionEnvironmentVariables() {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope((_) => {
        const externalVariables: string[] = [];

        const dummyBlock = llvm.BasicBlock.create(this.generator.context, "dummy", this.generator.currentFunction);
        this.generator.builder.setInsertionPoint(dummyBlock);

        const visitor = (node: ts.Node) => {
          if (ts.isPropertyAccessExpression(node)) {
            const propertyAccess = node.name;
            const symbol = this.generator.ts.checker.getSymbolAtLocation(propertyAccess);
            const declaration = symbol.declarations[0];
            if (declaration.modifiers?.find((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword)) {
              externalVariables.push(node.getText());
            }
          }

          if (node.getChildCount()) {
            node.forEachChild(visitor);
          }
        };

        ts.forEachChild(this.body, visitor);

        dummyBlock.eraseFromParent();
        return externalVariables;
      }, this.generator.symbolTable.currentScope);
    });
  }

  getEffectiveArguments(closure: string) {
    const effectiveArguments = new Map<string, LLVMValue>();

    const searchForEffectiveArgumentsNames = (node: ts.Node) => {
      if (effectiveArguments.size > 0) {
        // @todo: This guard makes it impossible to call closure parameter more than once.
        return;
      }

      if (node.getText() === closure) {
        const type = this.generator.ts.checker.getTypeAtLocation(node);

        if (!type.isSymbolless()) {
          const symbol = type.getSymbol();
          const declaration = symbol.declarations[0];

          declaration.parameters.forEach((parameter) => {
            const llvmType = this.generator.ts.checker.getTypeAtLocation(parameter).getLLVMType();
            effectiveArguments.set(parameter.name.getText(), LLVMConstant.createNullValue(llvmType, this.generator));
          });
        }
      } else if (ts.isCallExpression(node) && node.expression.getText() === closure) {
        const typeMapper = GenericTypeMapper.tryGetMapperForGenericClassMethod(node, this.generator);

        node.arguments.forEach((arg) => {
          let tsType = this.generator.ts.checker.getTypeAtLocation(arg);
          if (!tsType.isSupported()) {
            if (!typeMapper) {
              throw new Error(`Expected generic class type mapper. Error at '${node.getText()}'`);
            }

            tsType = typeMapper.get(tsType.toString());
          }

          const llvmType = tsType.getLLVMType();
          effectiveArguments.set(
            Expression.create(arg, this.generator).getExpressionText(),
            LLVMConstant.createNullValue(llvmType, this.generator)
          );
        });
      }

      node.forEachChild(searchForEffectiveArgumentsNames);
    };

    ts.forEachChild(this.body, searchForEffectiveArgumentsNames);
    return Array.from(effectiveArguments.values());
  }
}

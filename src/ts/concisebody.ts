/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { LLVMGenerator, MetaInfoStorage } from "../generator";
import { Scope, Environment, HeapVariableDeclaration } from "../scope";
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
    const environmentVariables = this.getEnvironmentVariablesFromBody(signature, extendScope);
    if (outerEnv) {
      environmentVariables.push(...outerEnv.variables);
    }

    return environmentVariables;
  }

  private getEnvironmentVariablesFromBody(signature: Signature, extendScope: Scope) {
    const vars = this.getFunctionEnvironmentVariables(signature, extendScope);
    const varsStatic = this.getStaticFunctionEnvironmentVariables();
    // Do not take 'undefined' since it is injected for every source file and available globally
    // as variable of 'i8' type that breaks further logic (all the variables expected to be pointers). @todo: turn 'undefined' into pointer?
    return vars.concat(varsStatic).filter((variable) => variable !== "undefined");
  }

  private getFunctionEnvironmentVariables(
    signature: Signature,
    extendScope: Scope,
    externalVariables: string[] = [],
    handled: ts.ConciseBody[] = []
  ) {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope((bodyScope) => {
        const dummyBlock = llvm.BasicBlock.create(this.generator.context, "dummy", this.generator.currentFunction);
        this.generator.builder.setInsertionPoint(dummyBlock);

        const visitor = (node: ts.Node) => {
          const nodeText = node.getText();

          const isStaticProperty = (n: ts.Node): boolean => {
            let result = false;
            const symbol = this.generator.ts.checker.getSymbolAtLocation(n);

            if (symbol && symbol.valueDeclaration?.kind === ts.SyntaxKind.PropertyDeclaration) {
              const propertyDeclaration = symbol.valueDeclaration;

              result = propertyDeclaration.isStaticProperty();
            } else {
              result = false;
            }

            return result;
          };

          const isCall = (expression: ts.PropertyAccessExpression) => {
            let parent = expression.parent;
            while (parent && !ts.isExpressionStatement(parent)) {
              if (ts.isCallExpression(parent)) {
                return !parent.arguments.includes(expression) || !ts.isPropertyAccessExpression(parent.parent);
              }

              parent = parent.parent;
            }

            return false;
          };

          if (
            ((ts.isPropertyAccessExpression(node) &&
              !isCall(node) &&
              !node.getText().startsWith(this.generator.internalNames.This)) ||
              ts.isIdentifier(node)) &&
            !bodyScope.get(nodeText) &&
            nodeText !== this.generator.internalNames.This &&
            !externalVariables.includes(nodeText) &&
            !isStaticProperty(node)
          ) {
            externalVariables.push(nodeText);
          }

          if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
            if (!handled.includes(node.body)) {
              handled.push(node.body);

              const innerFunctionSignature = this.generator.ts.checker.getSignatureFromDeclaration(
                Declaration.create(node, this.generator)
              );

              ConciseBody.create(node.body, this.generator).getFunctionEnvironmentVariables(
                innerFunctionSignature,
                extendScope,
                externalVariables,
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
                  externalVariables,
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
                const propertyAccessSymbol = this.generator.ts.checker.getSymbolAtLocation(node.expression.expression);
                const propertyAccessDeclaration = propertyAccessSymbol.valueDeclaration;

                if (node.expression.expression.kind === ts.SyntaxKind.ThisKeyword) {
                  const thisVal = extendScope.get("this");

                  if (thisVal instanceof LLVMValue && thisVal.hasPrototype()) {
                    const propertyAccess = node.expression;
                    const functionName = propertyAccess.name.getText();
                    const methodDeclaration = thisVal
                      .getPrototype()
                      .methods.find((member) => member.name?.getText() === functionName);

                    if (methodDeclaration) {
                      declaration = methodDeclaration;
                      skip = true;
                    }
                  }
                }

                if (propertyAccessDeclaration?.isParameter()) {
                  skip = true;

                  const propertyAccess = node.expression;
                  const functionName = propertyAccess.name.getText();
                  const prototype = this.generator.meta.try(
                    MetaInfoStorage.prototype.getParameterPrototype,
                    propertyAccess.expression.getText()
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
                  externalVariables,
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
        externalVariables.push(
          ...signature
            .getParameters()
            .map((p) => p.escapedName.toString())
            .filter((name) => !externalVariables.includes(name))
        );

        return externalVariables;
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
        node.arguments.forEach((arg) => {
          const llvmType = this.generator.ts.checker.getTypeAtLocation(arg).getLLVMType();
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

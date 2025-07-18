import { GenericTypeMapper, LLVMGenerator } from "../generator";
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

  getEnvironmentVariables(signature: Signature | undefined, extendScope: Scope, outerEnv?: Environment) {
    const environmentVariables = this.getEnvironmentVariablesFromBody(signature, extendScope);
    if (outerEnv && outerEnv.variables.includes("this")) {
      environmentVariables.push("this");
    }

    return environmentVariables.filter((variable, index) => environmentVariables.indexOf(variable) === index);
  }

  private getEnvironmentVariablesFromBody(signature: Signature | undefined, extendScope: Scope) {
    const vars = extendScope.withThisKeeping(() => this.getFunctionEnvironmentVariables(signature, extendScope));
    const varsStatic = this.getStaticFunctionEnvironmentVariables();
    // Do not take 'undefined' since it is injected for every source file and available globally
    // as variable of 'i8' type that breaks further logic (all the variables expected to be pointers). @todo: turn 'undefined' into pointer?
    return vars.concat(varsStatic).filter((variable) => variable !== "undefined");
  }

  // IMPORTANT TO READ!
  // TODO AN-1170
  // This method simply collects global variables relative to the local function body with respect to the nested functions
  // Here is an algorithm:
  // 1. Open new scope to collect local variables. Scope is used as a simple container, nothing more
  // 2. Open new llvm block
  // 3. Create fake variables, names is what really important, values are fake.
  // 4. Put these fake variable into that newly created scope.
  // 5. Determine global variables using the check like: if (not in local fake scope) then global.
  // 6. Delete llvm block from the 2. because some calls could generate llvm ir generation.

  // Downsides are:
  // 1. A lot of fakes
  // 2. After point 6 and before completion of withLocalScope llvm ir builder in the detached state
  // It has no place to insert new ir. Old one (fake) was deleted and setInsertionPoint has not been called yet.
  // 3. Global variables collection should be reaonly relative to ir, to scopes and to everything. This is a simple getter.
  // Hence this code needs to be refactored. 
  // Same for the static variant.
  private getFunctionEnvironmentVariables(
    signature: Signature | undefined,
    extendScope: Scope,
    environmentVariables: string[] = [],
    handled: ts.ConciseBody[] = []
  ) {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope((bodyScope) => {
        const dummyBlock = llvm.BasicBlock.create(this.generator.context, "dummy", this.generator.currentFunction);
        this.generator.builder.setInsertionPoint(dummyBlock);

        const isStatic = (node: ts.Node): boolean => {
          let result = false;

          if (!this.generator.ts.checker.nodeHasSymbolAndDeclaration(node)) {
            return result;
          }

          const symbol = this.generator.ts.checker.getSymbolAtLocation(node);

          if (symbol.valueDeclaration?.kind === ts.SyntaxKind.PropertyDeclaration) {
            const propertyDeclaration = symbol.valueDeclaration;

            result = propertyDeclaration.isStatic();
          } else {
            result = false;
          }

          return result;
        };

        const parameterNames = signature?.getParameters()
          .map((p) => p.escapedName.toString()) || [];

        const addNonLocalVariableIfNeeded = (node: ts.Node) => {
          if (isStatic(node)) {
            return;
          }

          const nodeText = node.getText();
          const isLocal = bodyScope.get(nodeText);

          if (isLocal) {
            return;
          }

          if (this.generator.ts.checker.nodeHasSymbolAndDeclaration(node)) {
            const symbol = this.generator.ts.checker.getSymbolAtLocation(node);
            const declaration = symbol.valueDeclaration || symbol.declarations[0];

            if (declaration.isParameter() && parameterNames.includes(nodeText)) {
              return;
            }

            if (declaration.isClass()) {
              return;
            }

            if (ts.isPropertyAccessExpression(node)) {
              if (declaration.isEnumMember()) {
                const enumName = nodeText.substring(0, nodeText.lastIndexOf("."));
                environmentVariables.push(enumName);
                return;
              }

              if (this.generator.ts.checker.nodeHasSymbolAndDeclaration(node.expression)) {
                const symbol = this.generator.ts.checker.getSymbolAtLocation(node.expression);
                const declaration = symbol.valueDeclaration || symbol.declarations[0];

                if (declaration.isNamespace()) {
                  environmentVariables.push(nodeText);
                  return;
                }
              }
            }
          }

          // obj.prop
          // capture only 'obj', skip 'prop'
          if (ts.isPropertyAccessExpression(node.parent) && node !== node.parent.expression) {
            return;
          }

          const isKnown = environmentVariables.includes(nodeText);
          const isThisAccess = nodeText.startsWith(this.generator.internalNames.This);
          if (isKnown || isThisAccess) {
            return;
          }

          const isIdentifier = ts.isIdentifier(node);

          if (!isIdentifier) {
            return;
          }

          environmentVariables.push(nodeText);
        };

        const visitor = (node: ts.Node) => {
          // skip nested function parameters, only visit function bodies
          if (ts.isFunctionLike(node) && !ts.isFunctionTypeNode(node)) {
            const declaration = Declaration.create(node, this.generator);

            if (declaration.body) {
              if (ts.isBlock(declaration.body)) {
                declaration.body.forEachChild(visitor);
              } else {
                visitor(declaration.body);
              }
            }

            return;
          }

          addNonLocalVariableIfNeeded(node);

          if (ts.isPropertyAccessExpression(node)) {
            const accessorType = Expression.create(node, this.generator).getAccessorType();
            if (accessorType && this.generator.ts.checker.nodeHasSymbolAndDeclaration(node)) {
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
                extendScope.withThisKeeping(() => {
                  ConciseBody.create(declarationBody, this.generator).getFunctionEnvironmentVariables(
                    innerFunctionSignature,
                    extendScope,
                    environmentVariables,
                    handled
                  );
                });
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
                this.generator.ts.checker.nodeHasSymbolAndDeclaration(node.expression.expression)
              ) {
                let propertyAccessRoot: ts.Expression = node.expression;
                let functionName = node.expression.name.getText();

                while (ts.isPropertyAccessExpression(propertyAccessRoot)) {
                  functionName = propertyAccessRoot.name.getText();
                  propertyAccessRoot = propertyAccessRoot.expression;
                }

                if (this.generator.ts.checker.nodeHasSymbolAndDeclaration(propertyAccessRoot)) {
                  const propertyAccessRootSymbol = this.generator.ts.checker.getSymbolAtLocation(propertyAccessRoot);
                  const propertyAccessDeclaration = propertyAccessRootSymbol.valueDeclaration;

                  if (propertyAccessRoot.kind === ts.SyntaxKind.ThisKeyword) {
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
                }
              }

              if (!skip && !type.isSymbolless()) {
                const symbol = type.getSymbol();
                declaration = symbol.valueDeclaration;

                if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
                  if (!declaration) {
                    throw new Error(`Unable to find declaration for type '${type.toString()}'`);
                  }

                  declaration = declaration.members.find((m) => m.isConstructor());
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

              const methods = declaration.getMethods();
              methods.forEach((m) => {
                const declarationBody = m.isFunctionLike() && m.body;

                if (declarationBody && !handled.includes(declarationBody)) {
                  handled.push(declarationBody);

                  const innerFunctionSignature = this.generator.ts.checker.getSignatureFromDeclaration(m);
                  extendScope.withThisKeeping(() => {
                    ConciseBody.create(declarationBody, this.generator).getFunctionEnvironmentVariables(
                      innerFunctionSignature,
                      extendScope,
                      environmentVariables,
                      handled
                    );
                  });
                }
              });

              declaration.properties.forEach((property) => {
                if (!property.initializer) {
                  return;
                }

                addNonLocalVariableIfNeeded(property.initializer);
              });

              const constructorDeclaration = declaration.members.find((m) => m.isConstructor());
              if (constructorDeclaration) {
                const externalThis = extendScope.get("this");
                if (!externalThis) {
                  const fakeThis = LLVMConstantInt.getFalse(this.generator);
                  extendScope.set("this", fakeThis);
                }

                declaration = constructorDeclaration;
              } else {
                if (declaration.isDerived) {
                  const baseClassConstructor = declaration.getBases()[0].members.find((m) => m.isConstructor());
                  declaration = baseClassConstructor;
                }
              }
            }

            if (declaration) {
              const declarationBody = declaration.isFunctionLike() && declaration.body;

              if (declarationBody && !handled.includes(declarationBody)) {
                handled.push(declarationBody);

                const innerFunctionSignature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);
                extendScope.withThisKeeping(() => {
                  ConciseBody.create(declarationBody, this.generator).getFunctionEnvironmentVariables(
                    innerFunctionSignature,
                    extendScope,
                    environmentVariables,
                    handled
                  );
                });
              }
            }
          }

          node.forEachChild(visitor);
        };

        const createFakeVariables = (node: ts.Node, scope: Scope) => {
          if (ts.isFunctionDeclaration(node) && node.name) {
            const variableName = node.name.getText();
            const dummyValue = LLVMConstantInt.getFalse(this.generator);
            const fakeVariable = new HeapVariableDeclaration(dummyValue, dummyValue, "");

            scope.set(variableName, fakeVariable, false);
          }

          // skip function body
          if (ts.isFunctionLike(node)) {
            return;
          }

          if (ts.isVariableStatement(node)) {
            node.declarationList.declarations.forEach((declaration) => {
              const variableName = declaration.name.getText();
              const dummyValue = LLVMConstantInt.getFalse(this.generator);
              const fakeVariable = new HeapVariableDeclaration(dummyValue, dummyValue, "");

              scope.set(variableName, fakeVariable);
            });
          }

          if (ts.isBlock(node)) {
            this.generator.symbolTable.withLocalScope((localScope) => {
              node.forEachChild((n: ts.Node) => createFakeVariables(n, localScope));
            }, scope);
          } else {
            node.forEachChild((n: ts.Node) => createFakeVariables(n, scope));
          }
        };

        if (ts.isBlock(this.body)) {
          this.body.forEachChild((node: ts.Node) => createFakeVariables(node, bodyScope));
        } else {
          createFakeVariables(this.body, bodyScope)
        }

        if (ts.isBlock(this.body)) {
          ts.forEachChild(this.body, visitor);
        } else {
          visitor(this.body)
        }

        bodyScope.map.clear();
        dummyBlock.eraseFromParent();

        if (signature) {
          const declaredParameters = signature.getDeclaredParameters();
          const defaultParameters = declaredParameters
            .filter((param) => param.initializer)
            .map((param) => {
              const initializer = param.initializer!;
              const initializerText = initializer.getText();

              if (this.generator.ts.checker.nodeHasSymbolAndDeclaration(initializer)) {
                const symbol = this.generator.ts.checker.getSymbolAtLocation(initializer);
                const declaration = symbol.valueDeclaration || symbol.declarations[0];

                if (declaration.isEnumMember()) {
                  return initializerText.substring(0, initializerText.lastIndexOf("."))
                }
              }

              return initializerText;
            });
          environmentVariables.push(...defaultParameters.filter((name) => !environmentVariables.includes(name)));
        }

        return environmentVariables;
      }, this.generator.symbolTable.currentScope);
    });
  }

  // IMPORTANT 
  // READ COMMENT FOR getFunctionEnvironmentVariables FUNCTION FIRST!
  private getStaticFunctionEnvironmentVariables(handled: ts.Node[] = []) {
    return this.generator.withInsertBlockKeeping(() => {
      return this.generator.symbolTable.withLocalScope((bodyScope) => {
        const externalVariables: string[] = [];

        const dummyBlock = llvm.BasicBlock.create(this.generator.context, "dummy", this.generator.currentFunction);
        this.generator.builder.setInsertionPoint(dummyBlock);

        const visitor = (node: ts.Node) => {
          if (handled.includes(node)) {
            return;
          }

          handled.push(node);

          if (ts.isPropertyAccessExpression(node)) {
            const propertyAccess = node.name;
            const symbol = this.generator.ts.checker.getSymbolAtLocation(propertyAccess);
            const declaration = symbol.declarations[0];

            if (declaration.isStatic()) {
              externalVariables.push(node.getText());
            }
          }

          if (this.generator.ts.checker.nodeHasSymbolAndDeclaration(node)) {
            const symbol = this.generator.ts.checker.getSymbolAtLocation(node);
            const declaration = symbol.valueDeclaration;

            if (declaration?.isClass()) {
              declaration.getMethods().forEach((method) => {
                method.body?.forEachChild(visitor);
              });

              const constructorDeclaration = declaration.members.find((m) => m.isConstructor());
              if (constructorDeclaration) {
                constructorDeclaration.body?.forEachChild(visitor);
              }
            }
          }

          node.forEachChild(visitor);
        };

        ts.forEachChild(this.body, visitor);

        bodyScope.map.clear();
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

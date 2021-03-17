import { adjustValue, getIntegralLLVMTypeTypename, isSigned } from "@cpp";
import { LLVMGenerator } from "@generator";
import { TypeMangler, FunctionMangler } from "@mangling";
import {
  error,
  getAliasedSymbolIfNecessary,
  getTypeGenericArguments,
  createLLVMFunction,
  getLLVMType,
  checkIfLLVMString,
  isUnionLLVMValue,
  initializeUnion,
  isUnionWithUndefinedLLVMValue,
  isUnionWithNullLLVMValue,
  getLLVMValue,
  adjustLLVMValueToType,
  unwrapPointerType,
  getExpressionText,
  tryResolveGenericTypeIfNecessary,
  checkIfStaticProperty,
  correctCppPrimitiveType,
  checkIfFunction,
  checkIfObject,
  isTSClosure,
  getAccessorType,
  isSimilarStructs,
  getDeclarationNamespace,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { addClassScope, Environment, HeapVariableDeclaration, Scope } from "@scope";

export function castToInt32AndBack(
  values: llvm.Value[],
  generator: LLVMGenerator,
  handle: (ints: llvm.Value[]) => llvm.Value
): llvm.Value {
  const ints = values.map((value) => generator.builder.createFPToSI(value, llvm.Type.getInt32Ty(generator.context)));
  return generator.builder.createSIToFP(handle(ints), llvm.Type.getDoubleTy(generator.context));
}

export function castFPToIntegralType(
  value: llvm.Value,
  target: llvm.Type,
  signed: boolean,
  generator: LLVMGenerator
): llvm.Value {
  return signed ? generator.builder.createFPToSI(value, target) : generator.builder.createFPToUI(value, target);
}

export function promoteIntegralToFP(
  value: llvm.Value,
  target: llvm.Type,
  signed: boolean,
  generator: LLVMGenerator
): llvm.Value {
  return signed ? generator.builder.createSIToFP(value, target) : generator.builder.createUIToFP(value, target);
}

export function makeAssignment(left: llvm.Value, right: llvm.Value, generator: LLVMGenerator): llvm.Value {
  if (!left.type.isPointerTy()) {
    error(`Assignment destination expected to be of PointerType, got '${left.type.toString()}'`);
  }

  const typename: string = getIntegralLLVMTypeTypename(unwrapPointerType(left.type));
  if (typename) {
    right = adjustValue(right, typename, generator);
  } else if (isUnionLLVMValue(left)) {
    let unionValue = initializeUnion(left.type as llvm.PointerType, right, generator);
    if (!left.type.elementType.equals(unionValue.type)) {
      unionValue = adjustLLVMValueToType(unionValue, left.type.elementType, generator);
    }
    generator.xbuilder.createSafeStore(unionValue, left);
    return left;
  }

  if (!left.type.elementType.equals(right.type)) {
    // @todo: narrow coercion if rhs type is inherited from lhs
    if (isSimilarStructs(left.type, right.type)) {
      if (!right.type.isPointerTy()) {
        error("Expected pointer");
      }

      right = generator.builder.createBitCast(right, left.type);
    }

    right = adjustLLVMValueToType(right, left.type.elementType, generator);
  }

  generator.xbuilder.createSafeStore(right, left);
  return left;
}

export function makeBoolean(value: llvm.Value, expression: ts.Expression, generator: LLVMGenerator): llvm.Value {
  value = getLLVMValue(value, generator);

  if (value.type.isDoubleTy()) {
    return generator.builder.createFCmpONE(value, llvm.Constant.getNullValue(value.type));
  }

  if (value.type.isIntegerTy()) {
    return generator.builder.createICmpNE(value, llvm.Constant.getNullValue(value.type));
  }

  if (checkIfLLVMString(value.type)) {
    const lengthGetter = generator.builtinString.getLLVMLength(expression);
    const length = generator.xbuilder.createSafeCall(lengthGetter, [value]);
    return generator.builder.createICmpNE(length, llvm.Constant.getNullValue(length.type));
  }

  if (isUnionLLVMValue(value)) {
    if (isUnionWithUndefinedLLVMValue(value) || isUnionWithNullLLVMValue(value)) {
      const marker = generator.xbuilder.createSafeExtractValue(value, [0]);
      return generator.builder.createICmpNE(marker, llvm.ConstantInt.get(generator.context, -1, 8));
    }

    return llvm.ConstantInt.getTrue(generator.context);
  }

  if (isTSClosure(value)) {
    return llvm.ConstantInt.getTrue(generator.context);
  }

  error(`Unable to convert operand of type ${value.type} to boolean value`);
}

export function isConvertible(lhs: llvm.Type, rhs: llvm.Type): boolean {
  if (lhs.isIntegerTy() && rhs.isDoubleTy()) {
    return true;
  }

  if (lhs.isDoubleTy() && rhs.isIntegerTy()) {
    return true;
  }

  return false;
}

export enum Conversion {
  Narrowing,
  Promotion,
}

// @todo: refactor this
export function handleBinaryWithConversion(
  lhsExpression: ts.Expression,
  rhsExpression: ts.Expression,
  lhsValue: llvm.Value,
  rhsValue: llvm.Value,
  conversion: Conversion,
  handler: (l: llvm.Value, r: llvm.Value) => llvm.Value,
  generator: LLVMGenerator
): llvm.Value {
  const convertor = conversion === Conversion.Narrowing ? castFPToIntegralType : promoteIntegralToFP;

  if (lhsValue.type.isIntegerTy() && rhsValue.type.isDoubleTy()) {
    const signed = isSigned(lhsExpression, generator);
    const destinationType = conversion === Conversion.Narrowing ? lhsValue.type : rhsValue.type;
    let convertedArg = conversion === Conversion.Narrowing ? rhsValue : lhsValue;
    const untouchedArg = conversion === Conversion.Narrowing ? lhsValue : rhsValue;
    convertedArg = convertor(convertedArg, destinationType, signed, generator);
    const args: [llvm.Value, llvm.Value] =
      conversion === Conversion.Narrowing ? [untouchedArg, convertedArg] : [convertedArg, untouchedArg];
    return handler.apply(generator.builder, args);
  }

  if (lhsValue.type.isDoubleTy() && rhsValue.type.isIntegerTy()) {
    const signed = isSigned(rhsExpression, generator);
    const destinationType = conversion === Conversion.Narrowing ? rhsValue.type : lhsValue.type;
    let convertedArg = conversion === Conversion.Narrowing ? lhsValue : rhsValue;
    const untouchedArg = conversion === Conversion.Narrowing ? rhsValue : lhsValue;
    convertedArg = convertor(convertedArg, destinationType, signed, generator);
    const args: [llvm.Value, llvm.Value] =
      conversion === Conversion.Narrowing ? [convertedArg, untouchedArg] : [untouchedArg, convertedArg];
    return handler.apply(generator.builder, args);
  }

  error("Invalid types to handle with conversion");
}

export function getDeclarationScope(
  declaration: ts.Declaration,
  thisType: ts.Type | undefined,
  generator: LLVMGenerator
): Scope {
  if (thisType) {
    const namespace = getDeclarationNamespace(declaration);
    const typename = TypeMangler.mangle(thisType, generator.checker, declaration);
    const qualifiedName = namespace.concat(typename).join(".");
    return generator.symbolTable.get(qualifiedName) as Scope;
  }

  return generator.symbolTable.currentScope;
}

export function getArgumentArrayType(expression: ts.ArrayLiteralExpression, checker: ts.TypeChecker) {
  if (!ts.isCallExpression(expression.parent)) {
    error(`Expected expression parent to be of kind ts.CallExpression, got '${ts.SyntaxKind[expression.parent.kind]}'`);
  }

  const parentType = checker.getTypeAtLocation(expression.parent.expression);
  if (!parentType.symbol) {
    error(`Symbol not found for '${checker.typeToString(parentType)}'`);
  }

  const argumentIndex = expression.parent.arguments.findIndex((argument) => argument === expression);
  if (argumentIndex === -1) {
    error(`Argument '${expression.getText()}' not found`); // unreachable
  }

  const parentDeclaration = parentType.symbol.valueDeclaration as ts.FunctionLikeDeclaration;
  return checker.getTypeAtLocation(parentDeclaration.parameters[argumentIndex]);
}

export function getArrayType(expression: ts.ArrayLiteralExpression, generator: LLVMGenerator) {
  let arrayType: ts.Type | undefined;
  if (expression.elements.length === 0) {
    if (ts.isVariableDeclaration(expression.parent)) {
      arrayType = tryResolveGenericTypeIfNecessary(generator.checker.getTypeAtLocation(expression.parent), generator);
    } else if (ts.isCallExpression(expression.parent)) {
      arrayType = getArgumentArrayType(expression, generator.checker);
    } else if (ts.isBinaryExpression(expression.parent)) {
      arrayType = tryResolveGenericTypeIfNecessary(
        generator.checker.getTypeAtLocation(expression.parent.left),
        generator
      );
    }
  }

  if (!arrayType) {
    arrayType = tryResolveGenericTypeIfNecessary(generator.checker.getTypeAtLocation(expression), generator);
  }

  return arrayType;
}

export function createArrayConstructor(
  expression: ts.ArrayLiteralExpression,
  generator: LLVMGenerator
): { constructor: llvm.Value; allocated: llvm.Value } {
  addClassScope(expression, generator.symbolTable.globalScope, generator);

  const arrayType = getArrayType(expression, generator);
  const symbol = getAliasedSymbolIfNecessary(arrayType.symbol, generator.checker);
  const valueDeclaration = symbol.valueDeclaration;

  const constructorDeclaration = (valueDeclaration as ts.ClassDeclaration).members.find(ts.isConstructorDeclaration)!;

  const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
    constructorDeclaration,
    expression,
    arrayType,
    [],
    generator
  );
  if (!isExternalSymbol) {
    error(`Array constructor for type '${generator.checker.typeToString(arrayType)}' not found`);
  }

  const parentScope = getDeclarationScope(valueDeclaration, arrayType, generator);
  if (!parentScope.thisData) {
    error("No 'this' data found");
  }

  const { fn: constructor } = createLLVMFunction(
    llvm.Type.getVoidTy(generator.context),
    [llvm.Type.getInt8PtrTy(generator.context)],
    qualifiedName,
    generator.module
  );

  const allocated = generator.gc.allocate(parentScope.thisData.llvmType.elementType);
  return { constructor, allocated };
}

export function createArrayPush(
  elementType: ts.Type,
  expression: ts.ArrayLiteralExpression,
  generator: LLVMGenerator
): llvm.Value {
  const arrayType = getArrayType(expression, generator);
  if (checkIfFunction(elementType)) {
    elementType = generator.builtinTSClosure.getTSType();
  }

  const pushSymbol = generator.checker.getPropertyOfType(arrayType, "push")!;
  const pushDeclaration = pushSymbol.valueDeclaration;

  const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
    pushDeclaration,
    expression,
    arrayType,
    [elementType],
    generator
  );

  if (!isExternalSymbol) {
    error(`Array 'push' for type '${generator.checker.typeToString(arrayType)}' not found`);
  }

  const parameterType =
    checkIfObject(elementType) || elementType.isUnionOrIntersection()
      ? llvm.Type.getInt8PtrTy(generator.context)
      : correctCppPrimitiveType(getLLVMType(elementType, expression, generator));

  const { fn: push } = createLLVMFunction(
    llvm.Type.getDoubleTy(generator.context),
    [llvm.Type.getInt8PtrTy(generator.context), parameterType],
    qualifiedName,
    generator.module
  );
  return push;
}

export function createArraySubscription(expression: ts.ElementAccessExpression, generator: LLVMGenerator): llvm.Value {
  const arrayType = generator.checker.getTypeAtLocation(expression.expression);
  let elementType = getTypeGenericArguments(arrayType)[0];
  if (checkIfFunction(elementType)) {
    elementType = generator.builtinTSClosure.getTSType();
  }
  const valueDeclaration = getAliasedSymbolIfNecessary(arrayType.symbol, generator.checker).valueDeclaration;
  const declaration = (valueDeclaration as ts.ClassDeclaration).members.find(ts.isIndexSignatureDeclaration)!;

  const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
    declaration,
    expression,
    arrayType,
    [generator.checker.getTypeFromTypeNode(declaration.parameters[0].type!)],
    generator
  );

  if (!isExternalSymbol) {
    error(`Array 'subscription' for type '${generator.checker.typeToString(arrayType)}' not found`);
  }

  const retType = getLLVMType(elementType, expression.expression, generator);

  const { fn: subscript } = createLLVMFunction(
    retType,
    [llvm.Type.getInt8PtrTy(generator.context), llvm.Type.getDoubleTy(generator.context)],
    qualifiedName,
    generator.module
  );
  return subscript;
}

export function createArrayConcat(expression: ts.ArrayLiteralExpression, generator: LLVMGenerator): llvm.Value {
  const arrayType = getArrayType(expression, generator);

  const symbol = generator.checker.getPropertyOfType(arrayType, "concat")!;
  const declaration = symbol.valueDeclaration;

  const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
    declaration,
    expression,
    arrayType,
    [arrayType],
    generator
  );

  if (!isExternalSymbol) {
    error(`Array 'concat' for type '${generator.checker.typeToString(arrayType)}' not found`);
  }

  const llvmArrayType = getLLVMType(arrayType, expression, generator);

  const { fn: concat } = createLLVMFunction(
    llvmArrayType,
    [llvmArrayType, llvm.Type.getInt8PtrTy(generator.context), llvm.Type.getInt8PtrTy(generator.context)],
    qualifiedName,
    generator.module
  );

  return concat;
}

export function getLLVMReturnType(tsReturnType: ts.Type, expression: ts.Expression, generator: LLVMGenerator) {
  const llvmReturnType = getLLVMType(tsReturnType, expression, generator);

  if (llvmReturnType.isVoidTy()) {
    return llvmReturnType;
  }

  return llvmReturnType.isPointerTy() ? llvmReturnType : llvmReturnType.getPointerTo();
}

export function getEnvironmentVariables(
  body: ts.ConciseBody,
  signature: ts.Signature,
  generator: LLVMGenerator,
  outerEnv?: Environment
) {
  const environmentVariables = getEnvironmentVariablesFromBody(body, signature, generator);
  if (outerEnv) {
    environmentVariables.push(...outerEnv.variables);
  }

  return environmentVariables;
}

function getEnvironmentVariablesFromBody(body: ts.ConciseBody, signature: ts.Signature, generator: LLVMGenerator) {
  const vars = getFunctionEnvironmentVariables(body, signature, generator);
  const varsStatic = getStaticFunctionEnvironmentVariables(body, generator);
  // Do not take 'undefined' since it is injected for every source file and available globally
  // as variable of 'i8' type that breaks further logic (all the variables expected to be pointers). @todo: turn 'undefined' into pointer?
  return vars.concat(varsStatic).filter((variable) => variable !== "undefined");
}

function getFunctionEnvironmentVariables(
  body: ts.ConciseBody,
  signature: ts.Signature,
  generator: LLVMGenerator,
  externalVariables: string[] = []
) {
  return generator.withInsertBlockKeeping(() => {
    return generator.symbolTable.withLocalScope((bodyScope) => {
      const dummyBlock = llvm.BasicBlock.create(generator.context, "dummy", generator.currentFunction);
      generator.builder.setInsertionPoint(dummyBlock);

      const visitor = (node: ts.Node) => {
        const nodeText = node.getText();

        const isStaticProperty = (n: ts.Node): boolean => {
          let result = false;
          const symbol = generator.checker.getSymbolAtLocation(n);

          if (symbol && symbol.valueDeclaration?.kind === ts.SyntaxKind.PropertyDeclaration) {
            const propertyDeclaration = symbol!.valueDeclaration as ts.PropertyDeclaration;

            result = checkIfStaticProperty(propertyDeclaration);
          } else {
            result = false;
          }

          return result;
        };

        if (
          ts.isIdentifier(node) &&
          !bodyScope.get(nodeText) &&
          !externalVariables.includes(nodeText) &&
          !ts.isPropertyAssignment(node.parent) &&
          !isStaticProperty(node)
        ) {
          externalVariables.push(nodeText);
        }

        if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
          const innerFunctionSignature = generator.checker.getSignatureFromDeclaration(
            node as ts.SignatureDeclaration
          )!;

          getFunctionEnvironmentVariables(node.body, innerFunctionSignature, generator, externalVariables);
        } else if (ts.isPropertyAccessExpression(node)) {
          const accessorType = getAccessorType(node, generator);
          if (accessorType) {
            let symbol = generator.checker.getSymbolAtLocation(node);
            if (!symbol) {
              error("Symbol not found");
            }

            symbol = getAliasedSymbolIfNecessary(symbol, generator.checker);

            const declaration = symbol.declarations.find(
              accessorType === ts.SyntaxKind.GetAccessor ? ts.isGetAccessorDeclaration : ts.isSetAccessorDeclaration
            );
            if (!declaration) {
              error("No accessor declaration found");
            }

            const declarationBody = (declaration as ts.FunctionLikeDeclaration).body;
            if (declarationBody) {
              const innerFunctionSignature = generator.checker.getSignatureFromDeclaration(
                declaration as ts.SignatureDeclaration
              )!;

              getFunctionEnvironmentVariables(declarationBody, innerFunctionSignature, generator, externalVariables);
            }
          }
        } else if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
          const type = generator.checker.getTypeAtLocation(node.expression);
          let symbol = type.getSymbol();
          if (!symbol) {
            error("No symbol found");
          }
          symbol = getAliasedSymbolIfNecessary(symbol, generator.checker);

          // For the arrow functions as parameters there is no valueDeclaration, so use first declaration instead
          // @todo: what about setters/getters?
          let declaration = symbol.declarations[0];
          if (ts.isNewExpression(node)) {
            const constructorDeclaration = (declaration as ts.ClassDeclaration).members.find(
              ts.isConstructorDeclaration
            );
            if (!constructorDeclaration) {
              // unreachable if source is preprocessed correctly
              error(`No constructor provided: ${declaration.getText()}`);
            }

            const thisType = generator.checker.getTypeAtLocation(node);
            const declarationScope = getDeclarationScope(constructorDeclaration, thisType, generator);
            if (!declarationScope.mangledName) {
              error("No scope name provided");
            }

            let destinationScope = bodyScope.parent!;
            while (destinationScope && destinationScope.parent) {
              destinationScope = destinationScope.parent;
            }

            if (!destinationScope.get(declarationScope.mangledName)) {
              destinationScope.set(declarationScope.mangledName, declarationScope);
            }

            declaration = constructorDeclaration;
          }

          const declarationBody = (declaration as ts.FunctionLikeDeclaration).body;

          if (declarationBody) {
            const innerFunctionSignature = generator.checker.getSignatureFromDeclaration(
              declaration as ts.SignatureDeclaration
            )!;

            getFunctionEnvironmentVariables(declarationBody, innerFunctionSignature, generator, externalVariables);
          }
        }

        if (node.getChildCount()) {
          node.forEachChild(visitor);
        }
      };

      body.forEachChild((node) => {
        if (ts.isVariableStatement(node)) {
          node.declarationList.declarations.forEach((declaration) => {
            bodyScope.set(
              declaration.name.getText(),
              new HeapVariableDeclaration(
                llvm.ConstantInt.getFalse(generator.context),
                llvm.ConstantInt.getFalse(generator.context),
                ""
              )
            );
          });
        }
      });

      ts.forEachChild(body, visitor);

      dummyBlock.eraseFromParent();
      // @todo: check arguments usage too
      externalVariables.push(
        ...signature
          .getParameters()
          .map((p) => p.escapedName.toString())
          .filter((name) => !externalVariables.includes(name))
      );

      return externalVariables;
    }, generator.symbolTable.currentScope);
  });
}

export function getStaticFunctionEnvironmentVariables(body: ts.ConciseBody, generator: LLVMGenerator) {
  return generator.withInsertBlockKeeping(() => {
    return generator.symbolTable.withLocalScope((_) => {
      const externalVariables: string[] = [];

      const dummyBlock = llvm.BasicBlock.create(generator.context, "dummy", generator.currentFunction);
      generator.builder.setInsertionPoint(dummyBlock);

      const visitor = (node: ts.Node) => {
        if (ts.isPropertyAccessExpression(node)) {
          const propertyAccess = node.name;
          const symbol = generator.checker.getSymbolAtLocation(propertyAccess);
          if (!symbol) {
            error("No symbol found");
          }
          const declaration = symbol.declarations[0] as ts.PropertyDeclaration;
          if (declaration.modifiers?.find((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword)) {
            externalVariables.push(node.getText());
          }
        }

        if (node.getChildCount()) {
          node.forEachChild(visitor);
        }
      };

      ts.forEachChild(body, visitor);

      dummyBlock.eraseFromParent();
      return externalVariables;
    }, generator.symbolTable.currentScope);
  });
}

export function getEffectiveArguments(closure: string, body: ts.ConciseBody, generator: LLVMGenerator) {
  const effectiveArguments = new Map<string, llvm.Value>();

  const searchForEffectiveArgumentsNames = (node: ts.Node) => {
    if (effectiveArguments.size > 0) {
      // @todo: This guard makes it impossible to call closure parameter more than once.
      return;
    }

    if (node.getText() === closure) {
      const type = tryResolveGenericTypeIfNecessary(generator.checker.getTypeAtLocation(node), generator);

      let symbol = type.getSymbol();
      if (symbol) {
        symbol = getAliasedSymbolIfNecessary(symbol, generator.checker);
        const declaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;

        declaration.parameters?.forEach((parameter) => {
          const llvmType = getLLVMType(
            tryResolveGenericTypeIfNecessary(generator.checker.getTypeAtLocation(parameter), generator),
            node,
            generator
          );
          effectiveArguments.set(parameter.name.getText(), llvm.Constant.getNullValue(llvmType));
        });
      }
    } else if (ts.isCallExpression(node) && node.expression.getText() === closure) {
      node.arguments.forEach((arg) => {
        const llvmType = getLLVMType(
          tryResolveGenericTypeIfNecessary(generator.checker.getTypeAtLocation(arg), generator),
          node,
          generator
        );
        effectiveArguments.set(getExpressionText(arg), llvm.Constant.getNullValue(llvmType));
      });
    }

    if (node.getChildCount() > 0) {
      node.forEachChild(searchForEffectiveArgumentsNames);
    }
  };

  ts.forEachChild(body, searchForEffectiveArgumentsNames);
  return Array.from(effectiveArguments.values());
}

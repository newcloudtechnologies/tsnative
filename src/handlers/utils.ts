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
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {
  addClassScope,
  FunctionDeclarationScopeEnvironment,
  isFunctionDeclarationScopeEnvironment,
  Scope,
} from "@scope";

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

export function getFunctionDeclarationScope(
  declaration: ts.NamedDeclaration,
  thisType: ts.Type | undefined,
  generator: LLVMGenerator
): Scope {
  const namespace: string[] = getDeclarationNamespace(declaration);

  if (thisType) {
    const typename = TypeMangler.mangle(thisType, generator.checker, declaration);
    const qualifiedName = namespace.concat(typename).join(".");
    return generator.symbolTable.get(qualifiedName) as Scope;
  }

  const { parent } = declaration;
  if (ts.isSourceFile(parent)) {
    return generator.symbolTable.globalScope;
  } else if (ts.isModuleBlock(parent)) {
    return generator.symbolTable.get(namespace.join(".")) as Scope;
  } else {
    return generator.symbolTable.currentScope;
  }
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

  const parentScope = getFunctionDeclarationScope(valueDeclaration, arrayType, generator);
  const thisValue = parentScope.thisData!.llvmType;

  const { fn: constructor } = createLLVMFunction(
    llvm.Type.getVoidTy(generator.context),
    [llvm.Type.getInt8PtrTy(generator.context)],
    qualifiedName,
    generator.module
  );
  const allocated = generator.gc.allocate((thisValue as llvm.PointerType).elementType);
  const untypedAllocated = generator.xbuilder.asVoidStar(allocated);
  return { constructor, allocated: untypedAllocated };
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
    checkIfObject(elementType) || checkIfFunction(elementType)
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

export function getDeclarationNamespace(declaration: ts.Declaration): string[] {
  let parentNode = declaration.parent;
  let moduleBlockSeen = false;
  let stopTraversing = false;
  const namespace: string[] = [];

  while (parentNode && !stopTraversing) {
    // skip declarations. block itself is in the next node
    if (!ts.isModuleDeclaration(parentNode)) {
      if (ts.isModuleBlock(parentNode)) {
        namespace.unshift(parentNode.parent.name.text);
        moduleBlockSeen = true;
      } else if (moduleBlockSeen) {
        stopTraversing = true;
      }
    }
    parentNode = parentNode.parent;
  }

  return namespace;
}

export function getLLVMReturnType(tsReturnType: ts.Type, expression: ts.Expression, generator: LLVMGenerator) {
  const llvmReturnType = getLLVMType(tsReturnType, expression, generator);

  if (llvmReturnType.isVoidTy()) {
    return llvmReturnType;
  }

  return llvmReturnType.isPointerTy() ? llvmReturnType : llvmReturnType.getPointerTo();
}

export function getEnvironmentVariablesFromBody(
  body: ts.ConciseBody,
  signature: ts.Signature,
  generator: LLVMGenerator
) {
  const vars = getFunctionEnvironmentVariables(body, signature, generator);
  const varsStatic = getStaticFunctionEnvironmentVariables(body, generator);
  return vars.concat(varsStatic);
}

export function getFunctionEnvironmentVariables(
  body: ts.ConciseBody,
  signature: ts.Signature,
  generator: LLVMGenerator
) {
  return generator.withInsertBlockKeeping(() => {
    return generator.symbolTable.withLocalScope((bodyScope) => {
      const externalVariables: string[] = [];

      const dummyBlock = llvm.BasicBlock.create(generator.context, "dummy", generator.currentFunction);
      generator.builder.setInsertionPoint(dummyBlock);

      const visitor = (node: ts.Node) => {
        const nodeText = node.getText();

        const isStaticProperty = (n: ts.Node): boolean => {
          let result = false;
          const symbol = generator.checker.getSymbolAtLocation(n);

          if (symbol && symbol!.valueDeclaration?.kind === ts.SyntaxKind.PropertyDeclaration) {
            const propertyDeclaration = symbol!.valueDeclaration as ts.PropertyDeclaration;

            result = checkIfStaticProperty(propertyDeclaration);
          } else {
            result = false;
          }

          return result;
        };

        if (
          ts.isIdentifier(node) &&
          !ts.isPropertyAssignment(node.parent) &&
          !bodyScope.map.get(nodeText) &&
          !externalVariables.includes(nodeText) &&
          !isStaticProperty(node)
        ) {
          externalVariables.push(nodeText);
        }

        if (ts.isCallExpression(node)) {
          let symbol = generator.checker.getTypeAtLocation(node.expression).symbol;
          symbol = getAliasedSymbolIfNecessary(symbol, generator.checker);
          // For the arrow functions as parameters there is no valueDeclaration, so use first declaration instead
          const functionDeclaration = symbol.declarations[0] as ts.FunctionLikeDeclaration;

          if (functionDeclaration.body) {
            const innerFunctionSignature = generator.checker.getSignatureFromDeclaration(
              functionDeclaration as ts.SignatureDeclaration
            )!;
            externalVariables.push(
              ...getFunctionEnvironmentVariables(functionDeclaration.body, innerFunctionSignature, generator)
            );
          }
        }

        if (node.getChildCount()) {
          node.forEachChild(visitor);
        }
      };

      try {
        body.forEachChild((node) => {
          if (ts.isExpressionStatement(node) && !ts.isCallExpression(node.expression)) {
            // Do not handle call expressions since it leads to function creation and this action cannot be undone trivially.
            generator.handleNode(node, bodyScope);
          }
        });
      } catch (_) {
        /* Swallow all the errors, we are not really handling anything here, only populating the body scope. */
      }

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
    return generator.symbolTable.withLocalScope((bodyScope) => {
      const externalVariables: string[] = [];

      const dummyBlock = llvm.BasicBlock.create(generator.context, "dummy", generator.currentFunction);
      generator.builder.setInsertionPoint(dummyBlock);

      const visitor = (node: ts.Node) => {
        const symbol = generator.checker.getSymbolAtLocation(node);
        if (symbol && symbol!.valueDeclaration?.kind === ts.SyntaxKind.ClassDeclaration) {
          const parentText = node.parent.getText();
          externalVariables.push(parentText);
        }

        if (node.getChildCount()) {
          node.forEachChild(visitor);
        }
      };

      try {
        body.forEachChild((node) => {
          if (ts.isExpressionStatement(node) && !ts.isCallExpression(node.expression)) {
            // Do not handle call expressions since it leads to function creation and this action cannot be undone trivially.
            generator.handleNode(node, bodyScope);
          }
        });
      } catch (_) {
        /* Swallow all the errors, we are not really handling anything here, only populating the body scope. */
      }

      ts.forEachChild(body, visitor);

      dummyBlock.eraseFromParent();

      return externalVariables;
    }, generator.symbolTable.currentScope);
  });
}

export function getFunctionScopes(body: ts.ConciseBody, generator: LLVMGenerator) {
  return generator.withInsertBlockKeeping(() => {
    return generator.symbolTable.withLocalScope((_) => {
      const innerScopes: Scope[] = [];

      const dummyBlock = llvm.BasicBlock.create(generator.context, "dummy", generator.currentFunction);
      generator.builder.setInsertionPoint(dummyBlock);

      const visitor = (node: ts.Node) => {
        if (ts.isCallExpression(node)) {
          const functionName = node.expression.getText();
          const knownFunction = generator.symbolTable.currentScope.tryGetThroughParentChain(functionName);

          if (knownFunction) {
            if (isFunctionDeclarationScopeEnvironment(knownFunction)) {
              innerScopes.push((knownFunction as FunctionDeclarationScopeEnvironment).scope);
            }
          }
        }

        if (node.getChildCount()) {
          node.forEachChild(visitor);
        }
      };

      ts.forEachChild(body, visitor);

      dummyBlock.eraseFromParent();
      return innerScopes;
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

    if (ts.isCallExpression(node) && node.expression.getText() === closure) {
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

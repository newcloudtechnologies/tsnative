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
  checkIfFunction,
  checkIfObject,
  isCppPrimitiveType,
  getLLVMValue,
  adjustLLVMValueToType,
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { Environment, FunctionDeclarationScopeEnvironment, isFunctionDeclarationScopeEnvironment, Scope } from "@scope";

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
  const extended = generator.builder.createFPToSI(value, llvm.Type.getInt128Ty(generator.context));
  return generator.builder.createIntCast(extended, target, signed);
}

export function promoteIntegralToFP(
  value: llvm.Value,
  target: llvm.Type,
  signed: boolean,
  generator: LLVMGenerator
): llvm.Value {
  const extended = generator.builder.createIntCast(value, llvm.Type.getInt128Ty(generator.context), signed);
  return generator.builder.createSIToFP(extended, target);
}

export function makeAssignment(left: llvm.Value, right: llvm.Value, generator: LLVMGenerator): llvm.Value {
  const typename: string = getIntegralLLVMTypeTypename(((left as llvm.CallInst).type as llvm.PointerType).elementType);
  if (typename) {
    right = adjustValue(right, typename, generator);
  }

  if (isUnionLLVMValue(left)) {
    const unionType = left.type.isPointerTy() ? left.type : left.type.getPointerTo();
    right = initializeUnion(unionType, right, generator);
  }

  if (!left.type.isPointerTy()) {
    error(`Assignment destination expected to be of PointerType, got '${left.type.toString()}'`);
  }

  if (!left.type.elementType.equals(right.type)) {
    right = adjustLLVMValueToType(right, left.type.elementType, generator);
  }

  generator.builder.createStore(right, left);
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
    const length = generator.builder.createCall(lengthGetter, [value]);
    return generator.builder.createICmpNE(length, llvm.Constant.getNullValue(length.type));
  }

  if (isUnionLLVMValue(value)) {
    if (isUnionWithUndefinedLLVMValue(value) || isUnionWithNullLLVMValue(value)) {
      const marker = generator.builder.createExtractValue(value, [0]);
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

export function createArrayConstructor(
  arrayType: ts.Type,
  expression: ts.ArrayLiteralExpression,
  generator: LLVMGenerator
): { constructor: llvm.Value; allocated: llvm.Value } {
  const symbol = generator.checker.getTypeAtLocation(expression).symbol;
  const valueDeclaration = getAliasedSymbolIfNecessary(symbol, generator.checker).valueDeclaration;
  const constructorDeclaration = (valueDeclaration as ts.ClassDeclaration).members.find(ts.isConstructorDeclaration)!;

  const { qualifiedName } = FunctionMangler.mangle(constructorDeclaration, expression, arrayType, [], generator);

  const parentScope = getFunctionDeclarationScope(constructorDeclaration, arrayType, generator);
  const thisValue = parentScope.thisData!.type;

  const { fn: constructor } = createLLVMFunction(thisValue, [thisValue], qualifiedName, generator.module);
  const allocated = generator.gc.allocate((thisValue as llvm.PointerType).elementType);
  return { constructor, allocated };
}

export function createArrayPush(
  arrayType: ts.Type,
  elementType: ts.Type,
  expression: ts.ArrayLiteralExpression,
  generator: LLVMGenerator
): llvm.Value {
  const pushSymbol = generator.checker.getPropertyOfType(arrayType, "push")!;
  const pushDeclaration = pushSymbol.valueDeclaration;
  let parameterType = getLLVMType(elementType, expression, generator);

  if (parameterType.isPointerTy() && isCppPrimitiveType(parameterType.elementType)) {
    parameterType = parameterType.elementType;
  }

  const scope = getFunctionDeclarationScope(pushDeclaration, arrayType, generator);
  const { qualifiedName } = FunctionMangler.mangle(pushDeclaration, expression, arrayType, [elementType], generator);
  const { fn: push } = createLLVMFunction(
    llvm.Type.getDoubleTy(generator.context),
    [scope.thisData!.type, parameterType],
    qualifiedName,
    generator.module
  );
  return push;
}

export function createArraySubscription(expression: ts.ElementAccessExpression, generator: LLVMGenerator): llvm.Value {
  const arrayType = generator.checker.getTypeAtLocation(expression.expression);
  const elementType = getTypeGenericArguments(arrayType)[0];
  const valueDeclaration = getAliasedSymbolIfNecessary(arrayType.symbol, generator.checker).valueDeclaration;
  const declaration = (valueDeclaration as ts.ClassDeclaration).members.find(ts.isIndexSignatureDeclaration)!;

  const { qualifiedName } = FunctionMangler.mangle(declaration, expression, arrayType, [elementType], generator);

  let retType = getLLVMType(elementType, expression.expression, generator);

  if (retType.isPointerTy() && isCppPrimitiveType(retType.elementType)) {
    retType = retType.elementType;
  }

  const scope = getFunctionDeclarationScope(declaration, arrayType, generator);

  const { fn: subscript } = createLLVMFunction(
    retType.getPointerTo(),
    [scope.thisData!.type, llvm.Type.getDoubleTy(generator.context)],
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

export function getReturnObjectType(functionBody: ts.ConciseBody, generator: LLVMGenerator, env?: Environment) {
  return generator.withInsertBlockKeeping(() => {
    return generator.symbolTable.withLocalScope((bodyScope) => {
      let returnType: llvm.PointerType | undefined;
      const dummyBlock = llvm.BasicBlock.create(generator.context, "dummy", generator.currentFunction);
      generator.builder.setInsertionPoint(dummyBlock);

      if (ts.isBlock(functionBody)) {
        functionBody.forEachChild((node) => {
          if (ts.isReturnStatement(node) && node.expression && ts.isObjectLiteralExpression(node.expression)) {
            const propertyAssignments: ts.ObjectLiteralElementLike[] = node.expression.properties.filter((p) =>
              ts.isPropertyAssignment(p)
            );
            const types = propertyAssignments.map((property) => {
              return generator.handleExpression((property as ts.PropertyAssignment).initializer, env)
                .type as llvm.PointerType;
            });
            const objectType = llvm.StructType.get(generator.context, [
              ...types.map((type) => type as llvm.Type),
            ]).getPointerTo();
            returnType = objectType;
          } else {
            try {
              if (
                ts.isVariableStatement(node) ||
                (ts.isExpressionStatement(node) && !ts.isCallExpression(node.expression))
              ) {
                // Do not handle call expressions since it leads to function creation and this action cannot be undone trivially.
                generator.handleNode(node, bodyScope, env);
              }

              // Ignore empty catch block
              // tslint:disable-next-line
            } catch (_) { }
          }
        });
      } else {
        const handled = generator.handleExpression(functionBody, env);
        returnType = handled.type as llvm.PointerType;
      }

      dummyBlock.eraseFromParent();
      return returnType;
    }, generator.symbolTable.currentScope);
  });
}

export function getNestedFunctionType(functionBody: ts.ConciseBody, generator: LLVMGenerator, env?: Environment) {
  let closureType: llvm.Type;
  return generator.withInsertBlockKeeping(() => {
    return generator.symbolTable.withLocalScope((bodyScope) => {
      const dummyBlock = llvm.BasicBlock.create(generator.context, "dummy", generator.currentFunction);
      generator.builder.setInsertionPoint(dummyBlock);

      if (ts.isBlock(functionBody)) {
        functionBody.forEachChild((node) => {
          if (ts.isReturnStatement(node) && node.expression) {
            // @todo: check if closure returns!
            const closure = generator.handleExpression(node.expression, env);
            closureType = closure.type;
          } else {
            if (
              ts.isVariableStatement(node) ||
              (ts.isExpressionStatement(node) && !ts.isCallExpression(node.expression))
            ) {
              // Do not handle call expressions since it leads to function creation and this action cannot be undone trivially.
              generator.handleNode(node, bodyScope, env);
            }
          }
        });
      } else {
        error("Function context deducing for arrow functions without block body is not supported");
      }

      dummyBlock.eraseFromParent();
      return closureType;
    }, generator.symbolTable.currentScope);
  });
}

export function getLLVMReturnType(
  tsReturnType: ts.Type,
  expression: ts.Expression,
  functionBody: ts.ConciseBody | undefined,
  generator: LLVMGenerator,
  env?: Environment
) {
  let llvmReturnType: llvm.Type;
  if (checkIfFunction(tsReturnType)) {
    llvmReturnType = getNestedFunctionType(functionBody!, generator, env);
  } else if (checkIfObject(tsReturnType)) {
    const objectType = getReturnObjectType(functionBody!, generator, env);
    llvmReturnType = objectType || getLLVMType(tsReturnType, expression, generator);
  } else {
    llvmReturnType = getLLVMType(tsReturnType, expression, generator);
  }

  if (llvmReturnType.isVoidTy()) {
    return llvmReturnType;
  }

  return llvmReturnType.isPointerTy() ? llvmReturnType : llvmReturnType.getPointerTo();
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

        if (
          ts.isIdentifier(node) &&
          !ts.isPropertyAssignment(node.parent) &&
          !bodyScope.map.get(nodeText) &&
          !externalVariables.includes(nodeText)
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
              ...getFunctionEnvironmentVariables(functionDeclaration.body, innerFunctionSignature!, generator)
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
      externalVariables.push(...signature.getParameters().map((p) => p.escapedName.toString()));
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

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
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import { Scope } from "@scope";

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
  if (left instanceof llvm.Argument) {
    const alloca = generator.withLocalBuilder(() => {
      return generator.builder.createAlloca(left.type, undefined, left.name + ".alloca");
    });
    generator.symbolTable.currentScope.overwrite(left.name, alloca);
    left = alloca;
  }

  const typename: string = getIntegralLLVMTypeTypename((left as llvm.AllocaInst).allocatedType);
  if (typename) {
    right = adjustValue(right, typename, generator);
  }

  generator.builder.createStore(right, left);
  return right;
}

export function makeBoolean(value: llvm.Value, expression: ts.Expression, generator: LLVMGenerator): llvm.Value {
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

  return error(`Unable to convert operand of type ${value.type} to boolean value`);
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

  return error("Invalid types to handle with conversion");
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
    return error(`Unhandled function declaration parent kind '${ts.SyntaxKind[parent.kind]}'`);
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

  const { qualifiedName } = FunctionMangler.mangle(
    constructorDeclaration,
    expression,
    arrayType,
    [],
    generator.checker
  );

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
  const parameterType = getLLVMType(elementType, expression, generator);
  const scope = getFunctionDeclarationScope(pushDeclaration, arrayType, generator);
  const { qualifiedName } = FunctionMangler.mangle(
    pushDeclaration,
    expression,
    arrayType,
    [elementType],
    generator.checker
  );
  const { fn: push } = createLLVMFunction(
    llvm.Type.getVoidTy(generator.context),
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

  const { qualifiedName } = FunctionMangler.mangle(
    declaration,
    expression,
    arrayType,
    [elementType],
    generator.checker
  );

  const retType = getLLVMType(elementType, expression.expression, generator);
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

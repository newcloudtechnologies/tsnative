import { getBuiltin } from "@builtins";
import { adjustValue, getIntegralLLVMTypeTypename, isSigned } from "@cpp";
import { LLVMGenerator } from "@generator";
import { TypeMangler } from "@mangling";
import { Scope } from "@scope";
import {
  createEntryBlockAlloca,
  error,
  getAliasedSymbolIfNecessary,
  getStructType,
  getTypeArguments,
  isLLVMString
} from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export function castToInt32AndBack(
  values: llvm.Value[],
  generator: LLVMGenerator,
  emit: (ints: llvm.Value[]) => llvm.Value
): llvm.Value {
  const ints = values.map(value => generator.builder.createFPToSI(value, llvm.Type.getInt32Ty(generator.context)));
  return generator.builder.createSIToFP(emit(ints), llvm.Type.getDoubleTy(generator.context));
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

export function emitAssignment(left: llvm.Value, right: llvm.Value, generator: LLVMGenerator): llvm.Value {
  if (left instanceof llvm.Argument) {
    const alloca = createEntryBlockAlloca(left.type, left.name + ".alloca", generator);
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

export function emitAsBoolean(value: llvm.Value, generator: LLVMGenerator): llvm.Value {
  if (value.type.isDoubleTy()) {
    return generator.builder.createFCmpONE(value, llvm.Constant.getNullValue(value.type));
  }

  if (value.type.isIntegerTy()) {
    return generator.builder.createICmpNE(value, llvm.Constant.getNullValue(value.type));
  }

  if (isLLVMString(value.type)) {
    const strlen = getBuiltin("string__length", generator.context, generator.module);
    const length = generator.builder.createCall(strlen, [value]);
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
  Promotion
}

// @todo: refactor this
export function emitBinaryWithConversion(
  lhsExpression: ts.Expression,
  rhsExpression: ts.Expression,
  lhsValue: llvm.Value,
  rhsValue: llvm.Value,
  conversion: Conversion,
  emitter: (l: llvm.Value, r: llvm.Value) => llvm.Value,
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
    return emitter.apply(generator.builder, args);
  }

  if (lhsValue.type.isDoubleTy() && rhsValue.type.isIntegerTy()) {
    const signed = isSigned(rhsExpression, generator);
    const destinationType = conversion === Conversion.Narrowing ? rhsValue.type : lhsValue.type;
    let convertedArg = conversion === Conversion.Narrowing ? lhsValue : rhsValue;
    const untouchedArg = conversion === Conversion.Narrowing ? rhsValue : lhsValue;
    convertedArg = convertor(convertedArg, destinationType, signed, generator);
    const args: [llvm.Value, llvm.Value] =
      conversion === Conversion.Narrowing ? [convertedArg, untouchedArg] : [untouchedArg, convertedArg];
    return emitter.apply(generator.builder, args);
  }

  return error("Invalid types to emit with conversion");
}

export function getMethod(
  expression: ts.ArrayLiteralExpression | ts.ElementAccessExpression | ts.Expression,
  name: string,
  argumentTypes: ts.Type[],
  generator: LLVMGenerator
) {
  const thisType = generator.checker.getTypeAtLocation(
    ts.isElementAccessExpression(expression) ? expression.expression : expression
  );
  const typeDeclaration = getAliasedSymbolIfNecessary(thisType.symbol, generator.checker).valueDeclaration;

  if (!ts.isClassDeclaration(typeDeclaration)) {
    return error("Cannot get method of non-class type");
  }

  const mangledTypename: string = TypeMangler.mangle(thisType, generator.checker, typeDeclaration);
  const preExisting = generator.module.getTypeByName(mangledTypename);
  if (!preExisting) {
    const type = getStructType(thisType as ts.ObjectType, expression, generator);
    const scope = new Scope(mangledTypename, {
      declaration: typeDeclaration,
      type
    });
    generator.symbolTable.currentScope.set(mangledTypename, scope);

    for (const method of typeDeclaration.members.filter(member => !ts.isPropertyDeclaration(member))) {
      generator.emitNode(method, scope);
    }
  }

  // TODO: Use correct scope.
  generator.emitter.class.emitClassDeclaration(
    typeDeclaration,
    getTypeArguments(thisType),
    generator.symbolTable.globalScope,
    generator
  );
  let declaration: ts.Declaration | undefined;

  switch (name) {
    case "constructor":
      declaration = typeDeclaration.members.find(ts.isConstructorDeclaration);
      break;
    case "subscript":
      declaration = typeDeclaration.members.find(ts.isIndexSignatureDeclaration);
      break;
    default:
      const propertySymbol = generator.checker.getPropertyOfType(thisType, name)!;
      declaration = propertySymbol.valueDeclaration;
      break;
  }

  if (!declaration) {
    return error("Member declaration not found");
  }

  return generator.emitter.func.getOrEmitFunctionForCall(declaration, expression, thisType, argumentTypes, generator);
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

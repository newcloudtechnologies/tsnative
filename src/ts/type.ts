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

import {
  flatten,
  checkIfProperty,
  error,
  getDeclarationNamespace,
  getSyntheticBody,
  unwrapPointerType,
  checkIfHasVTable,
} from "@utils";
import { cloneDeep } from "lodash";
import { TypeChecker } from "./typechecker";
import * as ts from "typescript";
import * as llvm from "llvm-node";

export class Type {
  private type: ts.Type;
  private readonly originType: ts.Type;
  private readonly checker: TypeChecker;

  constructor(type: ts.Type, checker: TypeChecker) {
    this.type = type;
    this.originType = type;
    this.checker = checker;

    if (this.toString() !== "this") {
      this.tryResolveGenericTypeIfNecessary();
    }
  }

  originTypename() {
    return this.checker.unwrap().typeToString(this.originType);
  }

  isSymbolless() {
    return !this.type.getSymbol();
  }

  private isAny() {
    return this.toString() === "any";
  }

  private tryResolveGenericTypeIfNecessary() {
    if (this.isAny()) {
      return this;
    }

    if (this.isSupported()) {
      return this;
    }

    if (this.type.isUnionOrIntersection()) {
      const typeClone = cloneDeep(this.type);
      typeClone.types = typeClone.types
        .map((type) => new Type(type, this.checker))
        .map((type) => {
          if (type.isUnionOrIntersection()) {
            return type.tryResolveGenericTypeIfNecessary().unwrap();
          }
          if (!type.isSupported()) {
            return this.checker.generator.symbolTable.currentScope.typeMapper.get(type.toString()).unwrap();
          } else {
            return type.unwrap();
          }
        });

      this.type = typeClone;
    } else {
      try {
        this.type = this.checker.generator.symbolTable.currentScope.typeMapper.get(this.toString()).unwrap();

        // Ignore empty catch block
        // tslint:disable-next-line
      } catch (_) { }
    }

    return this;
  }

  getSymbol() {
    let symbol = this.type.getSymbol();
    if (!symbol) {
      error(`No symbol found for type '${this.toString()}'`);
    }

    if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
      symbol = this.checker.getAliasedSymbol(symbol);
    }

    return symbol;
  }

  getTypename() {
    return this.isPrimitive() ? this.checker.getBaseTypeOfLiteralType(this.type).toString() : this.getSymbol().name;
  }

  getNamespace() {
    if (this.isSymbolless()) {
      return "";
    }

    const symbol = this.getSymbol();
    return getDeclarationNamespace(symbol.valueDeclaration || symbol.declarations[0]).join("::");
  }

  getTypeGenericArguments() {
    if (this.type.flags & ts.TypeFlags.Object) {
      if ((this.type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
        return (this.type as ts.TypeReference).typeArguments?.map((type) => new Type(type, this.checker)) || [];
      }
    }

    return [];
  }

  isArray() {
    if (this.isSymbolless()) {
      return false;
    }

    return Boolean(this.getSymbol().name === "Array");
  }

  isObject() {
    if (this.isSymbolless()) {
      return false;
    }

    return Boolean(this.type.flags & ts.TypeFlags.Object) && !this.isFunction();
  }

  isClassOrInterface() {
    return this.type.isClassOrInterface();
  }

  isUnionOrIntersection(): this is ts.UnionOrIntersectionType {
    return this.isUnion() || this.isIntersection();
  }

  isUnion(): this is ts.UnionType {
    return this.type.isUnion() && (this.type.flags & ts.TypeFlags.BooleanLike) === 0;
  }

  isIntersection(): this is ts.IntersectionType {
    return this.type.isIntersection();
  }

  isFunction() {
    if (this.isSymbolless()) {
      return false;
    }

    return (
      Boolean(this.getSymbol().flags & ts.SymbolFlags.Function) ||
      Boolean(this.getSymbol().members?.get(ts.InternalSymbolName.Call))
    );
  }

  isUndefined() {
    return this.toString() === "undefined";
  }

  isNull() {
    return this.toString() === "null";
  }

  isString() {
    return Boolean(this.type.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral));
  }

  isBoolean() {
    return Boolean(this.type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral));
  }

  isNumber() {
    return Boolean(this.type.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral));
  }

  isEnum() {
    return Boolean(this.type.flags & ts.TypeFlags.Enum);
  }

  isVoid() {
    return Boolean(this.type.flags & ts.TypeFlags.Void);
  }

  isTSObjectType() {
    if (this.isUnionOrIntersection()) {
      return true;
    }

    if (this.isSymbolless()) {
      return false;
    }

    // @todo: valueDeclaration is optional in fact: https://github.com/microsoft/TypeScript/pull/37881W
    if (!this.getSymbol().declarations[0]) {
      return false;
    }

    if (this.getSymbol().declarations[0].getSourceFile().isDeclarationFile) {
      // @todo
      return false;
    }

    return this.isObject() && !this.isArray() && !this.isString();
  }

  isCppIntegralType() {
    switch (this.toString()) {
      case "int8_t":
      case "int16_t":
      case "int32_t":
      case "int64_t":

      case "uint8_t":
      case "uint16_t":
      case "uint32_t":
      case "uint64_t":
        return true;
      default:
        return false;
    }
  }

  isPrimitive() {
    return (
      this.isNumber() ||
      this.isString() ||
      this.isBoolean() ||
      this.isUndefined() ||
      this.isNull() ||
      this.isVoid() ||
      this.isCppIntegralType() ||
      this.isEnum()
    );
  }

  isSupported() {
    return this.isPrimitive() || this.isArray() || this.isObject() || this.isFunction() || this.isUnionOrIntersection();
  }

  isTypeParameter() {
    return Boolean(this.type.flags & ts.TypeFlags.TypeParameter);
  }

  getCallSignatures() {
    return this.type.getCallSignatures();
  }

  getProperties(): ts.Symbol[] {
    if (this.isSymbolless()) {
      return this.checker.getPropertiesOfType(this.type).filter(checkIfProperty);
    }

    const symbol = this.getSymbol();

    const properties: ts.Symbol[] = [];
    if (
      symbol.valueDeclaration &&
      ts.isClassDeclaration(symbol.valueDeclaration) &&
      symbol.valueDeclaration.heritageClauses
    ) {
      const inheritedProps = flatten(
        symbol.valueDeclaration.heritageClauses.map((clause) => {
          const clauseProps = clause.types.map((expressionWithTypeArgs) => {
            return this.checker.getTypeAtLocation(expressionWithTypeArgs).getProperties();
          });

          return clauseProps;
        })
      );

      properties.push(...flatten(inheritedProps));
    }

    properties.push(...this.checker.getPropertiesOfType(this.type).filter(checkIfProperty));
    return properties;
  }

  getProperty(name: string) {
    const property = this.checker.unwrap().getPropertyOfType(this.type, name);
    if (!property) {
      error(`No property '${name}' found in '${this.toString()}'`);
    }

    return property;
  }

  indexOfProperty(name: string): number {
    const index = this.getProperties().findIndex((property) => property.name === name);
    if (index < 0) {
      error(`No property '${name}' on type '${this.toString()}'`);
    }
    return index;
  }

  getApparentType() {
    return new Type(this.checker.unwrap().getApparentType(this.type), this.checker);
  }

  toString() {
    if (this.isUnionOrIntersection()) {
      const getElementTypeName = (elementType: Type): string => {
        if (elementType.isUnionOrIntersection()) {
          return (elementType.unwrap() as ts.UnionOrIntersectionType).types
            .map((t) => new Type(t, this.checker))
            .map((t) => getElementTypeName(t))
            .join(".");
        }
        return elementType.toString();
      };

      return this.types
        .map((t) => getElementTypeName(t))
        .join(".")
        .concat(this.type.isUnion() ? ".union" : ".intersection");
    }

    return this.checker.unwrap().typeToString(this.type);
  }

  get types() {
    if (this.type.isUnionOrIntersection()) {
      return this.type.types.map((type) => new Type(type, this.checker));
    }

    return [];
  }

  mangle(): string {
    if (this.isArray()) {
      const types = this.getTypeGenericArguments()
        .map((typeArgument) => typeArgument.toString())
        .join("_");
      return "Array__" + types + "__class";
    }

    if (this.isString()) {
      return "string";
    }

    let suffix = "";

    if (!this.isSymbolless()) {
      let declaration = this.getSymbol().declarations[0];
      if (declaration) {
        if (
          ts.isConstructorDeclaration(declaration) ||
          ts.isMethodDeclaration(declaration) ||
          ts.isGetAccessorDeclaration(declaration) ||
          ts.isSetAccessorDeclaration(declaration)
        ) {
          declaration = declaration.parent;
        }

        if (ts.isInterfaceDeclaration(declaration)) {
          suffix = "interface";
        } else if (ts.isClassDeclaration(declaration)) {
          suffix = "class";
        }
      }
    }

    const typeArguments = this.getTypeGenericArguments().map((typeArgument) => typeArgument.mangle());
    return [this.getTypename(), ...typeArguments].concat(suffix || []).join("__");
  }

  getObjectPropsLLVMTypesNames(): { type: llvm.Type; name: string }[] {
    if (this.isUnionOrIntersection()) {
      return flatten(
        this.types.map((subtype) => {
          return subtype.getObjectPropsLLVMTypesNames();
        })
      ).filter((value, index, array) => array.findIndex((v) => v.name === value.name) === index);
    }

    const getTypeAndNameFromProperty = (property: ts.Symbol): { type: llvm.Type; name: string } => {
      const declaration = property.declarations[0];
      const tsType = this.checker.getTypeAtLocation(declaration);
      const llvmType = tsType.getLLVMType();
      const valueType = property.valueDeclaration?.decorators?.some(
        (decorator) => decorator.getText() === "@ValueType"
      );

      return { type: valueType ? unwrapPointerType(llvmType) : llvmType, name: property.name };
    };

    const symbol = this.getSymbol();

    const properties: { type: llvm.Type; name: string }[] = [];
    if (
      symbol.valueDeclaration &&
      ts.isClassDeclaration(symbol.valueDeclaration) &&
      symbol.valueDeclaration.heritageClauses
    ) {
      const inheritedProps = flatten(
        symbol.valueDeclaration.heritageClauses.map((clause) => {
          const clauseProps = clause.types
            .map((expressionWithTypeArgs) => this.checker.getTypeAtLocation(expressionWithTypeArgs))
            .map((t) => {
              return t.getProperties().map(getTypeAndNameFromProperty);
            });

          return flatten(clauseProps);
        })
      );

      properties.push(...inheritedProps);
    }

    properties.push(
      ...this.getProperties()
        .map(getTypeAndNameFromProperty)
        .filter((property) => !properties.find((p) => property.name === p.name))
    );

    return properties;
  }

  getIntegralType() {
    switch (this.toString()) {
      case "int8_t":
      case "uint8_t":
        return llvm.Type.getInt8Ty(this.checker.generator.context);
      case "int16_t":
      case "uint16_t":
        return llvm.Type.getInt16Ty(this.checker.generator.context);
      case "int32_t":
      case "uint32_t":
        return llvm.Type.getInt32Ty(this.checker.generator.context);
      case "int64_t":
      case "uint64_t":
        return llvm.Type.getInt64Ty(this.checker.generator.context);
      default:
        error("Expected integral type");
    }
  }

  // @todo: tslint will warn 'no-unused-variables' if this method is marked as private
  protected getStructType() {
    const { context, module } = this.checker.generator;
    const elements = this.getObjectPropsLLVMTypesNames();

    let structType: llvm.StructType | null;
    const declaration =
      this.getSymbol()?.declarations.find(ts.isClassDeclaration) ||
      this.getSymbol()?.declarations.find(ts.isInterfaceDeclaration);

    if (declaration && (ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration))) {
      const namespace = getDeclarationNamespace(declaration);
      const name = ts.isClassDeclaration(declaration) ? namespace.concat(this.mangle()).join("_") : this.toString();
      structType = module.getTypeByName(name);
      if (!structType) {
        structType = llvm.StructType.create(context, name);
        const props = this.getProperties().map((symbol) => symbol.name);
        this.checker.generator.meta.registerObjectMeta(name, structType, props);

        const knownSize = this.checker.generator.sizeOf.getByName(name);
        if (knownSize) {
          const syntheticBody = getSyntheticBody(knownSize, context);
          structType.setBody(syntheticBody);
        } else {
          const structElements = elements.map((element) => element.type);
          if (ts.isClassDeclaration(declaration) && checkIfHasVTable(declaration)) {
            // vptr
            structElements.unshift(llvm.Type.getInt32Ty(this.checker.generator.context).getPointerTo());
          }
          structType.setBody(structElements);
        }

        this.checker.generator.meta.registerStructMeta(
          name,
          structType,
          elements.map((element) => element.name)
        );
      }
    } else {
      structType = llvm.StructType.get(
        context,
        elements.map((element) => element.type)
      );
    }

    return structType;
  }

  getLLVMType(): llvm.Type {
    if (this.isIntersection()) {
      return this.checker.generator.types.intersection.getStructType(this).getPointerTo();
    }

    if (this.isUnion()) {
      return this.checker.generator.types.union.getStructType(this).getPointerTo();
    }

    if (this.isCppIntegralType()) {
      return this.getIntegralType()!;
    }

    if (this.isEnum()) {
      return llvm.Type.getInt32PtrTy(this.checker.generator.context);
    }

    if (this.isBoolean()) {
      return llvm.Type.getInt1PtrTy(this.checker.generator.context);
    }

    if (this.isNumber()) {
      return llvm.Type.getDoublePtrTy(this.checker.generator.context);
    }

    if (this.isString()) {
      return this.checker.generator.builtinString.getLLVMType();
    }

    if (this.isVoid()) {
      return llvm.Type.getVoidTy(this.checker.generator.context);
    }

    if (this.isFunction()) {
      const symbol = this.getSymbol();
      const declaration = symbol.declarations[0];
      if (!declaration) {
        error("Function declaration not found");
      }

      if (this.checker.generator.types.closure.canCreateLazyClosure(declaration)) {
        const signature = this.checker.getSignatureFromDeclaration(declaration as ts.SignatureDeclaration);
        if (!signature) {
          error("Function signature not found");
        }

        const withFunargs = signature.parameters.some((parameter) => {
          const symbolType = this.checker.getTypeOfSymbolAtLocation(parameter, declaration);
          return symbolType.isFunction();
        });

        if (withFunargs) {
          return this.checker.generator.types.lazyClosure.type;
        }
      }

      return this.checker.generator.builtinTSClosure.getLLVMType();
    }

    if (this.isUndefined()) {
      return llvm.Type.getInt8Ty(this.checker.generator.context);
    }

    if (this.isObject()) {
      return this.getStructType().getPointerTo();
    }

    if (this.isNull()) {
      return llvm.Type.getInt8Ty(this.checker.generator.context);
    }

    error(`Unhandled type: '${this.toString()}'`);
  }

  isDeclared() {
    return Boolean(this.checker.generator.module.getTypeByName(this.mangle()));
  }

  toCppType(): string {
    if (this.isFunction()) {
      return "TSClosure*";
    }
    if (this.isArray()) {
      const elementType = this.getTypeGenericArguments()[0]!;
      let cppElementType = elementType.toCppType();
      if (elementType.isArray() || elementType.isString() || elementType.isObject()) {
        cppElementType += "*";
      }

      if (elementType.isClassOrInterface()) {
        cppElementType = "void*";
      }
      return `Array<${cppElementType}>`;
    }

    let typename = this.toString();

    if (this.isNumber()) {
      typename = "number";
    } else if (this.isString()) {
      typename = "string";
    } else if (this.isUnionOrIntersection()) {
      typename = "void*";
    } else if (!this.isSymbolless()) {
      const symbol = this.getSymbol();
      const declaration = symbol.declarations[0];
      if (ts.isClassDeclaration(declaration)) {
        const ambientDeclaration = !declaration.members.find(ts.isConstructorDeclaration)?.body;
        if (!ambientDeclaration) {
          typename = "void";
        }
      }
    }

    const getInt64Type = () => {
      switch (process.platform) {
        case "win32":
          return "long long";
        default:
          return "long";
      }
    };

    const getUInt64Type = () => `unsigned ${getInt64Type()}`;

    switch (typename) {
      case "String": // @todo
        return "string";
      case "Number":
      case "number":
        return "double";
      case "Boolean":
      case "boolean":
      case "true":
      case "false":
        return "bool";
      case "int8_t":
        return "signed char";
      case "int16_t":
        return "short";
      case "int32_t":
        return "int";
      case "int64_t":
        return getInt64Type();
      case "uint8_t":
        return "unsigned char";
      case "uint16_t":
        return "unsigned short";
      case "uint32_t":
        return "unsigned int";
      case "uint64_t":
        return getUInt64Type();
      default:
        if (!typename) {
          error(`Type '${this.toString()}' is not mapped to C++ type`);
        }
        return typename;
    }
  }

  unwrap() {
    return this.type;
  }
}

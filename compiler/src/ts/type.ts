/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { cloneDeep, flatten } from "lodash";
import { TypeChecker } from "./typechecker";
import * as ts from "typescript";
import { LLVMType } from "../llvm/type";
import { Declaration } from "../ts/declaration";

import { TSSymbol } from "./symbol";

export class TSType {
  private type: ts.Type;
  private readonly originType: ts.Type;
  private readonly checker: TypeChecker;
  private readonly typeString: string;

  private constructor(type: ts.Type, checker: TypeChecker) {
    this.type = type;
    this.originType = type;
    this.checker = checker;

    this.typeString = checker.unwrap().typeToString(this.type);

    if (this.typeString !== "this") {
      this.tryResolveGenericTypeIfNecessary();
    }
  }

  static create(type: ts.Type, checker: TypeChecker) {
    return new TSType(type, checker);
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
        .map((type) => TSType.create(type, this.checker))
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

    // Forcely map tuples to custom implementation of Tuple.
    if (this.isTuple()) {
      // ts.TypeChecker.getSymbol won't return symbol for declaration placed in *.d.ts (https://github.com/Microsoft/TypeScript/issues/5218)
      // Actually 'symbol' property exists, so try hard to get it.
      symbol = (this.checker.generator.ts.tuple.getDeclaration().unwrapped as any).symbol;
    } else if (this.isString()) {
      symbol = (this.checker.generator.ts.str.getDeclaration().unwrapped as any).symbol;
    }

    if (!symbol) {
      throw new Error(`No symbol found for type '${this.toString()}'`);
    }

    if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
      return this.checker.getAliasedSymbol(TSSymbol.create(symbol, this.checker.generator));
    }

    return TSSymbol.create(symbol, this.checker.generator);
  }

  getTypename() {
    if (this.isSymbolless()) {
      return this.toString();
    }

    const symbol = this.getSymbol();
    const declaration = symbol.valueDeclaration || symbol.declarations[0];

    if (declaration.isTypeLiteral()) {
      const declarationParent = declaration.parent;
      if (ts.isTypeAliasDeclaration(declarationParent)) {
        return declarationParent.name.escapedText.toString();
      }
    }

    return symbol.name;
  }

  getNamespace() {
    if (this.isSymbolless()) {
      return "";
    }

    const symbol = this.getSymbol();
    return (symbol.valueDeclaration || symbol.declarations[0]).getNamespace().join("::");
  }

  getTypeGenericArguments() {
    if (this.type.flags & ts.TypeFlags.Object) {
      if ((this.type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
        return (
          (this.type as ts.TypeReference).typeArguments
            ?.map((type) => TSType.create(type, this.checker))
            .filter((type) => type.toString() !== "this") || []
        );
      }
    }

    return [];
  }

  isNever() {
    return this.toString() === "never";
  }

  isArray() {
    if (this.isSymbolless()) {
      return false;
    }

    return Boolean(this.getSymbol().name === "Array");
  }

  isTuple() {
    const typeNode = this.checker.unwrap().typeToTypeNode(this.type);
    return Boolean(typeNode && ts.isTupleTypeNode(typeNode)) || this.toString() === "Tuple";
  }

  isMap() {
    if (this.isSymbolless()) {
      return false;
    }

    return Boolean(this.getSymbol().name === "Map");
  }

  isSet() {
    if (this.isSymbolless()) {
      return false;
    }

    return Boolean(this.getSymbol().name === "Set");
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

  isClass() {
    if (this.isSymbolless()) {
      return false;
    }

    const declaration = this.getSymbol().valueDeclaration;
    if (!declaration) {
      return false;
    }

    return declaration.isClass();
  }

  isAmbient() {
    if (this.isSymbolless()) {
      return false;
    }

    const declaration = this.getSymbol().valueDeclaration;
    if (!declaration) {
      return false;
    }

    return declaration.isAmbient();
  }

  isInterface() {
    if (this.isSymbolless()) {
      return false;
    }

    const symbol = this.getSymbol();
    const declaration = symbol.valueDeclaration || symbol.declarations[0];
    if (!declaration) {
      return false;
    }

    return declaration.isInterface();
  }

  isTypeLiteral() {
    if (this.isSymbolless()) {
      return false;
    }

    const symbol = this.getSymbol();
    const declaration = symbol.valueDeclaration || symbol.declarations[0];
    if (!declaration) {
      return false;
    }

    return declaration.isTypeLiteral();
  }

  isUnionOrIntersection(): this is ts.UnionOrIntersectionType {
    return this.isUnion() || this.isIntersection();
  }

  isUnion(): this is ts.UnionType {
    return this.type.isUnion() && !this.isBoolean() && !this.isEnum();
  }

  isOptionalUnion() {
    return this.isUnion() && this.types.some((type) => type.isUndefined() || type.isNull());
  }

  isIntersection(): this is ts.IntersectionType {
    return this.type.isIntersection();
  }

  isNamespace() {
    if (this.isSymbolless()) {
      return false;
    }

    const symbol = this.getSymbol();

    return Boolean(symbol.flags & ts.SymbolFlags.Namespace);
  }

  isFunction() {
    if (this.isSymbolless()) {
      return false;
    }

    const symbol = this.getSymbol();

    return (
      Boolean(symbol.flags & ts.SymbolFlags.Function) ||
      Boolean(symbol.flags & ts.SymbolFlags.Method) ||
      Boolean(symbol.members?.get(ts.InternalSymbolName.Call))
    );
  }

  isClosure() {
    return this.toString() === "TSClosure";
  }

  isUndefined() {
    return this.toString() === "undefined" || this.toString() === "Undefined";
  }

  isNull() {
    return this.toString() === "null" || this.toString() === "Null";
  }

  isString() {
    return Boolean(this.type.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral)) || this.toString() === "String";
  }

  isBoolean() {
    return Boolean(this.type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral));
  }

  isNumber() {
    return Boolean(this.type.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral)) || this.toString() === "Number";
  }

  isEnum() {
    return Boolean(this.type.flags & (ts.TypeFlags.Enum | ts.TypeFlags.EnumLiteral | ts.TypeFlags.EnumLike));
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

  isPrimitive() {
    return (
      this.isNumber() ||
      this.isString() ||
      this.isBoolean() ||
      this.isUndefined() ||
      this.isNull() ||
      this.isVoid() ||
      this.isEnum()
    );
  }

  isSupported() {
    return (
      this.isPrimitive() ||
      this.isArray() ||
      this.isTuple() ||
      this.isObject() ||
      this.isFunction() ||
      this.isUnionOrIntersection()
    );
  }

  isTypeParameter() {
    if (this.isThisType()) {
      // For some reason type flags for 'this' includes ts.TypeFlags.TypeParameter (TS 3.9.10)
      // Typically this method is used to check if type have to be resolved using Scope's TypeMapper (a map 'string: TSType' where a key is a generic typename).
      // Without this guard the check will fail with error: 'Generic type 'this' is not registered'.
      return false;
    }

    return Boolean(this.type.flags & ts.TypeFlags.TypeParameter);
  }

  isThisType() {
    return this.toString() === "this";
  }

  isUpcastableTo(type: TSType) {
    if (!this.isClassOrInterface() && !this.isThisType()) {
      return false;
    }

    if (!type.isClassOrInterface() && !type.isThisType()) {
      return false;
    }

    const symbol = this.getSymbol();
    const declaration = symbol.valueDeclaration;

    if (!declaration) {
      return false;
    }

    const heritageClauses = declaration.heritageClauses;
    if (!heritageClauses) {
      return false;
    }

    const targetSymbol = type.getSymbol();

    // Consider type is upcastable to other if it has the other's symbol among types in 'extends' clause (recursively).
    const isUpcastable =
      declaration.getBases().findIndex((base) => {
        return base.type.getSymbol().unwrapped === targetSymbol.unwrapped;
      }) !== -1;

    return isUpcastable;
  }

  getCallSignatures() {
    return this.type.getCallSignatures();
  }

  getProperties(): TSSymbol[] {
    if (this.isSymbolless()) {
      return this.checker.getPropertiesOfType(this.type).filter((symbol) => symbol.isProperty());
    }

    const symbol = this.getSymbol();

    const properties: TSSymbol[] = [];
    if (symbol.valueDeclaration && symbol.valueDeclaration.isClass() && symbol.valueDeclaration.heritageClauses) {
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

    properties.push(
      ...this.checker
        .getPropertiesOfType(this.type)
        .filter((property) => property.isProperty() || property.isOptionalMethod())
    );

    return properties;
  }

  getProperty(name: string) {
    return this.checker.getPropertyOfType(this.type, name);
  }

  getApparentType() {
    return TSType.create(this.checker.unwrap().getApparentType(this.type), this.checker);
  }

  toString() {
    return this.typeString;
  }

  get types() {
    if (this.type.isUnionOrIntersection()) {
      return this.type.types
        .map((type) => TSType.create(type, this.checker))
        .filter(
          (type, index, array) => !(type.isBoolean() && index + 1 < array.length && array[index + 1].isBoolean())
        );
    }

    return [];
  }

  mangle(): string {
    if (this.isArray()) {
      const genericArgs = this.getTypeGenericArguments();

      if (genericArgs.length === 0) {
        throw new Error(`Mangling: failed to get generic arguments for Array. Type: '${this.toString()}'`);
      }

      const types = genericArgs.map((typeArgument) => typeArgument.toString()).join("_");
      return "Array__" + types + "__class";
    }

    let suffix = "";

    let typeArguments: string[] = [];

    if (!this.isSymbolless()) {
      const symbol = this.getSymbol();
      let declaration = symbol.valueDeclaration || symbol.declarations[0];
      if (declaration) {
        if (
          declaration.isConstructor() ||
          declaration.isMethod() ||
          declaration.isGetAccessor() ||
          declaration.isSetAccessor()
        ) {
          declaration = Declaration.create(declaration.parent as ts.ClassDeclaration, this.checker.generator);
        }

        if (declaration.isInterface()) {
          suffix = "interface";
          suffix += "__" + declaration.unique;
        } else if (declaration.isClass()) {
          suffix = "class";
          suffix += "__" + declaration.unique;
        } else if (declaration.isTypeLiteral()) {
          suffix += this.checker.generator.internalNames.TypeLiteral + declaration.unique;
        }

        if (declaration.isClass() && !declaration.isAmbient() && declaration.typeParameters) {
          typeArguments = declaration.typeParameters.map((typeParameter) => {
            let type = this.checker.getTypeAtLocation(typeParameter);
            if (!type.isSupported()) {
              const typeMapper = this.checker.generator.meta.getClassTypeMapper(declaration);
              type = typeMapper.get(type.toString());
            }
            return type.mangle();
          });
        }
      }
    }

    if (!typeArguments) {
      typeArguments = this.getTypeGenericArguments().map((typeArgument) => typeArgument.mangle());
    }
    return [this.getTypename(), ...typeArguments].concat(suffix || []).join("__");
  }

  getLLVMReturnType() {
    const llvmReturnType = this.getLLVMType();

    if (llvmReturnType.isVoid()) {
      return this.checker.generator.ts.undef.getLLVMType();
    }

    return llvmReturnType.ensurePointer();
  }

  getLLVMType(): LLVMType {
    if (this.isIntersection()) {
      return this.checker.generator.ts.obj.getLLVMType();
    }

    if (this.isUnion()) {
      return this.checker.generator.ts.union.getLLVMType();
    }

    if (this.isEnum()) {
      return this.getEnumElementType();
    }

    if (this.isBoolean()) {
      return this.checker.generator.builtinBoolean.getLLVMType();
    }

    if (this.isNumber()) {
      return this.checker.generator.builtinNumber.getLLVMType();
    }

    if (this.isString()) {
      return this.checker.generator.ts.str.getLLVMType();
    }

    if (this.isVoid()) {
      return LLVMType.getVoidType(this.checker.generator);
    }

    if (this.isClosure()) {
      return this.checker.generator.tsclosure.getLLVMType();
    }

    if (this.isFunction()) {
      if (!this.isSymbolless()) {
        const valueDeclaration = this.getSymbol().valueDeclaration;

        if (valueDeclaration?.typeParameters) {
          return this.checker.generator.tsclosure.lazyClosure.getLLVMType();
        }
      }
      return this.checker.generator.tsclosure.getLLVMType();
    }

    if (this.isUndefined()) {
      return this.checker.generator.ts.undef.getLLVMType();
    }

    if (this.isNull()) {
      return this.checker.generator.ts.null.getLLVMType();
    }

    if (this.isTuple()) {
      return this.checker.generator.ts.tuple.getLLVMType();
    }

    if (this.isArray()) {
      return this.checker.generator.ts.array.getLLVMType();
    }

    if (this.isClass()) {
      const symbol = this.getSymbol();
      const declaration = symbol.valueDeclaration;

      if (!declaration) {
        throw new Error(`No declaration found for type '${this.toString()}'`);
      }

      if (!declaration.name) {
        throw new Error(`No name found at declaration '${declaration.getText()}'`);
      }

      if (this.isAmbient()) {
        return declaration.getLLVMStructType(declaration.name.getText());
      }

      const cxxBase = declaration.cxxBase;
      if (cxxBase) {
        return cxxBase.getLLVMStructType(declaration.name.getText());
      }
    }

    if (this.isObject()) {
      return this.checker.generator.ts.obj.getLLVMType();
    }

    throw new Error(`Unhandled type: '${this.toString()}'`);
  }

  isDeclared() {
    return Boolean(this.checker.generator.module.getTypeByName(this.mangle()));
  }

  toPlainCppType() {
    let cppType = this.toCppType();
    if (cppType.endsWith("*")) {
      cppType = cppType.substring(0, cppType.length - 1);
    }

    return cppType;
  }

  toCppType(): string {
    if (this.isVoid()) {
      return "Undefined*";
    }

    if (this.isArray()) {
      const elementType = this.getTypeGenericArguments()[0]!;
      return `Array<${elementType.toCppType()}>*`;
    }

    if (this.isMap()) {
      const typeParameters = this.getTypeGenericArguments();
      const cppTypeParameters = [];
      for (const type of typeParameters) {
        cppTypeParameters.push(type.toCppType());
      }

      return `Map<${cppTypeParameters.join(",")}>*`;
    }

    if (this.isSet()) {
      const typeParameters = this.getTypeGenericArguments();
      const cppTypeParameters = [];
      for (const type of typeParameters) {
        cppTypeParameters.push(type.toCppType());
      }

      return `Set<${cppTypeParameters.join(",")}>*`;
    }

    if (this.isTuple()) {
      return "Tuple*";
    }

    if (this.isFunction() || this.isClosure()) {
      return "TSClosure*";
    }

    if (this.isUnion()) {
      return "Union*";
    }

    if (this.isIntersection()) {
      return "Object*";
    }

    if (this.isUndefined()) {
      return "Undefined*";
    }

    if (this.isNull()) {
      return "Null*";
    }

    if (this.isNumber()) {
      return "Number*";
    }

    if (this.isString()) {
      return "String*";
    }

    if (this.isBoolean()) {
      return "Boolean*";
    }

    if (this.isInterface()) {
      return "Object*";
    }

    if (this.isTypeLiteral()) {
      return "Object*";
    }

    if (!this.isSymbolless()) {
      const symbol = this.getSymbol();
      const declaration = symbol.valueDeclaration || symbol.declarations[0];

      if (declaration.isParameter()) {
        if (declaration.isOptional()) {
          return "Union*";
        } else if (this.isEnum()) {
          return this.getEnumElementTSType().toCppType();
        }
      }

      if (declaration.isEnumMember()) {
        return this.getEnumElementTSType().toCppType();
      }

      if (!declaration.isAmbient()) {
        if (declaration.isClass() || this.isObject()) {
          return "Object*";
        }
      }
    }

    if (this.isEnum() && !this.isAmbient()) {
      return "Object*";
    }

    let typename = this.toString();

    if (this.isClassOrInterface()) {
      typename += "*";
    }

    const namespace = this.getNamespace();
    return namespace.length > 0 ? namespace + "::" + typename : typename;
  }

  isSame(type: TSType) {
    return this.type === type.unwrap() ||
      (this.isBoolean() && type.isBoolean()) ||
      (this.isNumber() && type.isNumber()) ||
      (this.isString() && type.isString()) ||
      (this.isFunction() && type.isFunction());
  }

  unwrap() {
    return this.type;
  }

  getEnumElementTSType() {
    const declaration = this.getSymbol().declarations[0];
    if (!declaration || (!declaration.isEnumMember() && !declaration.isEnum())) {
      throw new Error("No declaration for enum found or declaration is not a enum member or enum declaration");
    }

    if (declaration.isEnum()) {
      // @todo: This is a case when enum is used as some class property type. Enum's homogeneous have to be checked here and first member's type should be used.
      // Pretend it is a numeric enum for now.
      return this.checker.generator.builtinNumber.getTSType();
    }

    if (!declaration.initializer) {
      // initializer absence indicates that it is numeric enum
      return this.checker.generator.builtinNumber.getTSType();
    }

    return this.checker.getTypeAtLocation(declaration.initializer);
  }

  getEnumElementType() {
    const declaration = this.getSymbol().declarations[0];
    if (!declaration || (!declaration.isEnumMember() && !declaration.isEnum())) {
      throw new Error("No declaration for enum found or declaration is not a enum member or enum declaration");
    }

    if (declaration.isEnum()) {
      // @todo: This is a case when enum is used as some class property type. Enum's homogeneous have to be checked here and first member's type should be used.
      // Pretend it is a numeric enum for now.
      return this.checker.generator.builtinNumber.getLLVMType();
    }

    if (!declaration.initializer) {
      // initializer absence indicates that it is numeric enum
      return this.checker.generator.builtinNumber.getLLVMType();
    }

    const initializerType = this.checker.getTypeAtLocation(declaration.initializer);
    return initializerType.getLLVMType();
  }

  protected getEnumElementCppType() {
    const declaration = this.getSymbol().declarations[0];
    if (!declaration || (!declaration.isEnumMember() && !declaration.isEnum())) {
      throw new Error("No declaration for enum found or declaration is not a enum member or enum declaration");
    }

    if (declaration.isEnum()) {
      // @todo: This is a case when enum is used as some class property type. Enum's homogeneous have to be checked here and first member's type should be used.
      // Pretend it is a numeric enum for now.
      return "Number*";
    }

    if (!declaration.initializer) {
      // initializer absence indicates that it is numeric enum
      return "Number*";
    }

    const initializerType = this.checker.getTypeAtLocation(declaration.initializer);
    return initializerType.toCppType();
  }
}

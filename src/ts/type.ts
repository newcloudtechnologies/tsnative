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

import { cloneDeep, flatten } from "lodash";
import { TypeChecker } from "./typechecker";
import * as ts from "typescript";
import { LLVMStructType, LLVMType } from "../llvm/type";
import { Declaration } from "../ts/declaration";

import { TSSymbol } from "./symbol";
import { FunctionMangler } from "../mangling/functionmangler";

export class TSType {
  private type: ts.Type;
  private readonly originType: ts.Type;
  private readonly checker: TypeChecker;

  private constructor(type: ts.Type, checker: TypeChecker) {
    this.type = type;
    this.originType = type;
    this.checker = checker;

    if (this.toString() !== "this") {
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
      symbol = (this.checker.generator.tuple.getDeclaration().unwrapped as any).symbol;
    } else if (this.isString()) {
      symbol = (this.checker.generator.builtinString.getDeclaration().unwrapped as any).symbol;
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
    return this.isPrimitive() ? this.checker.getBaseTypeOfLiteralType(this.type).toString() : this.getSymbol().name;
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
        return (this.type as ts.TypeReference).typeArguments?.map((type) => TSType.create(type, this.checker)) || [];
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

  isTuple() {
    const typeNode = this.checker.unwrap().typeToTypeNode(this.type);
    return Boolean(typeNode && ts.isTupleTypeNode(typeNode));
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

  isInterface() {
    if (this.isSymbolless()) {
      return false;
    }

    const declaration = this.getSymbol().valueDeclaration;
    if (!declaration) {
      return false;
    }

    return declaration.isInterface();
  }

  isUnionOrIntersection(): this is ts.UnionOrIntersectionType {
    return this.isUnion() || this.isIntersection();
  }

  isUnion(): this is ts.UnionType {
    return this.type.isUnion() && !this.isBoolean() && !this.isEnum();
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
    return Boolean(this.type.flags & ts.TypeFlags.TypeParameter);
  }

  isUpcastableTo(type: TSType) {
    if (!this.isClassOrInterface()) {
      return false;
    }

    if (!type.isClassOrInterface()) {
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

    properties.push(...this.checker.getPropertiesOfType(this.type).filter((property) => property.isProperty()));
    return properties;
  }

  getProperty(name: string) {
    return this.checker.getPropertyOfType(this.type, name);
  }

  indexOfProperty(name: string): number {
    let index = this.getProperties().findIndex((property) => property.name === name);
    if (index < 0) {
      throw new Error(`No property '${name}' on type '${this.toString()}'`);
    }

    if (this.isClass()) {
      const symbol = this.getSymbol();
      const declaration = symbol.valueDeclaration;
      if (!declaration) {
        throw new Error(`Unable to find value declaration for type '${this.toString()}'`);
      }

      if (declaration.withVTable()) {
        index += 1;
      }
    }

    return index;
  }

  getApparentType() {
    return TSType.create(this.checker.unwrap().getApparentType(this.type), this.checker);
  }

  toString() {
    if (this.isUnionOrIntersection()) {
      const getElementTypeName = (elementType: TSType): string => {
        if (elementType.isUnionOrIntersection()) {
          return elementType.types.map((t) => getElementTypeName(t)).join(".");
        }
        return elementType.mangle();
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
      const types = this.getTypeGenericArguments()
        .map((typeArgument) => typeArgument.toString())
        .join("_");
      return "Array__" + types + "__class";
    }

    if (this.isString()) {
      return "string";
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

  getObjectPropsLLVMTypesNames(): { type: LLVMType; name: string }[] {
    if (this.isUnionOrIntersection()) {
      return flatten(
        this.types.map((subtype) => {
          return subtype.getObjectPropsLLVMTypesNames();
        })
      ).filter((value, index, array) => array.findIndex((v) => v.name === value.name) === index);
    }

    const getTypeAndNameFromProperty = (property: TSSymbol): { type: LLVMType; name: string } => {
      const declaration = property.declarations[0];
      let tsType = this.checker.getTypeAtLocation(declaration.unwrapped);

      if (!tsType.isSupported()) {
        if (!ts.isClassDeclaration(declaration.parent)) {
          throw new Error(
            `Generic-typed properties are allowed only for classes. Error at: '${declaration.parent.getText()}'`
          );
        }

        const classDeclaration = Declaration.create(declaration.parent, this.checker.generator);
        const typeMapper = this.checker.generator.meta.getClassTypeMapper(classDeclaration);
        tsType = typeMapper.get(tsType.toString());
      }

      const llvmType = tsType.getLLVMType();
      const valueType = property.valueDeclaration?.decorators?.some(
        (decorator) => decorator.getText() === "@ValueType"
      );

      return { type: valueType ? llvmType.unwrapPointer() : llvmType, name: property.name };
    };

    const symbol = this.getSymbol();

    const properties: { type: LLVMType; name: string }[] = [];
    if (symbol.valueDeclaration && symbol.valueDeclaration.isClass() && symbol.valueDeclaration.heritageClauses) {
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
        return LLVMType.getInt8Type(this.checker.generator);
      case "int16_t":
      case "uint16_t":
        return LLVMType.getInt16Type(this.checker.generator);
      case "int32_t":
      case "uint32_t":
        return LLVMType.getInt32Type(this.checker.generator);
      case "int64_t":
      case "uint64_t":
        return LLVMType.getInt64Type(this.checker.generator);
      default:
        throw new Error("Expected integral type");
    }
  }

  isSigned() {
    switch (this.toString()) {
      case "int8_t":
      case "int16_t":
      case "int32_t":
      case "int64_t":
        return true;
      case "uint8_t":
      case "uint16_t":
      case "uint32_t":
      case "uint64_t":
      default:
        return false;
    }
  }

  // @todo: tslint will warn 'no-unused-variables' if this method is marked as private
  protected getStructType() {
    const elements = this.getObjectPropsLLVMTypesNames();

    let structType: LLVMStructType;
    const declaration =
      this.getSymbol().declarations.find((decl) => decl.isClass()) ||
      this.getSymbol().declarations.find((decl) => decl.isInterface());

    if (declaration) {
      const declarationNamespace = declaration.getNamespace();
      const name = declarationNamespace.concat(this.mangle()).join("_");

      const knownStructType = this.checker.generator.module.getTypeByName(name);

      if (!knownStructType) {
        structType = LLVMStructType.create(this.checker.generator, name);
        const props = this.getProperties().map((symbol) => symbol.name);
        this.checker.generator.meta.registerObjectMeta(name, structType, props);

        const knownSize = this.checker.generator.sizeOf.getByName(name);
        if (knownSize) {
          const syntheticBody = structType.getSyntheticBody(knownSize);
          structType.setBody(syntheticBody);
        } else {
          const structElements = elements.map((element) => element.type.correctCppPrimitiveType());
          if (declaration.withVTable()) {
            // vptr
            const vptrType = LLVMType.getVPtrType(this.checker.generator);
            structElements.unshift(vptrType);
          }
          structType.setBody(structElements);
        }

        this.checker.generator.meta.registerStructMeta(
          name,
          structType,
          elements.map((element) => element.name)
        );
      } else {
        structType = LLVMType.make(knownStructType, this.checker.generator) as LLVMStructType;
      }
    } else {
      structType = LLVMStructType.get(
        this.checker.generator,
        elements.map((element) => element.type)
      );
    }

    return structType;
  }

  private getIntersectionOrUnionTypeProperties(): { type: LLVMType; name: string }[] {
    return flatten(
      this.types.map((t) => {
        if (t.isUnionOrIntersection()) {
          return t.getIntersectionOrUnionTypeProperties();
        }

        if (t.isPrimitive()) {
          return { type: t.getLLVMType(), name: "primitive" };
        }

        return t.getProperties().map((property) => {
          const declaration = property.declarations[0];
          const tsType = this.checker.generator.ts.checker.getTypeAtLocation(declaration.unwrapped);
          const llvmType = tsType.getLLVMType();
          const valueType = declaration.decorators?.some((decorator) => decorator.getText() === "@ValueType");
          return { type: valueType ? llvmType.unwrapPointer() : llvmType, name: property.name };
        });
      })
    );
  }

  private getUnionElementTypes(): LLVMType[] {
    return flatten(
      this.types.map((subtype) => {
        if (!subtype.isSymbolless() && subtype.getSymbol().declarations[0].isInterface()) {
          return subtype.getObjectPropsLLVMTypesNames().map((value) => value.type);
        }

        if (subtype.isUnion()) {
          return subtype.getUnionElementTypes();
        }

        return [subtype.getLLVMType()];
      })
    );
  }

  getIntersectionStructType() {
    const intersectionName = this.toString();
    const existing = this.checker.generator.module.getTypeByName(intersectionName);
    if (existing) {
      return LLVMType.make(existing, this.checker.generator);
    }

    const elements = this.getIntersectionOrUnionTypeProperties();

    if (elements.length === 0) {
      // So unlikely but have to be checked.
      throw new Error(`Intersection '${intersectionName}' has no elements.`);
    }

    const intersection = LLVMStructType.create(this.checker.generator, intersectionName);
    intersection.setBody(elements.map((element) => element.type));

    this.checker.generator.meta.registerIntersectionMeta(
      intersectionName,
      intersection,
      elements.map((element) => element.name.toString())
    );

    return intersection;
  }

  getUnionStructType() {
    const unionName = this.toString();
    const knownUnionType = this.checker.generator.module.getTypeByName(unionName);
    if (knownUnionType) {
      return LLVMType.make(knownUnionType, this.checker.generator) as LLVMStructType;
    }

    const elements = this.getUnionElementTypes();

    const unionType = LLVMStructType.create(this.checker.generator, unionName);
    unionType.setBody(elements);

    const allProperties = this.getIntersectionOrUnionTypeProperties();

    const props = allProperties.map((property) => property.name);
    const propsMap = allProperties.reduce((acc, symbol, index) => {
      return acc.set(symbol.name, index);
    }, new Map<string, number>());

    this.checker.generator.meta.registerUnionMeta(unionName, unionType, props, propsMap);
    return unionType;
  }

  getLLVMReturnType() {
    const llvmReturnType = this.getLLVMType();

    if (llvmReturnType.isVoid()) {
      return llvmReturnType;
    }

    return llvmReturnType.ensurePointer();
  }

  getLLVMType(): LLVMType {
    if (this.isIntersection()) {
      return this.getIntersectionStructType().getPointer();
    }

    if (this.isUnion()) {
      return this.getUnionStructType().getPointer();
    }

    if (this.isCppIntegralType()) {
      return this.getIntegralType()!;
    }

    if (this.isEnum()) {
      const declaration = this.getSymbol().declarations[0];
      if (!declaration || (!declaration.isEnumMember() && !declaration.isEnum())) {
        console.log(declaration.getText());
        throw new Error("No declaration for enum found or declaration is not a enum member or enum declaration");
      }

      if (declaration.isEnum()) {
        // @todo: This is a case when enum is used as some class property type. Enum's homogeneous have to be checked here and first member's type should be used.
        // Pretend it is a numeric enum for now.
        return LLVMType.getDoubleType(this.checker.generator).getPointer();
      }

      if (!declaration.initializer) {
        // initializer absence indicates that it is numeric enum
        return LLVMType.getDoubleType(this.checker.generator).getPointer();
      }

      const initializerType = this.checker.getTypeAtLocation(declaration.initializer);
      return initializerType.getLLVMType();
    }

    if (this.isBoolean()) {
      return LLVMType.getIntNType(1, this.checker.generator).getPointer();
    }

    if (this.isNumber()) {
      return LLVMType.getDoubleType(this.checker.generator).getPointer();
    }

    if (this.isString()) {
      return this.checker.generator.builtinString.getLLVMType();
    }

    if (this.isVoid()) {
      return LLVMType.getVoidType(this.checker.generator);
    }

    if (this.isFunction()) {
      const symbol = this.getSymbol();
      const declaration = symbol.declarations[0];
      const signature = this.checker.getSignatureFromDeclaration(declaration);
      const withFunargs = signature.getParameters().some((parameter) => {
        const symbolType = this.checker.getTypeOfSymbolAtLocation(parameter, declaration.unwrapped);
        return symbolType.isFunction();
      });

      if (withFunargs) {
        if (
          !ts.isCallExpression(declaration.parent) ||
          !FunctionMangler.checkIfExternalSymbol(declaration.parent, this.checker.generator)
        ) {
          return this.checker.generator.tsclosure.lazyClosure.type;
        }
      }

      return this.checker.generator.tsclosure.getLLVMType();
    }

    if (this.isUndefined()) {
      return LLVMType.getInt8Type(this.checker.generator).getPointer();
    }

    if (this.isObject()) {
      return this.getStructType().getPointer();
    }

    if (this.isNull()) {
      return LLVMType.getInt8Type(this.checker.generator).getPointer();
    }

    if (this.isTuple()) {
      return this.checker.generator.tuple.getLLVMType();
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
    if (this.isFunction()) {
      return "TSClosure*";
    }
    if (this.isArray()) {
      const elementType = this.getTypeGenericArguments()[0]!;
      let cppElementType = elementType.toCppType();
      if (elementType.isClassOrInterface()) {
        cppElementType = "void*";
      }
      return `Array<${cppElementType}>*`;
    }

    if (this.isMap()) {
      const typeParameters = this.getTypeGenericArguments();
      const cppTypeParameters = [];
      for (const type of typeParameters) {
        let cppType = type.toCppType();
        if (type.isClassOrInterface()) {
          cppType = "void*";
        }

        cppTypeParameters.push(cppType);
      }

      return `Map<${cppTypeParameters.join(",")}>*`;
    }

    if (this.isSet()) {
      const typeParameters = this.getTypeGenericArguments();
      const cppTypeParameters = [];
      for (const type of typeParameters) {
        let cppType = type.toCppType();
        if (type.isClassOrInterface()) {
          cppType = "void*";
        }

        cppTypeParameters.push(cppType);
      }

      return `Set<${cppTypeParameters.join(",")}>*`;
    }

    if (this.isTuple()) {
      const typeParameters = this.getTypeGenericArguments();
      const cppTypeParameters = [];
      for (const type of typeParameters) {
        let cppType = type.toCppType();
        if (type.isClassOrInterface()) {
          cppType = "void*";
        }

        cppTypeParameters.push(cppType);
      }

      return `Tuple<${cppTypeParameters.join(",")}>*`;
    }

    let typename = this.toString();

    if (this.isNumber()) {
      typename = "number";
    } else if (this.isString()) {
      return "string*";
    } else if (this.isUnionOrIntersection()) {
      return "void*";
    } else if (!this.isSymbolless()) {
      const symbol = this.getSymbol();
      const declaration = symbol.valueDeclaration || symbol.declarations[0];

      if (declaration.isInterface()) {
        return "void*";
      }

      if (declaration.isClass() && !declaration.isAmbient()) {
        return "void*";
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
        return "string*";
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
          throw new Error(`Type '${this.toString()}' is not mapped to C++ type`);
        }

        if (this.isClassOrInterface()) {
          typename += "*";
        }

        const namespace = this.getNamespace();
        return namespace.length > 0 ? namespace + "::" + typename : typename;
    }
  }

  isSame(type: TSType) {
    return this.type === type.unwrap();
  }

  unwrap() {
    return this.type;
  }
}

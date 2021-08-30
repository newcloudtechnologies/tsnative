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

import * as ts from "typescript";
import { LLVMGenerator } from "../generator";
import { TSType } from "./type";
import { Signature } from "./signature";
import { TSSymbol } from "../ts/symbol";
import { Declaration } from "../ts/declaration";

export class TypeChecker {
  private readonly checker: ts.TypeChecker;
  readonly generator: LLVMGenerator;

  constructor(checker: ts.TypeChecker, generator: LLVMGenerator) {
    this.checker = checker;
    this.generator = generator;
  }

  nodeHasSymbol(node: ts.Node) {
    return Boolean(this.checker.getSymbolAtLocation(node));
  }

  getSymbolAtLocation(node: ts.Node) {
    let symbol = this.checker.getSymbolAtLocation(node);
    if (!symbol) {
      throw new Error(`No symbol found at '${node.getText()}'`);
    }

    if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
      symbol = this.checker.getAliasedSymbol(symbol);
    }

    return TSSymbol.create(symbol, this.generator);
  }

  getAliasedSymbol(symbol: TSSymbol) {
    return TSSymbol.create(this.checker.getAliasedSymbol(symbol.unwrapped), this.generator);
  }

  getTypeAtLocation(node: ts.Node) {
    return TSType.create(this.checker.getTypeAtLocation(node), this);
  }

  getDeclaredTypeOfSymbol(symbol: ts.Symbol) {
    return TSType.create(this.checker.getDeclaredTypeOfSymbol(symbol), this);
  }

  getTypeOfSymbolAtLocation(symbol: TSSymbol, node: ts.Node) {
    if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
      symbol = this.getAliasedSymbol(symbol);
    }

    return TSType.create(this.checker.getTypeOfSymbolAtLocation(symbol.unwrapped, node), this);
  }

  getTypeFromTypeNode(typeNode: ts.TypeNode) {
    return TSType.create(this.checker.getTypeFromTypeNode(typeNode), this);
  }

  getBaseTypeOfLiteralType(type: ts.Type) {
    return TSType.create(this.checker.getBaseTypeOfLiteralType(type), this);
  }

  getSignatureFromDeclaration(declaration: Declaration) {
    const signatureDeclaration = declaration.unwrapped as ts.SignatureDeclaration;
    const signature = this.checker.getSignatureFromDeclaration(signatureDeclaration);
    if (!signature) {
      throw new Error(`Signature not found for '${declaration.getText()}'`);
    }

    return Signature.create(signature, this.generator);
  }

  getResolvedSignature(node: ts.CallLikeExpression, candidatesOutArray?: ts.Signature[], argumentCount?: number) {
    const signature = this.checker.getResolvedSignature(node, candidatesOutArray, argumentCount);
    if (!signature) {
      throw new Error(`Signature not found at '${node.getText()}'`);
    }

    return Signature.create(signature, this.generator);
  }

  getReturnTypeOfSignature(signature: ts.Signature) {
    return TSType.create(this.checker.getReturnTypeOfSignature(signature), this);
  }

  getPropertyOfType(type: ts.Type, name: string) {
    const property = this.checker.getPropertyOfType(type, name);
    if (!property) {
      throw new Error(`No property '${name}' found in type '${this.checker.typeToString(type)}'`);
    }

    return TSSymbol.create(property, this.generator);
  }

  getPropertiesOfType(type: ts.Type) {
    return this.checker.getPropertiesOfType(type).map((symbol) => TSSymbol.create(symbol, this.generator));
  }

  unwrap() {
    return this.checker;
  }
}

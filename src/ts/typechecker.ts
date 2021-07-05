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
import { LLVMGenerator } from "@generator";
import { TSType } from "./type";

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

    return symbol;
  }

  getAliasedSymbol(symbol: ts.Symbol) {
    return this.checker.getAliasedSymbol(symbol);
  }

  getTypeAtLocation(node: ts.Node) {
    return new TSType(this.checker.getTypeAtLocation(node), this);
  }

  getDeclaredTypeOfSymbol(symbol: ts.Symbol) {
    return new TSType(this.checker.getDeclaredTypeOfSymbol(symbol), this);
  }

  getTypeOfSymbolAtLocation(symbol: ts.Symbol, node: ts.Node) {
    if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
      symbol = this.checker.getAliasedSymbol(symbol);
    }

    return new TSType(this.checker.getTypeOfSymbolAtLocation(symbol, node), this);
  }

  getTypeFromTypeNode(typeNode: ts.TypeNode) {
    return new TSType(this.checker.getTypeFromTypeNode(typeNode), this);
  }

  getBaseTypeOfLiteralType(type: ts.Type) {
    return new TSType(this.checker.getBaseTypeOfLiteralType(type), this);
  }

  getSignatureFromDeclaration(declaration: ts.SignatureDeclaration): ts.Signature {
    const signature = this.checker.getSignatureFromDeclaration(declaration);
    if (!signature) {
      throw new Error(`Signature not found for '${declaration.getText()}'`);
    }

    return signature;
  }

  getResolvedSignature(node: ts.CallLikeExpression, candidatesOutArray?: ts.Signature[], argumentCount?: number) {
    const signature = this.checker.getResolvedSignature(node, candidatesOutArray, argumentCount);
    if (!signature) {
      throw new Error(`Signature not found at '${node.getText()}'`);
    }

    return signature;
  }

  getReturnTypeOfSignature(signature: ts.Signature) {
    return new TSType(this.checker.getReturnTypeOfSignature(signature), this);
  }

  getPropertiesOfType(type: ts.Type) {
    return this.checker.getPropertiesOfType(type);
  }

  unwrap() {
    return this.checker;
  }
}

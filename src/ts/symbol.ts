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

import { LLVMGenerator, MetaInfoStorage } from "../generator";
import * as ts from "typescript";
import { Declaration } from "../ts/declaration";

export class TSSymbol {
  private readonly symbol: ts.Symbol;
  private readonly generator: LLVMGenerator;

  private constructor(symbol: ts.Symbol, generator: LLVMGenerator) {
    this.symbol = symbol;
    this.generator = generator;
  }

  static create(symbol: ts.Symbol, generator: LLVMGenerator) {
    return new TSSymbol(symbol, generator);
  }

  isProperty() {
    return Boolean(this.symbol.flags & ts.SymbolFlags.Property);
  }

  isOptionalMethod() {
    return this.valueDeclaration?.isMethod() && this.valueDeclaration.isOptional();
  }

  get name() {
    return this.symbol.name;
  }

  get declarations() {
    return this.symbol.declarations?.map((declaration) => Declaration.create(declaration, this.generator)) || [];
  }

  get valueDeclaration() {
    const declaration = this.generator.meta.try(MetaInfoStorage.prototype.getRemappedSymbolDeclaration, this);
    if (declaration) {
      return declaration;
    }

    // However valueDeclaration is not marked optional in public API in fact it is.
    if (!this.symbol.valueDeclaration) {
      return undefined;
    }
    return Declaration.create(this.symbol.valueDeclaration, this.generator);
  }

  get flags() {
    return this.symbol.getFlags();
  }

  get members() {
    return this.symbol.members;
  }

  get escapedName() {
    return this.symbol.escapedName;
  }

  get unwrapped() {
    return this.symbol;
  }

  equals(other: TSSymbol) {
    return this.symbol === other.symbol;
  }
}

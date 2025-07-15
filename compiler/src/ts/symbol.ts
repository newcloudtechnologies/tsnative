import { LLVMGenerator } from "../generator";
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

  isNamespace() {
    return Boolean(this.valueDeclaration?.isNamespace());
  }

  isProperty() {
    return Boolean(this.symbol.flags & ts.SymbolFlags.Property);
  }

  isMethodSignature() {
    return this.valueDeclaration?.isMethodSignature();
  }

  isMethod() {
    return this.valueDeclaration?.isMethod();
  }

  isParameter() {
    return this.valueDeclaration?.isParameter();
  }

  isStatic() {
    return this.valueDeclaration?.isStatic();
  }

  isOptional() {
    return this.valueDeclaration?.isOptional() || this.valueDeclaration?.type.isOptionalUnion();
  }

  isOptionalMethod() {
    return this.isMethod() && this.isOptional();
  }

  get name() {
    return this.symbol.name;
  }

  get declarations() {
    return this.symbol.declarations?.map((declaration) => Declaration.create(declaration, this.generator)) || [];
  }

  get valueDeclaration() {
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

import { LLVMGenerator } from "../generator";
import { TypeChecker } from "./typechecker";
import { TSArray } from "./array";
import { TSTuple } from "./tuple";
import { TSIterableIterator } from "./iterableiterator";
import { TSIterator } from "./iterator";
import { TSUndefined } from "./undefined";
import { TSNull } from "./null";
import { TSMap } from "./map";
import { TSObject } from "./object";
import { TSUnion } from "./union";
import { TSString } from "./string";

export class TS {
  readonly checker: TypeChecker;

  private _array: TSArray | undefined;
  private _tuple: TSTuple | undefined;
  private _iterator: TSIterator | undefined;
  private _iterableIterator: TSIterableIterator | undefined;
  private _undef: TSUndefined | undefined;
  private _null: TSNull | undefined;
  private _map: TSMap | undefined;
  private _obj: TSObject | undefined;
  private _union: TSUnion | undefined;
  private _str: TSString | undefined;

  constructor(generator: LLVMGenerator) {
    this.checker = new TypeChecker(generator.program.getTypeChecker(), generator);
  }

  get array() {
    if (!this._array) {
      this._array = new TSArray(this.checker.generator);
    }

    return this._array!;
  }

  get tuple() {
    if (!this._tuple) {
      this._tuple = new TSTuple(this.checker.generator);
    }

    return this._tuple!;
  }

  get iterator() {
    if (!this._iterator) {
      this._iterator = new TSIterator(this.checker.generator);
    }

    return this._iterator!;
  }

  get iterableIterator() {
    if (!this._iterableIterator) {
      this._iterableIterator = new TSIterableIterator(this.checker.generator);
    }

    return this._iterableIterator!;
  }

  get undef() {
    if (!this._undef) {
      this._undef = new TSUndefined(this.checker.generator);
    }

    return this._undef!;
  }

  get null() {
    if (!this._null) {
      this._null = new TSNull(this.checker.generator);
    }

    return this._null!;
  }

  get map() {
    if (!this._map) {
      this._map = new TSMap(this.checker.generator);
    }

    return this._map!;
  }

  get obj() {
    if (!this._obj) {
      this._obj = new TSObject(this.checker.generator);
    }

    return this._obj!;
  }

  get union() {
    if (!this._union) {
      this._union = new TSUnion(this.checker.generator);
    }

    return this._union!;
  }

  get str() {
    if (!this._str) {
      this._str = new TSString(this.checker.generator);
    }

    return this._str!;
  }
}

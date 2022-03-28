declare class Object {
  constructor(_?: any);

  private get(key: string): any;
  private set(key: string, value: any): void;

  toString(): string;
  private toBool(): boolean;
}

declare class Union {
  constructor(_?: any);

  private getValue(): Object;
  private setValue(_: Object): void;

  toString(): string;
  private toBool(): boolean;
}

declare class Number {
  constructor(_: any);

  private add(other: number): number;
  private sub(other: number): number;
  private mul(other: number): number;
  private div(other: number): number;
  private mod(other: number): number;

  private addInplace(other: number): number;
  private subInplace(other: number): number;
  private mulInplace(other: number): number;
  private divInplace(other: number): number;
  private modInplace(other: number): number;


  private bitwiseAnd(other: number): number;
  private bitwiseOr(other: number): number;
  private bitwiseXor(other: number): number;
  private bitwiseLeftShift(other: number): number;
  private bitwiseRightShift(other: number): number;

  private bitwiseAndInplace(other: number): number;
  private bitwiseOrInplace(other: number): number;
  private bitwiseXorInplace(other: number): number;
  private bitwiseLeftShiftInplace(other: number): number;
  private bitwiseRightShiftInplace(other: number): number;

  private negate(): number;

  private prefixIncrement(): number;
  private postfixIncrement(): number;

  private prefixDecrement(): number;
  private postfixDecrement(): number;

  private equals(other: number): boolean;
  private lessThan(other: number): boolean;
  private lessEqualsThan(other: number): boolean;
  private greaterThan(other: number): boolean;
  private greaterEqualsThan(other: number): boolean;

  private unboxed(): number;

  private clone(): number;

  toString(): string;
  private toBool(): boolean;
}

// @ts-ignore
declare type number = Number;

declare class Boolean {
  constructor(_: any);

  private negate(): boolean;
  private equals(other: boolean): boolean;

  private unboxed(): number;

  private clone(): boolean;

  toString(): string;
  private toBool(): boolean;
}

// @ts-ignore
declare type boolean = Boolean;

declare class Array<T> {
  constructor();

  get length(): number;
  set length(value: number);

  push(...items: T[]): number;

  forEach(callbackfn: (value: T, index: number, array: readonly T[]) => void): void;

  indexOf(searchElement: T): number;
  indexOf(searchElement: T, fromIndex: number): number;

  map<U>(callbackfn: (value: T, index: number, array: readonly T[]) => U): U[];

  splice(start: number): T[];
  splice(start: number, deleteCount: number): T[];
  splice(start: number, deleteCount: number, ...items: T[]): T[];

  concat(other: T[]): T[];

  [index: number]: T;

  toString(): string;
  private toBool(): boolean;

  keys(): ArrayIterator<number>;
  values(): ArrayIterator<T>;

  // @ts-ignore
  @MapsTo("iterator")
  [Symbol.iterator](): ArrayIterator<T>;
}

declare class Tuple {
  constructor(...initializer: any);

  [index: number]: any;

  get length(): number;

  toString(): string;
  private toBool(): boolean;
}

declare class Map<K, V> {
  constructor();

  clear(): void;

  // @ts-ignore
  @MapsTo("remove")
  delete(key: K): boolean;

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void; // @todo: `thisArg?: any` as second parameter

  get(key: K): V; // @todo: what the hell is undefined on C++ side?
  has(key: K): boolean;
  set(key: K, value: V): this;

  // @todo: entries(): Array<[K, V]>, lacks tuples support
  keys(): ArrayIterator<K>;
  values(): ArrayIterator<V>;

  // @ts-ignore
  @MapsTo("iterator")
  [Symbol.iterator](): MapIterator<[K, V]>;

  toString(): string;
  private toBool(): boolean;

  get size(): number;
}

declare class Set<T> {
  constructor();

  add(value: T): this;
  clear(): void;

  // @ts-ignore
  @MapsTo("remove")
  delete(value: T): boolean;
  forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void): void; // @todo: `thisArg?: any` as second parameter
  has(value: T): boolean;

  // @todo: entries(): lacks tuples support
  keys(): ArrayIterator<T>;
  values(): ArrayIterator<T>;

  // @ts-ignore
  @MapsTo("iterator")
  [Symbol.iterator](): SetIterator<T>;

  toString(): string;
  private toBool(): boolean;

  get size(): number;
}

declare class String {
  constructor(initializer?: any);

  concat(string: string): string;

  startsWith(string: string): boolean;
  startsWith(string: string, start: number): boolean;

  endsWith(string: string): boolean;
  endsWith(string: string, start: number): boolean;

  split(pattern: string): string[];
  split(pattern: string, limit: number): string[];

  slice(start: number): string;
  slice(start: number, end: number): string;

  substring(start: number): string;
  substring(start: number, end: number): string;

  trim(): string;

  toLowerCase(): string;
  toUpperCase(): string;

  includes(pattern: string): boolean;
  includes(pattern: string, start: number): boolean;

  indexOf(pattern: string): number;
  indexOf(pattern: string, start: number): number;

  lastIndexOf(pattern: string): number;
  lastIndexOf(pattern: string, start: number): number;

  // @ts-ignore
  @MapsTo("iterator")
  [Symbol.iterator](): StringIterator<string>;

  get length(): number;

  toString(): string;
  private toBool(): boolean;

  private equals(_: string): boolean;

  private clone(): string;
}

// @ts-ignore
declare type string = String;

declare class Undefined {
  constructor();

  toString(): string;
  private toBool(): boolean;
}

declare class Null {
  constructor();

  toString(): string;
  private toBool(): boolean;
}

declare namespace console {
  export function log(message?: any, ...optionalParams: any[]): void;
  export function assert(assumption: boolean, ...optionalParams: any[]): void;
}

declare type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;
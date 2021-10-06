declare class Array<T> {
  constructor();

  get length(): number;

  push(...items: T[]): number;

  forEach(callbackfn: (value: T, index: number, array: readonly T[]) => void): void;

  indexOf(searchElement: T, fromIndex?: number): number;

  map<U>(callbackfn: (value: T, index: number, array: readonly T[]) => U): U[];

  splice(start: number, deleteCount?: number): T[];
  splice(start: number, deleteCount: number, ...items: T[]): T[];

  concat(other: T[]): T[];

  [index: number]: T;

  toString(): string;

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

  get size(): number;
}

declare class String {
  constructor(initializer?: any);

  concat(string: string): string;

  startsWith(string: string): boolean;
  startsWith(string: string, start: number): boolean;

  endsWith(string: string): boolean;
  endsWith(string: string, start: number): boolean;

  split(): string[];
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

  // @ts-ignore
  @MapsTo("operator==")
  private equals(string): boolean;
}

// @ts-ignore
declare type string = String;

declare namespace console {
  export function log(message?: any, ...optionalParams: any[]): void;
  export function assert(assumption: boolean, ...optionalParams: any[]): void;
}

declare type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;
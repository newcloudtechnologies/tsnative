// tslint:disable:no-empty-interface no-namespace interface-name

declare class Array<T> {
  constructor();
  readonly length: number;
  push(value: T): void;
  [index: number]: T;
}

interface Boolean {}

interface Function {}

interface IArguments {}

interface Number {}

interface Object {}

interface RegExp {}

interface CallableFunction {}

interface NewableFunction {}

interface String {
  concat(string: string): string;
  readonly length: number;
}

declare enum int8_t {}
declare enum int16_t {}
declare enum int32_t {}

declare enum uint8_t {}
declare enum uint16_t {}
declare enum uint32_t {}

declare namespace console {
  export function log<T>(message: T): void
  export function assert(assumption: boolean, message: string): void;
}
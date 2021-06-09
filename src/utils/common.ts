/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

export function error(message: string): never {
  throw new Error(message);
}

export function reverse<T>(array: T[]): T[] {
  return array.slice().reverse();
}

export function flatten<T>(array: T[][]): T[] {
  return Array.prototype.concat.apply([], array);
}

export function zip<T, U>(lhs: T[], rhs: U[]): [T, U][] {
  if (lhs.length !== rhs.length) {
    error(`Expected arrays of same length. Got ${lhs} - ${rhs}`);
  }
  return lhs.map((value, index) => [value, rhs[index]]);
}

export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

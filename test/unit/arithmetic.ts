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

{
  const addition1 = function (x: number, y: number): number {
    return x + y;
  }

  const addition2 = function (x: number, y: number): number {
    let result = x;
    result += y;
    return result;
  }

  const subtraction1 = function (x: number, y: number): number {
    return x - y;
  }

  const subtraction2 = function (x: number, y: number): number {
    let result = x;
    result -= y;
    return result;
  }

  const multiplication1 = function (x: number, y: number): number {
    return x * y;
  }

  const multiplication2 = function (x: number, y: number): number {
    let result = x;
    result *= y;
    return result;
  }

  const division1 = function (x: number, y: number): number {
    return x / y;
  }

  const division2 = function (x: number, y: number): number {
    let result = x;
    result /= y;
    return result;
  }

  const modulo1 = function (x: number, y: number): number {
    return x % y;
  }

  const modulo2 = function (x: number, y: number): number {
    let result = x;
    result %= y;
    return result;
  }

  const prefixIncrement = function (x: number): number {
    return ++x;
  }

  const prefixDecrement = function (x: number): number {
    return --x;
  }

  const postfixIncrement = function (x: number): number {
    return x++;
  }

  const postfixDecrement = function (x: number): number {
    return x--;
  }

  console.assert(addition1(2, 3) === 5, "arithmetics: addition1(2, 3) failed");
  console.assert(addition1(-2, -3) === -5, "arithmetics: addition1(-2, -3) failed");
  console.assert(addition1(-2, 3) === 1, "arithmetics: addition1(-2, 3) failed");

  console.assert(addition2(2, 3) === 5, "arithmetics: addition2(2, 3) failed");
  console.assert(addition2(-2, -3) === -5, "arithmetics: addition2(-2, -3) failed");
  console.assert(addition2(-2, 3) === 1, "arithmetics: addition2(-2, 3) failed");

  console.assert(subtraction1(3, 3) === 0, "arithmetics: subtraction1(3, 3) failed");
  console.assert(subtraction1(6, 2) === 4, "arithmetics: subtraction1(6, 2) failed");
  console.assert(subtraction1(-2, 3) === -5, "arithmetics: subtraction1(-2, 3) failed");

  console.assert(subtraction2(3, 3) === 0, "arithmetics: subtraction2(3, 3) failed");
  console.assert(subtraction2(6, 2) === 4, "arithmetics: subtraction2(6, 2) failed");
  console.assert(subtraction2(-2, 3) === -5, "arithmetics: subtraction2(-2, 3) failed");

  console.assert(multiplication1(0, 0) === 0, "arithmetics: multiplication1(0, 0) failed");
  console.assert(multiplication1(0, 6) === 0, "arithmetics: multiplication1(0, 6) failed");
  console.assert(multiplication1(6, 0) === 0, "arithmetics: multiplication1(6, 0) failed");
  console.assert(multiplication1(2, 3) === 6, "arithmetics: multiplication1(2, 3) failed");
  console.assert(multiplication1(-2, -3) === 6, "arithmetics: multiplication1(-2, -3) failed");
  console.assert(multiplication1(-2, 4) === -8, "arithmetics: multiplication1(-2, 3) failed");
  console.assert(multiplication1(2, -4) === -8, "arithmetics: multiplication1(-2, 3) failed");

  console.assert(multiplication2(0, 0) === 0, "arithmetics: multiplication2(0, 0) failed");
  console.assert(multiplication2(0, 6) === 0, "arithmetics: multiplication2(0, 6) failed");
  console.assert(multiplication2(6, 0) === 0, "arithmetics: multiplication2(6, 0) failed");
  console.assert(multiplication2(2, 3) === 6, "arithmetics: multiplication2(2, 3) failed");
  console.assert(multiplication2(-2, -3) === 6, "arithmetics: multiplication2(-2, -3) failed");
  console.assert(multiplication2(-2, 4) === -8, "arithmetics: multiplication2(-2, 3) failed");
  console.assert(multiplication2(2, -4) === -8, "arithmetics: multiplication2(-2, 3) failed");

  console.assert(division1(10, 2) === 5, "arithmetics: division1(10, 2) === 5 failed");
  console.assert(division1(0, 10) === 0, "arithmetics: division1(0, 10) === 5 failed");

  // TODO: Error: Identifier 'Infinity' not found in local scope nor environment
  //  console.assert(division(3, 0) === Infinity, "arithmetics: division(3, 0) === 5 failed");

  console.assert(division2(10, 2) === 5, "arithmetics: division2(10, 2) === 5 failed");
  console.assert(division2(0, 10) === 0, "arithmetics: division2(0, 10) === 5 failed");

  // TODO: Error: Identifier 'Infinity' not found in local scope nor environment
  //  console.assert(division2(3, 0) === Infinity, "arithmetics: division2(3, 0) === 5 failed");

  console.assert(modulo1(10, 4) === 2, "arithmetics: modulo1(10, 4) failed");
  console.assert(modulo1(10, 1) === 0, "arithmetics: modulo1(10, 1) failed");
  console.assert(modulo1(3, 10) === 3, "arithmetics: modulo1(3, 10) failed");
  console.assert(modulo1(0, 10) === 0, "arithmetics: modulo1(0, 10) failed");

  // Error: Identifier 'Nan' not found in local scope nor environment
  //  console.assert(modulo1(10, 0) === Nan, "arithmetics: modulo1(10, 0) failed");

  console.assert(modulo2(10, 4) === 2, "arithmetics: modulo2(10, 4) failed");
  console.assert(modulo2(10, 1) === 0, "arithmetics: modulo2(10, 1) failed");
  console.assert(modulo2(3, 10) === 3, "arithmetics: modulo2(3, 10) failed");
  console.assert(modulo2(0, 10) === 0, "arithmetics: modulo2(0, 10) failed");

  // Error: Identifier 'Nan' not found in local scope nor environment
  //  console.assert(modulo2(10, 0) === Nan, "arithmetics: modulo2(10, 0) failed");

  console.assert(postfixIncrement(3) === 3, "arithmetics: postfix increment(3) failed");
  console.assert(postfixIncrement(0) === 0, "arithmetics: postfix increment(0) failed");
  console.assert(postfixIncrement(-1) === -1, "arithmetics: postfix increment(-1) failed");
  console.assert(postfixIncrement(10) === 10, "arithmetics: postfix increment(10) failed");

  console.assert(prefixIncrement(3) === 4, "arithmetics: prefix increment(3) failed");
  console.assert(prefixIncrement(0) === 1, "arithmetics: prefix increment(0) failed");
  console.assert(prefixIncrement(-1) === 0, "arithmetics: prefix increment(-1) failed");
  console.assert(prefixIncrement(10) === 11, "arithmetics: prefix increment(10) failed");

  console.assert(postfixDecrement(3) === 3, "arithmetics: postfix decrement(3) failed");
  console.assert(postfixDecrement(0) === 0, "arithmetics: postfix decrement(0) failed");
  console.assert(postfixDecrement(-1) === -1, "arithmetics: postfix decrement(-1) failed");
  console.assert(postfixDecrement(1) === 1, "arithmetics: postfix decrement(1) failed");
  console.assert(postfixDecrement(10) === 10, "arithmetics: postfix decrement(10) failed");

  console.assert(prefixDecrement(3) === 2, "arithmetics: prefix decrement(3) failed");
  console.assert(prefixDecrement(0) === -1, "arithmetics: prefix decrement(0) failed");
  console.assert(prefixDecrement(-1) === -2, "arithmetics: prefix decrement(-1) failed");
  console.assert(prefixDecrement(1) === 0, "arithmetics: prefix decrement(1) failed");
  console.assert(prefixDecrement(10) === 9, "arithmetics: prefix decrement(10) failed");
}

{
  const equal = function (x: number, y: number): boolean {
    return x === y;
  }

  const not_equal = function (x: number, y: number): boolean {
    return x !== y;
  }

  const greater_than = function (x: number, y: number): boolean {
    return x > y;
  }

  const greater_than_or_equal = function (x: number, y: number): boolean {
    return x >= y;
  }

  const less_than = function (x: number, y: number): boolean {
    return x < y;
  }

  const less_than_or_equal = function (x: number, y: number): boolean {
    return x <= y;
  }

  console.assert(equal(4, 4), "arithmetics: equal(4, 4) failed");
  console.assert(!equal(4, 0), "arithmetics: !equal(4, 0) failed");

  console.assert(not_equal(4, 0), "arithmetics: not_equal(4, 0) failed");
  console.assert(!not_equal(4, 4), "arithmetics: !not_equal(4, 4) failed");

  console.assert(greater_than(5, 4), "arithmetics: greater_than(5, 4) failed");
  console.assert(!greater_than(4, 5), "arithmetics: !greater_than(4, 5) failed");
  console.assert(!greater_than(4, 4), "arithmetics: !greater_than(4, 4) failed");

  console.assert(greater_than_or_equal(5, 4), "arithmetics: greater_than_or_equal(5, 4) failed");
  console.assert(greater_than_or_equal(4, 4), "arithmetics: greater_than_or_equal(4, 4) failed");
  console.assert(!greater_than_or_equal(4, 5), "arithmetics: !greater_than_or_equal(4, 5) failed");

  console.assert(less_than(3, 4), "arithmetics: less_than(3, 4) failed");
  console.assert(!less_than(5, 4), "arithmetics: !less_than(5, 4) failed");
  console.assert(!less_than(4, 4), "arithmetics: !less_than(4, 4) failed");

  console.assert(less_than_or_equal(3, 4), "arithmetics: less_than_or_equal(3, 4) failed");
  console.assert(less_than_or_equal(3, 3), "arithmetics: less_than_or_equal(3, 3) failed");
  console.assert(!less_than_or_equal(5, 4), "arithmetics: !less_than_or_equal(5, 4) failed");
}

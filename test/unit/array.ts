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

const is_equal = function (a: number[], b: number[]): boolean {
  let result = false;

  if (a.length === b.length) {
    result = true;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        result = false;
        break;
      }
    }
  } else {
    result = false;
  }

  return result;
};

{
  const push = function (a: number[], x: number): number[] {
    a.push(x);
    return a;
  }

  const push2 = function (a: number[], x1: number, x2: number): number[] {
    a.push(x1, x2);
    return a;
  }

  const push3 = function (a: number[], x1: number, x2: number, x3: number): number[] {
    a.push(x1, x2, x3);
    return a;
  }

  let numbers: number[] = [];
  let l1 = [1];
  let r1 = push(numbers, 1);
  console.assert(is_equal(r1, l1), "array: push: is_equal(r1, l1) failed");

  let l2 = [1, 2];
  let r2 = push(numbers, 2);
  console.assert(is_equal(r2, l2), "array: push: is_equal(r2, l2) failed");

  let l3 = [1, 2, 3];
  let r3 = push(numbers, 3);
  console.assert(is_equal(r3, l3), "array: push: is_equal(r3, l3) failed");

  let digits2: number[] = [];
  let digits2_expected: number[] = [1, 2];
  push2(digits2, 1, 2);
  console.assert(is_equal(digits2, digits2_expected), "array: push: is_equal(digit2, digits2_expected) failed");

  let digits3: number[] = [];
  let digits3_expected: number[] = [1, 2, 3];
  push3(digits3, 1, 2, 3);
  console.assert(is_equal(digits3, digits3_expected), "array: push: is_equal(digit3, digits3_expected) failed");
}

{
  const set_by_index = function (a: number[], i: number, v: number) {
    a[i] = v;
    return a;
  }

  const get_by_index = function (a: number[], i: number): number {
    return a[i];
  }

  let numbers: number[] = [0, 1, 2, 3, 4];

  console.assert(numbers.length === 5, "array: []: numbers.length === 5 failed");

  console.assert(get_by_index(numbers, 0) === 0, "array: []: get_by_index(numbers, 0) === 0 failed");
  console.assert(get_by_index(numbers, 1) === 1, "array: []: get_by_index(numbers, 1) === 1 failed");
  console.assert(get_by_index(numbers, 2) === 2, "array: []: get_by_index(numbers, 2) === 2 failed");
  console.assert(get_by_index(numbers, 3) === 3, "array: []: get_by_index(numbers, 3) === 3 failed");
  console.assert(get_by_index(numbers, 4) === 4, "array: []: get_by_index(numbers, 4) === 4 failed");

  set_by_index(numbers, 0, 4);
  set_by_index(numbers, 1, 3);
  set_by_index(numbers, 2, 2);
  set_by_index(numbers, 3, 1);
  set_by_index(numbers, 4, 0);

  console.assert(numbers[0] === 4, "array: []: numbers[0] === 4 failed");
  console.assert(numbers[1] === 3, "array: []: numbers[1] === 3 failed");
  console.assert(numbers[2] === 2, "array: []: numbers[2] === 2 failed");
  console.assert(numbers[3] === 1, "array: []: numbers[3] === 1 failed");
  console.assert(numbers[4] === 0, "array: []: numbers[4] === 0 failed");
}

{
  let numbers: number[] = [8, 16, 32, 64, 128];

  console.assert(numbers.indexOf(8) === 0, "array: indexOf: numbers.indexOf(8) === 0 failed");
  console.assert(numbers.indexOf(32) === 2, "array: indexOf: numbers.indexOf(32) === 2 failed");
  console.assert(numbers.indexOf(8, 1) === -1, "array: indexOf: numbers.indexOf(8, 1) === -1 failed");
  console.assert(numbers.indexOf(16, 10) === -1, "array: indexOf: numbers.indexOf(16, 10) === -1 failed");
  console.assert(numbers.indexOf(128, -1) === 4, "array: indexOf: numbers.indexOf(8, 1) === -1 failed");
  console.assert(numbers.indexOf(8, -40) === 0, "array: indexOf: numbers.indexOf(8, -40) === 0 failed");
}

{
  let numbers_0_9: number[] = [8, 16, 32, 64, 128];
  let numbers_0_9_expected: number[] = [];
  let slpice_0_9_expected: number[] = [8, 16, 32, 64, 128];
  let slpice_0_9: number[] = numbers_0_9.splice(0, 9);
  console.assert(is_equal(slpice_0_9, slpice_0_9_expected), "array: splice(0, 9) failed");
  console.assert(is_equal(numbers_0_9, numbers_0_9_expected), "array: is_equal(numbers_0_9, numbers_0_9_expected) failed");


  let numbers_1_2: number[] = [8, 16, 32, 64, 128];
  let numbers_1_2_expected: number[] = [8, 64, 128];
  let slpice_1_2_expected: number[] = [16, 32];
  let slpice_1_2: number[] = numbers_1_2.splice(1, 2);
  console.assert(is_equal(slpice_1_2, slpice_1_2_expected), "array: splice(1, 2) failed");
  console.assert(is_equal(numbers_1_2, numbers_1_2_expected), "array: is_equal(numbers_1_2, numbers_1_2_expected) failed");


  let numbers_2_0: number[] = [8, 16, 32, 64, 128];
  let numbers_2_0_expected: number[] = [8, 16, 32, 64, 128];
  let slpice_2_0_expected: number[] = [];
  let slpice_2_0: number[] = numbers_2_0.splice(2, 0);
  console.assert(is_equal(slpice_2_0, slpice_2_0_expected), "array: splice(2, 0) === 0 failed");
  console.assert(is_equal(numbers_2_0, numbers_2_0_expected), "array: is_equal(numbers_2_0, numbers_2_0_expected) failed");


  let numbers_2_9: number[] = [8, 16, 32, 64, 128];
  let numbers_2_9_expected: number[] = [8, 16];
  let slpice_2_9_expected: number[] = [32, 64, 128];
  let slpice_2_9: number[] = numbers_2_9.splice(2, 9);
  console.assert(is_equal(slpice_2_9, slpice_2_9_expected), "array: splice(2, 9) === 0 failed");
  console.assert(is_equal(numbers_2_9, numbers_2_9_expected), "array: is_equal(numbers_2_9, numbers_2_9_expected) failed");
}

{
  let numbers: number[] = [8, 16, 32, 64, 128];
  let expected1: number[] = [16, 32, 64, 128, 256];
  let expected2: number[] = [18, 34, 66, 130, 258];

  let result1 = numbers.map((n: number) => {
    return n * 2;
  });

  console.assert(is_equal(result1, expected1), "array: map(n: number). (arrow) failed");

  let result2 = numbers.map((n: number, i: number, a: readonly number[]) => {
    return a[i] * 2;
  });

  console.assert(is_equal(result2, expected1), "array: map(n: number, i: number, a: readonly number[]). (arrow) failed");

  const fn = (n: number, i: number, a: number[]) => {
    a[i] += 1;
    return a[i] * 2;
  };

  let result3 = numbers.map(fn);

  console.assert(is_equal(result3, expected2), "array: map(n: number, i: number, a: number[]). (arrow) failed");
}

{
  let numbers: number[] = [8, 16, 32, 64, 128];
  let expected1: number[] = [9, 17, 33, 65, 129];
  let expected2: number[] = [8, 16, 32, 64, 128];

  const fn2 = (n: number, i: number, a: number[]) => {
    a[i] -= 1;
  };

  numbers.forEach((n: number, i: number, a: number[]) => {
    a[i] += 1;
  });

  console.assert(is_equal(numbers, expected1), "array: forEach((n: number, i: number, a: number[]). (arrow) failed");

  numbers.forEach(fn2);

  console.assert(is_equal(numbers, expected2), "array: forEach(fn2). (arrow) failed");
}

{
  let numbers: number[] = [8, 16, 32, 64, 128];
  let expected1: number[] = [16, 32, 64, 128, 256];
  let expected2: number[] = [18, 34, 66, 130, 258];

  let result1 = numbers.map(function (n: number) {
    return n * 2;
  });

  console.assert(is_equal(result1, expected1), "array: map(n: number). (function) failed");

  let result2 = numbers.map(function (n: number, i: number, a: readonly number[]) {
    return a[i] * 2;
  });

  console.assert(is_equal(result2, expected1), "array: map(n: number, i: number, a: readonly number[]). (function) failed");

  const fn = function (n: number, i: number, a: number[]) {
    a[i] += 1;
    return a[i] * 2;
  };

  let result3 = numbers.map(fn);

  console.assert(is_equal(result3, expected2), "array: map(n: number, i: number, a: number[]). (function) failed");
}

{
  let numbers: number[] = [8, 16, 32, 64, 128];
  let expected1: number[] = [9, 17, 33, 65, 129];
  let expected2: number[] = [8, 16, 32, 64, 128];

  const fn2 = function (n: number, i: number, a: number[]) {
    a[i] -= 1;
  };

  numbers.forEach(function (n: number, i: number, a: number[]) {
    a[i] += 1;
  });

  console.assert(is_equal(numbers, expected1), "array: forEach((n: number, i: number, a: number[]). (function) failed");

  numbers.forEach(fn2);

  console.assert(is_equal(numbers, expected2), "array: forEach(fn2). (function) failed");
}

{
  const fns: (() => number)[] = []
  const subscribe = function subscribe(fn: () => number) {
    fns.push(fn)
  };

  const f = function f() {
    return 1;
  };

  subscribe(f);
  const f0 = fns[0];
  console.assert(f0() === 1, "Function expression in function pointers array test failed");
}

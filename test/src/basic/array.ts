/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

const is_equal = function <T>(a: T[], b: T[]): boolean {
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
  const fns: (() => number)[] = [];
  const subscribe = function subscribe(fn: () => number) {
    fns.push(fn);
  };

  const f = function f() {
    return 1;
  };

  subscribe(f);
  const f0 = fns[0];
  console.assert(f0() === 1, "Function expression in function pointers array test failed");
}

{
  const fns: (() => void)[] = [];
  let i = 0;
  let k = 0;
  const f1 = () => { ++i; };
  const f2 = () => { ++i; };
  const f3 = () => { ++i; ++k; };
  fns.push(f1);
  fns.push(f2);
  fns.push(f3);

  fns.forEach((f) => f());

  console.assert(i === 3, "Array of closures test failed (1)");
  console.assert(k === 1, "Array of closures test failed (2)");
}

{
  class C {
    n: number;

    constructor(n: number) {
      this.n = n;
    }
  }

  const arr: C[] = [new C(1)];
  console.assert(arr[0].n === 1, "Array of ts classes test failed (1)");

  arr.push(new C(2));
  console.assert(arr[1].n === 2, "Array of ts classes test failed (2)");
}

{
  class C {
    i: number;

    constructor(i: number) {
      this.i = i;
    }
  }

  class X extends C {
    o: number;

    constructor(i: number) {
      super(i);
      this.o = 777
    }
  }

  const a: C[] = [new X(2), new C(1)];
  const x = a[0] as X;

  console.assert(x.i === 2, "Cast to base class failed (1)");
  console.assert(x.o === 777, "Cast to base class failed (2)");

  const c = a[1];
  console.assert(c.i === 1, "Polymorphic array test failed");
}

{
  const array = [22];
  const extended = [1, ...array, ...array, 666];
  const expected = [1, 22, 22, 666];

  console.assert(is_equal(extended, expected), "Array spread syntax test failed");
}

{
  const array = [23];
  const extended = [1].concat(array);
  const expected = [1, 23];

  console.assert(is_equal(extended, expected), "Array concat test failed");
}

{
  const array = [21];
  const extender = [0, 0];
  array.push(...extender, 22, ...extender, 23, ...extender);
  const expected = [21, 0, 0, 22, 0, 0, 23, 0, 0];

  console.assert(is_equal(array, expected), "Array.push with spread elements test failed");
}

{
  type MyType = {
    a: string
    b: string
  }

  {
    const initializer: MyType = { a: 'q', b: 'q' };
    const arr = [initializer];

    console.assert(arr[0] === initializer, "Custom-typed array element (1)");
  }

  {
    const aInitializer = "q";
    const bInitializer = "p";

    const arr: MyType[] = [{ a: aInitializer, b: bInitializer }];

    console.assert(arr[0].a === aInitializer && arr[0].b === bInitializer, "Custom-typed array element (2)");
  }

  {
    const arr: MyType[] = [];

    console.assert(arr.length === 0, "Empty custom-typed array");
  }
}

{
  interface MyInterface {
    a: string
    b: string
  }

  {
    const initializer: MyInterface = { a: 'q', b: 'q' };
    const arr = [initializer];

    console.assert(arr[0] === initializer, "Interface-typed array element (1)");
  }

  {
    const aInitializer = "q";
    const bInitializer = "p";

    const arr: MyInterface[] = [{ a: aInitializer, b: bInitializer }];

    console.assert(arr[0].a === aInitializer && arr[0].b === bInitializer, "Interface-typed array element (2)");
  }

  {
    const arr: MyInterface[] = [];

    console.assert(arr.length === 0, "Empty interface-typed array");
  }
}

{
  type FileInfo_t = {
    _path: string;
    _type: string,
    _name: string
  };

  const items: FileInfo_t[] = [
    { _path: "/home", _type: "", _name: "Home" },
    { _path: "/home/Desktop", _type: "", _name: "Desktop" },
    { _path: "/home/Documents", _type: "", _name: "Documents" },
    { _path: "/home/Downloads", _type: "", _name: "Downloads" },
    { _path: "/home/Music", _type: "", _name: "Music" }
  ];

  const paths: string[] = items.map((item: FileInfo_t): string => {
    return item._path;
  });

  const expected = ["/home", "/home/Desktop", "/home/Documents", "/home/Downloads", "/home/Music"];

  console.assert(is_equal(paths, expected), "Array `map` with custom transformed type");
}

{
  // Just test buildability
  (() => {
    class MyType {
      str: string = "Lol"
    }
    let arr: MyType[] = [
      new MyType(),
      new MyType(),
      new MyType(),
    ];
  })();
}

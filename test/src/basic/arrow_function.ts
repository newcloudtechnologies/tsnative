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

{
  const f = (): void => { };
  f();
}

{
  const f = (_: number): void => { };
  f(12);
}

{
  const f = (v: number): number => { return v; };
  f(12);

  console.assert(f(12) === 12, "arrow_function: (v: number): number failed");
}

{
  const f = (v: number, u: number): number => { return v + u; };
  console.assert(f(12, 1) === 13, "arrow_function: (v: number, u: number): number failed");
}

{
  const f = (u: string): string => { return u; };
  console.assert(f("any string") === "any string", "arrow_function: (u: string): string failed");
}

{
  var num: number = 0;

  const f = (fn: (_: number) => void, v: number) => {
    fn(v);
  };

  const setNum = (v: number): void => {
    num = v;
  }

  const arg = 32;
  f(setNum, arg);

  console.assert(num === arg, "arrow_function: (fn: (_: number) => void, v: number) failed");
}

{
  const f = () => {
    return function (): number {
      return 100;
    }
  };

  console.assert(f()() === 100, "arrow_function: () => { return function(): number failed");
}

{
  const two = () => 2;
  console.assert(two() === 2, "Arrow function without body block must return its expression");
}

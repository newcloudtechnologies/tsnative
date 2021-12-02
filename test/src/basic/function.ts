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
  function foo(a: number, b: number) {
    return a + b;
  }

  function bar(a: number, b: number) {
    return foo(b, a);
  }

  let res = bar(1, 2);

  console.assert(bar(1, 2) === 3, "function: bar(1, 2) failed");
}

{
let isInvoked = false;

function fnc() {
  isInvoked = true;
}

fnc();

// @ts-ignore
console.assert(isInvoked === true, "function: isInvoked failed");
}

{
  function takesFunctionDeclaration(fn: () => void) {
    fn();
  }
  function declaration() {}

  takesFunctionDeclaration(declaration);
}

{
  function dummyFunctionScope() {
    function scopedAndTakesFunctionDeclaration(fn: () => void) {
      fn();
    }
    function scopedDeclaration() { }

    scopedAndTakesFunctionDeclaration(scopedDeclaration);
  }

}

{
  class Getter {
    i = 43;

    get() {
      return this.i;
    }
  }

  class Storage {
    i = 1;
  }

  const getter = new Getter();
  const storage = new Storage();

  const getterI = getter.get.bind(getter);
  console.assert(getterI() === 43, "Function bind test failed (1)")

  const storageI = getter.get.bind(storage);
  console.assert(storageI() === 1, "Function bind test failed (2)")

  const f = (f: (n: number) => number, m: number) => f(m);
  const functionToBind = (n: number) => n;
  const bounded = f.bind(null, functionToBind);

  console.assert(bounded(9) === 9, "Function bind test failed (3)");
}
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

// @ts-nocheck
// supess TS2367

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

console.assert(isInvoked === true, "function: isInvoked failed");
}

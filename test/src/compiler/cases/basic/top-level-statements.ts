/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

let n: number = 0;

function foo() {
  n = 30;
}

let a = 4;
console.assert(a === 4, "top-level-statements: a === 4 failed");

a = a + 1;
console.assert(a === 5, "top-level-statements: a === 5 failed");

foo();

console.assert(n === 30, "top-level-statements: n === 30 failed");
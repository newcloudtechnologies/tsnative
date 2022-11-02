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

{
  interface A {
    a: number
    b: string
  }

  interface B {
    c: number
  }

  let intersection: A & B = {
    a: 1,
    b: "h",
    c: 0
  }

  console.assert(intersection.a === 1, "intersection: intersection.a === 1 failed");
  console.assert(intersection.b === "h", "intersection: intersection.b === 'h' failed");
  console.assert(intersection.c === 0, "intersection: intersection.c === 0 failed");
}

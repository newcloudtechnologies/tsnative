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

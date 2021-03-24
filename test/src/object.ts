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
    const a = { v: 12 };
    const b = { v: 12 };

    console.assert(a !== b, "Object not equals comparison failed");
    console.assert(a === a, "Object equals comparison failed");
    console.assert(b === b, "Object equals comparison failed");
}

{
    const a = { v: 12, k: "42" };
    const b = { o: 1, k: "0" };
    const c = { ...a, ...b };

    console.assert(c.v === 12, "Object spread initialization failed (1)");
    console.assert(c.k === "0", "Object spread initialization failed (2)");
    console.assert(c.o === 1, "Object spread initialization failed (3)");
}

{
    const a = { v: 12, k: "42" };
    const c = { ...a, k: "00" };

    console.assert(c.v === 12, "Object spread initialization failed (4)");
    console.assert(c.k === "00", "Object spread initialization failed (5)");
}

{
    interface A {
        v: number,
        k: string
    }

    interface B {
        b: boolean
    }

    type AnB = A & B;

    const a: AnB = { v: 12, k: "42", b: false };
    const c = { ...a };

    console.assert(c.v === 12, "Object spread initialization failed (1)");
    console.assert(c.k === "42", "Object spread initialization failed (2)");
    console.assert(c.b === false, "Object spread initialization failed (3)");
}

{
    interface A {
        v: number,
        k: string
    }

    interface B {
        b: boolean
    }

    type AnB = A & B;

    const a: AnB = { v: 12, k: "42", b: false };
    const b: B = { b: true }
    const c = { ...a, ...b };

    console.assert(c.v === 12, "Object spread initialization failed (1)");
    console.assert(c.k === "42", "Object spread initialization failed (2)");
    console.assert(c.b === true, "Object spread initialization failed (3)");
}

{
  const getObject = function (name: string, length: number, height: number, width: number) {
    const obj = {
      name: name,
      length: length,
      height: height,
      width: width
    };

    return obj;
  }

  const obj1 = getObject("Box", 10, 16, 14);

  console.assert(obj1.name === "Box", "object: obj1.name failed");
  console.assert(obj1.length === 10, "object: obj1.length failed");
  console.assert(obj1.height === 16, "object: obj1.height failed");
  console.assert(obj1.width === 14, "object: obj1.width failed");

  const obj2 = getObject("Cylinder", 20, 6, 6);

  console.assert(obj2.name === "Cylinder", "object: obj2.name failed");
  console.assert(obj2.length === 20, "object: obj2.length failed");
  console.assert(obj2.height === 6, "object: obj2.height failed");
  console.assert(obj2.width === 6, "object: obj2.width failed");
}

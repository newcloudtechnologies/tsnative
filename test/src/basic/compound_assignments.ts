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
  // arithmetic ops test
  {
    // plus equals
    let i: number = 0;
    i += 1;
    console.assert(i === 1, "Plus equals on number failed");
    let s: string = "123";
    s += "__123";
    console.assert(s === "123__123", "Plus equals on string failed");
  }

  {
    // minus equals
    let i: number = 0;
    i -= 1;
    console.assert(i === -1, "Minus equals test failed");
  }

  {
    // multiply equals
    let i: number = 2;
    i *= 2;
    console.assert(i === 4, "Multiply equals test failed");
  }

  {
    // divide equals
    let i: number = 4;
    i /= 2;
    console.assert(i === 2, "Divide equals test failed");
  }

  {
    // modulo equals
    let i: number = 4;
    i %= 3;
    console.assert(i === 1, "Modulo equals test failed");
  }
}

{
  // bitwise ops test
  {
    // AND
    let i: number = 3;
    i &= 1;
    console.assert(i === 1, "Bitwise AND test failed");
  }
  {
    // OR
    let i: number = 3;
    i |= 1 << 2;
    console.assert(i === 7, "Bitwise OR test failed");
  }
  {
    // XOR
    let i: number = 3;
    i ^= i;
    console.assert(i === 0, "Bitwise XOR test failed");
  }
  {
    // Shift left
    let i: number = 1;
    i <<= 1;
    console.assert(i === 2, "Bitwise shift left test failed");
  }
  {
    // Arithmetical shift right
    let i: number = -2;
    i >>= 1;
    console.assert(i === -1, "Bitwise arithmetical shift right test failed");
  }
  {
    // Logical shift right
    let i: number = -2;
    i >>>= 1;
    console.assert(i === 0x7fffffff, "Bitwise logical shift right test failed");
  }
}

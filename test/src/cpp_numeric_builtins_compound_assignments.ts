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
  {
    let i: int8_t = 0;
    i += 257;
    console.assert(i === 1, "Compound addition on int8_t failed");
  }

  {
    let i: int8_t = 0;
    i -= 1;
    console.assert(i === -1, "Compound substraction on int8_t failed");
  }

  {
    let i: int8_t = 2;
    i *= 2;
    console.assert(i === 4, "Compound multiplication on int8_t failed");
  }

  {
    let i: int8_t = 4;
    i /= 2;
    console.assert(i === 2, "Compound division on int8_t failed");
  }

  {
    let i: int8_t = 4;
    i %= 3;
    console.assert(i === 1, "Compound modulo on int8_t failed");
  }

  {
    let i: int8_t = 1;
    i <<= 1;
    console.assert(i === 2, "Compound left shift on int8_t failed");

    let d: number = 8;
    d >>= i;

    console.assert(d === 2, "Compound right shift on number with int8_t operand failed");
  }

  {
    let i: int8_t = -2;
    i >>= 1;
    console.assert(i === -1, "Compound right shift on int8_t failed");
  }

  {
    let i: int8_t = -2;
    i >>>= 1;
    console.assert(i === 127, "Compound arithmetical right shift on int8_t failed");
  }
}

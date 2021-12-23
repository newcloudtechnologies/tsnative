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

import { uint8_t } from "std/definitions/lib.std.numeric"

{
  {
    let i: uint8_t = 0;
    i += 257;
    console.assert(i === 1, "Compound addition on uint8_t failed");
  }

  {
    let i: uint8_t = 0;
    i -= 1;
    console.assert(i === 255, "Compound substraction on uint8_t failed");
  }

  {
    let i: uint8_t = 2;
    i *= 2;
    console.assert(i === 4, "Compound multiplication on uint8_t failed");
  }

  {
    let i: uint8_t = 4;
    i /= 2;
    console.assert(i === 2, "Compound division on uint8_t failed");
  }

  {
    let i: uint8_t = 4;
    i %= 3;
    console.assert(i === 1, "Compound modulo on uint8_t failed");
  }

  {
    let i: uint8_t = 1;
    i <<= 1;
    console.assert(i === 2, "Compound left shift on uint8_t failed");

    let d: number = 8;
    d >>= i;

    console.assert(d === 2, "Compound right shift on number with uint8_t operand failed");
  }

  {
    let i: uint8_t = 4;
    i >>= 1;
    console.assert(i === 2, "Compound right shift on uint8_t failed");
  }

  {
    let i: uint8_t = 4;
    i >>>= 2;
    console.assert(i === 1, "Compound arithmetical right shift on uint8_t failed");
  }
}

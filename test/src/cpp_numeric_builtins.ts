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

// int8_t tests
{
  const INT8_MIN: int8_t = -128;
  const INT8_MAX: int8_t = 127;

  let i: int8_t = -1;
  const ii: int8_t = 1;

  console.assert(i + ii === 0, "+(int8_t, int8_t) failed");
  console.assert(ii + i === 0, "+(int8_t, int8_t) failed");
  console.assert(i + 1 === 0, "+(int8_t, number) failed");
  console.assert(1 + i === 0, "+(number, int8_t) failed");

  console.assert(i - ii === -2, "-(int8_t, int8_t) failed");
  console.assert(ii - i === 2, "-(int8_t, int8_t) failed");
  console.assert(ii - 1 === 0, "-(int8_t, number) failed");
  console.assert(1 - ii === 0, "-(number, int8_t) failed");

  console.assert(i * ii === -1, "*(int8_t, int8_t) failed");
  console.assert(ii * i === -1, "*(int8_t, int8_t) failed");
  console.assert(i * 2.1 === -2.1, "*(int8_t, number) failed");
  console.assert(2.1 * i === -2.1, "*(number, int8_t) failed");

  console.assert(i / ii === -1, "/(int8_t, int8_t) failed");
  console.assert(ii / i === -1, "/(int8_t, int8_t) failed");
  console.assert(i / 2 === -0.5, "/(int8_t, number) failed");
  console.assert(2.2 / i === -2.2, "/(number, int8_t) failed");

  console.assert(i % ii === 0, "%(int8_t, int8_t) failed");
  console.assert(ii % i === 0, "%(int8_t, int8_t) failed");
  console.assert(i % 2 === -1, "%(int8_t, number) failed");
  console.assert(2 % i === 0, "%(number, int8_t) failed");

  console.assert(i < ii, "int8_t < int8_t failed");
  console.assert(i < 3, "int8_t < number failed");
  console.assert(-2 < i, "number < int8_t failed");

  console.assert(ii > i, "int8_t > int8_t failed");
  console.assert(ii > 0, "int8_t > number failed");
  console.assert(3 > i, "number > int8_t failed");

  const iii: int8_t = 1;
  console.assert(ii <= iii, "int8_t <= int8_t failed");
  console.assert(iii <= 1, "int8_t <= number failed");
  console.assert(1 <= iii, "number <= int8_t failed");

  console.assert(ii >= iii, "int8_t >= int8_t failed");
  console.assert(iii >= 1, "int8_t >= number failed");
  console.assert(1 >= iii, "number >= int8_t failed");

  console.assert(ii !== i, "int8_t !== int8_t failed");
  console.assert(ii !== 2, "int8_t !== number failed");
  console.assert(2 !== i, "number !== int8_t failed");
  console.assert(ii === 1, "int8_t === number failed");
  console.assert(1 === ii, "number === int8_t failed");

  i = INT8_MAX;
  i = i + 1;
  console.assert(i === INT8_MIN, "int8_t upper bound overflow failed");

  i = INT8_MIN;
  i = i - 1;
  console.assert(i === INT8_MAX, "int8_t lower bound overflow failed");

  i = 0;
  console.assert((i && ii) === 0, "&&(int8_t, int8_t) failed");
  console.assert((0 && ii) === 0, "&&(int8_t, int8_t) failed");

  i = 1;
  console.assert((i || ii) === 1, "||(int8_t, int8_t) failed");
  console.assert((0 || ii) === ii, "||(int8_t, int8_t) failed");

  i = 0;
  console.assert((i || ii) === ii, "||(int8_t, int8_t) failed");
  console.assert((1 || i) === 1, "||(int8_t, int8_t) failed");
}

// uint8_t tests
{
  const UINT8_MIN: uint8_t = 0;
  const UINT8_MAX: uint8_t = 255;

  let i: uint8_t = -1;
  const ii: uint8_t = 1;

  console.assert(i === UINT8_MAX, "uint8_t: negative number as initializer failed");

  console.assert(i + ii === 0, "+(uint8_t, uint8_t) failed");
  console.assert(ii + i === 0, "+(uint8_t, uint8_t) failed");
  console.assert(i + 1 === 0, "+(uint8_t, number) failed");
  console.assert(1 + i === 0, "+(number, uint8_t) failed");

  console.assert(i - ii === UINT8_MAX - 1, "-(uint8_t, uint8_t) failed");
  console.assert(ii - i === 2, "-(uint8_t, uint8_t) failed");
  console.assert(ii - 1 === 0, "-(uint8_t, number) failed");
  console.assert(1 - ii === 0, "-(number, uint8_t) failed");
  console.assert(i - 1 === UINT8_MAX - 1, "-(uint8_t, number) failed");
  console.assert(1 - i === 2, "-(number, uint8_t) failed");

  console.assert(i * ii === UINT8_MAX, "*(uint8_t, uint8_t) failed");
  console.assert(ii * i === UINT8_MAX, "*(uint8_t, uint8_t) failed");

  console.assert(i * 2 === 510, "*(uint8_t, number) failed");
  console.assert(2 * i === 510, "*(number, uint8_t) failed");

  console.assert(i / ii === UINT8_MAX, "/(uint8_t, uint8_t) failed");
  console.assert(ii / i === 1 / UINT8_MAX, "/(uint8_t, uint8_t) failed");
  console.assert(i / 2 === UINT8_MAX / 2, "/(uint8_t, number) failed");
  console.assert(UINT8_MAX / i === 1, "/(number, uint8_t) failed");

  console.assert(i % ii === 0, "%(uint8_t, uint8_t) failed");
  console.assert(ii % i === 1, "%(uint8_t, uint8_t) failed");
  console.assert(i % 2 === 1, "%(uint8_t, number) failed");
  console.assert(2 % i === 2, "%(number, uint8_t) failed");

  i = UINT8_MAX;
  i = i + 1;
  console.assert(i === UINT8_MIN, "uint8_t upper bound overflow failed");

  i = UINT8_MIN;
  i = i - 1;
  console.assert(i === UINT8_MAX, "uint8_t lower bound overflow failed");
}

// int16_t tests
{
  const INT16_MIN: int16_t = -32768;
  const INT16_MAX: int16_t = 32767;

  let i: int16_t = -1;
  const ii: int16_t = 1;

  console.assert(i + ii === 0, "+(int16_t, int16_t) failed");
  console.assert(ii + i === 0, "+(int16_t, int16_t) failed");
  console.assert(i + 1 === 0, "+(int16_t, number) failed");
  console.assert(1 + i === 0, "+(number, int16_t) failed");

  console.assert(i - ii === -2, "-(int16_t, int16_t) failed");
  console.assert(ii - i === 2, "-(int16_t, int16_t) failed");
  console.assert(ii - 1 === 0, "-(int16_t, number) failed");
  console.assert(1 - ii === 0, "-(number, int16_t) failed");

  console.assert(i * ii === -1, "*(int16_t, int16_t) failed");
  console.assert(ii * i === -1, "*(int16_t, int16_t) failed");
  console.assert(i * 2.1 === -2.1, "*(int16_t, number) failed");
  console.assert(2.1 * i === -2.1, "*(number, int16_t) failed");

  console.assert(i / ii === -1, "/(int16_t, int16_t) failed");
  console.assert(ii / i === -1, "/(int16_t, int16_t) failed");
  console.assert(i / 2 === -0.5, "/(int16_t, number) failed");
  console.assert(2.2 / i === -2.2, "/(number, int16_t) failed");

  console.assert(i % ii === 0, "%(int16_t, int16_t) failed");
  console.assert(ii % i === 0, "%(int16_t, int16_t) failed");
  console.assert(i % 2 === -1, "%(int16_t, number) failed");
  console.assert(2 % i === 0, "%(number, int16_t) failed");

  i = INT16_MAX;
  i = i + 1;
  console.assert(i === INT16_MIN, "int16_t upper bound overflow failed");

  i = INT16_MIN;
  i = i - 1;
  console.assert(i === INT16_MAX, "int16_t lower bound overflow failed");
}

// uint16_t tests
{
  const UINT16_MIN: uint16_t = 0;
  const UINT16_MAX: uint16_t = 65535;

  let i: uint16_t = -1;
  const ii: uint16_t = 1;

  console.assert(i === UINT16_MAX, "uint16_t: negative number as initializer failed");

  console.assert(i + ii === 0, "+(uint16_t, uint16_t) failed");
  console.assert(ii + i === 0, "+(uint16_t, uint16_t) failed");
  console.assert(i + 1 === 0, "+(uint16_t, number) failed");
  console.assert(1 + i === 0, "+(number, uint16_t) failed");

  console.assert(i - ii === UINT16_MAX - 1, "-(uint16_t, uint16_t) failed");
  console.assert(ii - i === 2, "-(uint16_t, uint16_t) failed");
  console.assert(ii - 1 === 0, "-(uint16_t, number) failed");
  console.assert(1 - ii === 0, "-(number, uint16_t) failed");
  console.assert(i - 1 === UINT16_MAX - 1, "-(uint16_t, number) failed");
  console.assert(1 - i === 2, "-(number, uint16_t) failed");

  console.assert(i * ii === UINT16_MAX, "*(uint16_t, uint16_t) failed");
  console.assert(ii * i === UINT16_MAX, "*(uint16_t, uint16_t) failed");

  console.assert(i * 2 === UINT16_MAX * 2, "*(uint16_t, number) failed");
  console.assert(2 * i === UINT16_MAX * 2, "*(number, uint16_t) failed");

  console.assert(i / ii === UINT16_MAX, "/(uint16_t, uint16_t) failed");
  console.assert(ii / i === 1 / UINT16_MAX, "/(uint16_t, uint16_t) failed");
  console.assert(i / 2 === UINT16_MAX / 2, "/(uint16_t, number) failed");
  console.assert(UINT16_MAX / i === 1, "/(number, uint16_t) failed");

  console.assert(i % ii === 0, "%(uint16_t, uint16_t) failed");
  console.assert(ii % i === 1, "%(uint16_t, uint16_t) failed");
  console.assert(i % 2 === 1, "%(uint16_t, number) failed");
  console.assert(2 % i === 2, "%(number, uint16_t) failed");

  i = UINT16_MAX;
  i = i + 1;
  console.assert(i === UINT16_MIN, "uint16_t upper bound overflow failed");

  i = UINT16_MIN;
  i = i - 1;
  console.assert(i === UINT16_MAX, "uint16_t lower bound overflow failed");
}

// int32_t tests
{
  const INT32_MIN: int32_t = -2147483648;
  const INT32_MAX: int32_t = 2147483647;

  let i: int32_t = -1;
  const ii: int32_t = 1;

  console.assert(i + ii === 0, "+(int32_t, int32_t) failed");
  console.assert(ii + i === 0, "+(int32_t, int32_t) failed");
  console.assert(i + 1 === 0, "+(int32_t, number) failed");
  console.assert(1 + i === 0, "+(number, int32_t) failed");

  console.assert(i - ii === -2, "-(int32_t, int32_t) failed");
  console.assert(ii - i === 2, "-(int32_t, int32_t) failed");
  console.assert(ii - 1 === 0, "-(int32_t, number) failed");
  console.assert(1 - ii === 0, "-(number, int32_t) failed");

  console.assert(i * ii === -1, "*(int32_t, int32_t) failed");
  console.assert(ii * i === -1, "*(int32_t, int32_t) failed");
  console.assert(i * 2.1 === -2.1, "*(int32_t, number) failed");
  console.assert(2.1 * i === -2.1, "*(number, int32_t) failed");

  console.assert(i / ii === -1, "/(int32_t, int32_t) failed");
  console.assert(ii / i === -1, "/(int32_t, int32_t) failed");
  console.assert(i / 2 === -0.5, "/(int32_t, number) failed");
  console.assert(2.2 / i === -2.2, "/(number, int32_t) failed");

  console.assert(i % ii === 0, "%(int32_t, int32_t) failed");
  console.assert(ii % i === 0, "%(int32_t, int32_t) failed");
  console.assert(i % 2 === -1, "%(int32_t, number) failed");
  console.assert(2 % i === 0, "%(number, int32_t) failed");

  i = INT32_MAX;
  i = i + 1;
  console.assert(i === INT32_MIN, "int32_t upper bound overflow failed");

  i = INT32_MIN;
  i = i - 1;
  console.assert(i === INT32_MAX, "int32_t lower bound overflow failed");
}

// uint32_t tests
{
  const UINT32_MIN: uint32_t = 0;
  const UINT32_MAX: uint32_t = 4294967295;
  let i: uint32_t = -1;
  const ii: uint32_t = 1;

  console.assert(i === UINT32_MAX, "uint32_t: negative number as initializer failed");

  console.assert(i + ii === 0, "+(uint32_t, uint32_t) failed");
  console.assert(ii + i === 0, "+(uint32_t, uint32_t) failed");
  console.assert(i + 1 === 0, "+(uint32_t, number) failed");
  console.assert(1 + i === 0, "+(number, uint32_t) failed");

  console.assert(i - ii === UINT32_MAX - 1, "-(uint32_t, uint32_t) failed");
  console.assert(ii - i === 2, "-(uint32_t, uint32_t) failed");
  console.assert(ii - 1 === 0, "-(uint32_t, number) failed");
  console.assert(1 - ii === 0, "-(number, uint32_t) failed");
  console.assert(i - 1 === UINT32_MAX - 1, "-(uint32_t, number) failed");
  console.assert(1 - i === 2, "-(number, uint32_t) failed");

  console.assert(i * ii === UINT32_MAX, "*(uint32_t, uint32_t) failed");
  console.assert(ii * i === UINT32_MAX, "*(uint32_t, uint32_t) failed");

  console.assert(i * 2 === UINT32_MAX * 2, "*(uint32_t, number) failed");
  console.assert(2 * i === UINT32_MAX * 2, "*(number, uint32_t) failed");

  console.assert(i / ii === UINT32_MAX, "/(uint32_t, uint32_t) failed");
  console.assert(ii / i === 1 / UINT32_MAX, "/(uint32_t, uint32_t) failed");
  console.assert(i / 2 === UINT32_MAX / 2, "/(uint32_t, number) failed");
  console.assert(UINT32_MAX / i === 1, "/(number, uint32_t) failed");

  console.assert(i % ii === 0, "%(uint32_t, uint32_t) failed");
  console.assert(ii % i === 1, "%(uint32_t, uint32_t) failed");
  console.assert(i % 2 === 1, "%(uint32_t, number) failed");
  console.assert(2 % i === 2, "%(number, uint32_t) failed");

  i = UINT32_MAX;
  i = i + 1;
  console.assert(i === UINT32_MIN, "uint32_t upper bound overflow failed");

  i = UINT32_MIN;
  i = i - 1;
  console.assert(i === UINT32_MAX, "uint32_t lower bound overflow failed");
}

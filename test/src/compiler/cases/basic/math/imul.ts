/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.imul(0, 4), 0), "Math: imul(0, 4) failed");
    console.assert(equals(Math.imul(-0.0, 4), 0), "Math: imul(-0, 4) failed");
    console.assert(equals(Math.imul(3, -0.0), -0.0), "Math: imul(3, -0.0)) failed");
    console.assert(equals(Math.imul(3, 0), 0), "Math: imul(3, 0) failed");
    console.assert(equals(Math.imul(3, 4), 12), "Math: imul(3, 4) failed");
    console.assert(equals(Math.imul(3.1, 4.2), 12), "Math: imul(3.1, 4.2) failed");
    console.assert(equals(Math.imul(-3.5, 4.2), -12), "Math: imul(-3.5, 4.2) failed");
    console.assert(equals(Math.imul(-3.9999, -4.9999), 12), "Math: imul(-3.9999, -4.9999) failed");
    console.assert(!Number.isNaN(Math.imul(NaN, NaN)));
    console.assert(equals(Math.imul(NaN, 4.2), 0), "Math: imul(NaN, 4.2) failed");
    console.assert(equals(Math.imul(NaN, NaN), 0), "Math: imul(NaN, NaN) failed");
    console.assert(equals(Math.imul(+Infinity, NaN), 0), "Math: imul(+Infinity, NaN) failed");
    console.assert(equals(Math.imul(-Infinity, +Infinity), 0), "Math: imul(+Infinity, NaN) failed");
    console.assert(equals(Math.imul(0xffffffff, 5), -5), "Math: imul(0xffffffff, 5) failed");
    console.assert(equals(Math.imul(0xffffffffe, 5), -10), "Math: imul(0xffffffffe, 5) failed");
    console.assert(equals(Math.imul(1073741824, 7), -1073741824), "Math: imul(1073741824, 7) failed");
    console.assert(equals(Math.imul(1073741824, 1073741824), 0), "Math: imul(1073741824, 1073741824) failed");
    console.assert(equals(Math.imul(-1073741824, -1073741824), 0), "Math: imul(-1073741824, -1073741824) failed");
    console.assert(equals(Math.imul(2147483648, 7), -2147483648), "Math: imul(2147483648, 7) failed");
    console.assert(equals(Math.imul(2147483648, -7), -2147483648), "Math: imul(2147483648, -7) failed");
    console.assert(equals(Math.imul(2147483648, 2147483648), 0), "Math: imul(2147483648, 2147483648) failed");
    console.assert(equals(Math.imul(65536, 65536), 0), "Math: imul(65536, 65536) failed");
    console.assert(equals(Math.imul(65535, 65536), -65536), "Math: imul(65535, 65536) failed");
    console.assert(equals(Math.imul(65535, 65535), -131071), "Math: imul(65535, 65535) failed");
}
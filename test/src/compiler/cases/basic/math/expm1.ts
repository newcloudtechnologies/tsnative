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

import {equals} from "./utils"

{
    console.assert(equals(Math.expm1(1), 1.718281828459045), "Math expm1(1) failed");
    console.assert(equals(Math.expm1(-1), 0.36787944117144233 - 1), "Math expm1(-1) failed");
    console.assert(equals(Math.expm1(0), 0), "Math Math.expm1(0) failed");
    console.assert(equals(Math.expm1(-0.0), -0.0), "Math Math.expm1(-0) failed");
    console.assert(equals(Math.expm1(10), 22025.465794806718), "Math expm1(10) failed");
    console.assert(Number.isNaN(Math.expm1(NaN)), "Math expm1(NaN) failed");
    console.assert(equals(Math.expm1(-Infinity), -1), "Math expm1(-Infinity) failed");
    console.assert(Math.expm1(+Infinity) === +Infinity, "Math expm1(+Infinity) failed");
    console.assert((1 / Math.expm1(-0.0)) === -Infinity, "Math 1 / expm1(-0.0) failed");
    console.assert(1 / Math.expm1(0.0) === +Infinity, "Math 1 / expm1(0.0) failed");
}
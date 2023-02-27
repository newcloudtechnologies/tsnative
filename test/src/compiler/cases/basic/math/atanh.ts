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

import {equals} from "./utils"

{
    console.assert(equals(Math.atanh(-0.0), 0), "Math: atanh(-0) failed");
    console.assert(equals(Math.atanh(0), 0), "Math: atanh(0) failed");
    console.assert(equals(Math.atanh(0.9), 1.4722194895832204), "Math: atanh(0.9), failed");
    console.assert(Number.isNaN(Math.atanh(-1.9)), "Math: atanh(-1.9), failed");
    console.assert(Number.isNaN(Math.atanh(1.9)), "Math: atanh(1.9), failed");
    console.assert(Number.isNaN(Math.atanh(NaN)), "Math: atanh(NaN), failed");
    console.assert(Number.isNaN(Math.atanh(-10)), "Math: atanh(-10), failed");
    console.assert(Number.isNaN(Math.atanh(10)), "Math: atanh(10), failed");
    console.assert(Number.isNaN(Math.atanh(-Infinity)), "Math: atanh(-Infinity), failed");
    console.assert(Number.isNaN(Math.atanh(+Infinity)), "Math: atanh(+Infinity), failed");
    console.assert(Math.atanh(-1) === -Infinity, "Math: atanh(-1), failed");
    console.assert(Math.atanh(+1) === +Infinity, "Math: atanh(+1), failed");
    console.assert(1 / Math.atanh(-0) === -Infinity, "Math: 1/atanh(-0), failed");
    console.assert(1 / Math.atanh(+0) === +Infinity, "Math: 1/atanh(+0), failed");
}
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
    console.assert(equals(Math.log2(1), 0), "Math: log2(1) failed");
    console.assert(equals(Math.log2(128), 7), "Math: log2(100) failed");
    console.assert(Math.log2(-0) === -Infinity, "Math: log2(-0) failed");
    console.assert(Math.log2(+0) === -Infinity, "Math: log2(-0) failed");
    console.assert(Number.isNaN(Math.log2(-0.9)), "Math: log2(-0.9) failed");
    console.assert(Number.isNaN(Math.log2(NaN)), "Math: log2(NaN) failed");
    console.assert(Number.isNaN(Math.log2(-10)), "Math: log2(-10) failed");
    console.assert(Number.isNaN(Math.log2(-Infinity)), "Math: log2(-Infinity) failed");
    console.assert(Math.log2(+Infinity) === +Infinity, "Math: log2(+Infinity) failed");
}
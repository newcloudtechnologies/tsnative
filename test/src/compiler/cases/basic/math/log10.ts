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
    console.assert(equals(Math.log10(1), 0), "Math: log10(1) failed");
    console.assert(equals(Math.log10(10), 1), "Math: log10(10) failed");
    console.assert(equals(Math.log10(100), 2), "Math: log10(100) failed");
    console.assert(Math.log10(-0) === -Infinity, "Math: log10(-0) failed");
    console.assert(Math.log10(+0) === -Infinity, "Math: log10(-0) failed");
    console.assert(Number.isNaN(Math.log10(-0.9)), "Math: log10(-0.9) failed");
    console.assert(Number.isNaN(Math.log10(NaN)), "Math: log10(NaN) failed");
    console.assert(Number.isNaN(Math.log10(-10)), "Math: log10(-10) failed");
    console.assert(Math.log10(+Infinity) === +Infinity, "Math: log10(+Infinity) failed");
}
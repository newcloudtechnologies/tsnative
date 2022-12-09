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
    console.assert(equals(Math.asin(1.0), 1.5707963267948966), "Math: asin(1.0) failed");
    console.assert(equals(Math.asin(-0.5), -0.5235987755982989), "Math: asin(-0.5), failed");
    console.assert(equals(Math.asin(0.0), 0), "Math: asin(0.0) failed");
    console.assert(equals(Math.asin(-0.0), 0), "Math: asin(-0.0) failed");
    console.assert(Number.isNaN(Math.asin(NaN)), "Math: asin(NaN) failed");
    console.assert(Number.isNaN(Math.asin(1.000000000000001)), "Math: asin(1.000000000000001) failed");
    console.assert(Number.isNaN(Math.asin(-1.000000000000001)), "Math: asin(-1.000000000000001) failed");
    console.assert(Number.isNaN(Math.asin(2)), "Math: asin(2) failed");
    console.assert(Number.isNaN(Math.asin(-2)), "Math: asin(-2) failed");
    console.assert(Number.isNaN(Math.asin(Infinity)), "Math: asin(Infinity) failed");
    console.assert(Number.isNaN(Math.asin(-Infinity)), "Math: asin(Infinity) failed");
}
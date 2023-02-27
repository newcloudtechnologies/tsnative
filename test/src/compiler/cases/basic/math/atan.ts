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
    console.assert(equals(Math.atan(1.0), 0.7853981633974483), "Math: atan(1.0) failed");
    console.assert(equals(Math.atan(10000), 1.5706963267952299), "Math: atan(10000), failed");
    console.assert(equals(Math.atan(0.0), 0), "Math: atan(0.0) failed");
    console.assert(equals(Math.atan(-0.0), -0), "Math: atan(-0.0) failed");
    console.assert(Number.isNaN(Math.atan(NaN)), "Math: atan(NaN) failed");
    console.assert(equals(Math.atan(+Infinity), Math.PI / 2), "Math: atan(+Infinity) failed");
    console.assert(equals(Math.atan(-Infinity), -Math.PI / 2), "Math: atan(+Infinity) failed");
}
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
    console.assert(equals(Math.sign(3), 1), "Math: sign(3) failed");
    console.assert(equals(Math.sign(-3), -1), "Math: sign(-3) failed");
    console.assert(equals(Math.sign(-0), -0.0), "Math: sign(-0) failed");
    console.assert(equals(Math.sign(0), 0.0), "Math: sign(0) failed");
    console.assert(Number.isNaN(Math.sign(NaN)), "Math: sign(NaN) failed");
    console.assert(equals(Math.sign(-0.000001), -1), "Math: sign(-0.000001) failed");
    console.assert(equals(Math.sign(+Infinity), 1), "Math: sign(+Infinity) failed");
    console.assert(equals(Math.sign(-Infinity), -1), "Math: sign(+Infinity) failed");
}
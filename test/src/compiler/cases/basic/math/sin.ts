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
    console.assert(equals(Math.sin(-0), -0.0), "Math: sin(-0) failed");
    console.assert(equals(Math.sin(0), 0.0), "Math: sin(0) failed");
    console.assert(equals(Math.sin(3 * Math.PI / 2), -1), "Math: sin(3 * pi / 2) failed");
    console.assert(equals(Math.sin(-3 * Math.PI / 2), 1), "Math: sin(-3 * pi / 2) failed");
    console.assert(equals(Math.sin(6 * Math.PI), 0, 2000 * EPS), "Math: sin(6 * pi) failed");
    console.assert(Number.isNaN(Math.sin(NaN)), "Math: sin(NaN) failed");
    console.assert(Number.isNaN(Math.sin(Infinity)), "Math: sin(Infinity) failed");
    console.assert(Number.isNaN(Math.sin(-Infinity)), "Math: sin(-Infinity) failed");
}
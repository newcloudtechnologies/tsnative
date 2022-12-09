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

import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.tan(-0), -0.0), "Math: tan(-0) failed");
    console.assert(equals(Math.tan(0), 0.0), "Math: tan(0) failed");
    console.assert(equals(Math.tan(Math.PI / 4), 1), "Math: tan(PI / 4) failed");
    console.assert(equals(Math.tan(6 * Math.PI), 0, 200 * EPS), "Math: tan(6 * pi) failed");
    console.assert(Number.isNaN(Math.tan(NaN)), "Math: tan(NaN) failed");
    console.assert(Number.isNaN(Math.tan(Infinity)), "Math: tan(Infinity) failed");
    console.assert(Number.isNaN(Math.tan(-Infinity)), "Math: tan(-Infinity) failed");
}
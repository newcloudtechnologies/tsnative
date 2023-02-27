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
    console.assert(equals(Math.sqrt(-0), -0.0), "Math: sqrt(-0) failed");
    console.assert(equals(Math.sqrt(0), 0.0), "Math: sqrt(0) failed");
    console.assert(equals(Math.sqrt(1), 1), "Math: sqrt(1) failed");
    console.assert(equals(Math.sqrt(10), 3.1622776601683795), "Math: sqrt(10) failed");
    console.assert(Number.isNaN(Math.sqrt(NaN)), "Math: sqrt(NaN) failed");
    console.assert(Number.isNaN(Math.sqrt(-0.000000000000001)), "Math: sqrt(-0.000000000000001) failed");
    console.assert(Number.isNaN(Math.sqrt(-1)), "Math: sqrt(-1) failed");
    console.assert(Number.isNaN(Math.sqrt(-Infinity)), "Math: sqrt(-Infinity) failed");
    console.assert(Math.sqrt(+Infinity) === +Infinity, "Math: sqrt(+Infinity) failed");
}
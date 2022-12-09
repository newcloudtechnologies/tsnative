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
    console.assert(equals(Math.abs(-1), 1), "Math: abs(-1) failed");
    console.assert(equals(Math.abs(1), 1), "Math: abs(1) failed");
    console.assert(equals(Math.abs(0), 0), "Math: abs(0) failed");
    console.assert(equals(Math.abs(-0.0), 0), "Math: abs(-0) failed");
    console.assert(equals(Math.abs(-0.000001), 0.000001), "Math: abs(-0.000001) failed");
    console.assert(equals(Math.abs(-1e-17), 1e-17), "Math: abs(-1e-17) failed");
    console.assert(Number.isNaN(Math.abs(NaN)), "Math: abs(NaN) failed");
    console.assert(Math.abs(-Infinity) === +Infinity, "Math: abs(-Infinity) failed");
    console.assert(Math.abs(Infinity) === +Infinity, "Math: abs(Infinity) failed");
}
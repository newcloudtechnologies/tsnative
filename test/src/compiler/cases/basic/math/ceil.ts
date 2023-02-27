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
    console.assert(equals(Math.ceil(2.4), 3.0), "Math: ceil(2.4) failed");
    console.assert(equals(Math.ceil(-2.4), -2.0), "Math: ceil(-2.4) failed");
    console.assert(equals(Math.ceil(-1 + 1e-8), 0), "Math: ceil(-1 + 1e-8) failed");
    console.assert(equals(Math.ceil(1 - 1e-8), 1), "Math: ceil(1 - 1e-8) failed");
    console.assert(equals(Math.ceil(0), 0), "Math: ceil(0) failed");
    console.assert(equals(Math.ceil(-0.0), 0), "Math: ceil(-0) failed");
    console.assert(Number.isNaN(Math.ceil(NaN)), "Math: ceil(NaN) failed");
    console.assert(Math.ceil(+Infinity) === +Infinity, "Math: ceil(+Infinity) failed");
    console.assert(Math.ceil(-Infinity) === -Infinity, "Math: ceil(-Infinity) failed");
    console.assert(equals(Math.ceil(-0.000000000000001), -0), "Math: ceil(-0.000000000000001) failed");
    console.assert(equals(Math.ceil(-0.999999999999999), -0), "Math: ceil(-0.999999999999999) failed");
    console.assert(equals(Math.ceil(-0.5), -0), "Math: ceil(-0.5) failed");
    console.assert(equals(Math.ceil(- 1 / 10.0), -Math.floor(1 / 10.0)),
        "Math: equals(Math.ceil(- 1 / 10.0), -Math.floor(1 / 10.0) failed");
}
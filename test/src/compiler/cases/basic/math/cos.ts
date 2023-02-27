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
    console.assert(equals(Math.cos(+0.0), 1), "Math.cos(0) failed");
    console.assert(equals(Math.cos(-0.0), 1), "Math.cos(-0) failed");
    console.assert(equals(Math.cos(Math.PI / 3), 0.5), "Math.cos(pi/3) failed");
    console.assert(equals(Math.cos(Math.PI), -1), "Math.cos(pi) failed");
    console.assert(equals(Math.cos(Math.PI / 2), 0), "Math.cos(pi/2) failed");
    console.assert(equals(Math.cos(2 * Math.PI), 1), "Math.cos(2*pi) failed");
    console.assert(Number.isNaN(Math.cos(NaN)), "Math.cos(NaN) failed");
    console.assert(Number.isNaN(Math.cos(+Infinity)), "Math.cos(Infinity) failed");
    console.assert(Number.isNaN(Math.cos(-Infinity)), "Math.cos(Infinity) failed");
}
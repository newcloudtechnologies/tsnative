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
    console.assert(equals(Math.exp(1), 2.718281828459045), "Math exp(1) failed");
    console.assert(equals(Math.exp(-1), 0.36787944117144233), "Math exp(-1) failed");
    console.assert(equals(Math.exp(0), 1), "Math Math.exp(0) failed");
    console.assert(equals(Math.exp(-0.0), 1), "Math Math.exp(-0) failed");
    console.assert(equals(Math.exp(10), 22026.465794806718), "Math exp(10) failed");
    console.assert(Number.isNaN(Math.exp(NaN)), "Math exp(NaN) failed");
    console.assert(Math.exp(+Infinity) === +Infinity, "Math exp(+Infinity) failed");
    console.assert(equals(Math.exp(-Infinity), 0), "Math exp(-Infinity) failed");
}
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
    console.assert(equals(Math.fround(0), 0), "Math: fround(0) failed");
    console.assert(equals(Math.fround(-0.0), -0.0), "Math: fround(-0) failed");
    console.assert(equals(Math.fround(1), 1.0), "Math: floor(1) failed");
    console.assert(equals(Math.fround(1.337), 1.3370000123977661), "Math: fround(1.337) failed");
    console.assert(Math.fround(Infinity) === Infinity, "Math: fround(Infinity) failed");
    console.assert(Number.isNaN(Math.fround(NaN)), "Math: fround(NaN) failed");

    console.assert(equals(Math.fround(1.0000003576278687), 1.0000003576278687),
        "Math: fround(1.0000003576278687) failed");

    console.assert(equals(Math.fround(-1.0000003576278687), -1.0000003576278687),
        "Math: fround(-1.0000003576278687) failed");
}
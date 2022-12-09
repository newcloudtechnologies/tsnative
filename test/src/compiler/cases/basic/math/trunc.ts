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
    console.assert(equals(Math.trunc(-0), -0.0), "Math: trunc(-0) failed");
    console.assert(equals(Math.trunc(0), 0.0), "Math: trunc(0) failed");
    console.assert(equals(Math.trunc(2 - EPS), 1), "Math: trunc(2 - eps) failed");
    console.assert(equals(Math.trunc(2 + EPS), 2), "Math: trunc(2 + eps) failed");
    console.assert(equals(Math.trunc(-2 - EPS), -2), "Math: trunc(-2 - eps) failed");
    console.assert(equals(Math.trunc(-2 + EPS), -1), "Math: trunc(-2 + eps) failed");
    console.assert(Math.trunc(+Infinity) === +Infinity, "Math: trunc(+Infinity) failed");
    console.assert(Math.trunc(-Infinity) === -Infinity, "Math: trunc(-Infinity) failed");
    console.assert(Number.isNaN(Math.trunc(NaN)), "Math: trunc(NaN) failed");
    console.assert(equals(Math.trunc(-0.9), -0), "Math: trunc(-0.9) failed");
    console.assert(equals(Math.trunc(0.9), 0), "Math: trunc(0.9) failed");
    console.assert(1 /Math.trunc(0.02047410048544407) === +Infinity, "Math: 1/trunc(0.02047410048544407) failed");
    console.assert(1 /Math.trunc(0.00000000000000001) === +Infinity, "Math: 1/trunc(0.00000000000000001) failed");
    console.assert(1 /Math.trunc(0.9999999999999999) === +Infinity, "Math: 1/trunc(0.9999999999999999) failed");
    console.assert(1 /Math.trunc(EPS) === +Infinity, "Math: 1/trunc(EPS) failed");
    console.assert(1 /Math.trunc(-EPS) === -Infinity, "Math: 1/trunc(-EPS) failed");
    console.assert(1 / Math.trunc(Number.MIN_VALUE) === +Infinity, "Math: 1/trunc(MIN_VALUE) failed");

    console.assert(equals(Math.trunc(Number.MAX_VALUE), Math.floor(Number.MAX_VALUE)),
        "Math: trunc(MAX_VALUE) === floor(MAX_VALUE) failed");
    console.assert(equals(Math.trunc(-Number.MAX_VALUE), Math.ceil(-Number.MAX_VALUE)),
        "Math: trunc(-MAX_VALUE) === ceil(-MAX_VALUE) failed");

}
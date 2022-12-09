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
    console.assert(equals(Math.round(-0.0), -0.0), "Math: round(-0) failed");
    console.assert(equals(Math.round(0), 0), "Math: round(0) failed");
    console.assert(equals(Math.round(-0.2), 0), "Math: round(-0.2) failed");
    console.assert(equals(Math.round(-0.5), -0.0), "Math: round(-0.5) failed");
    console.assert(equals(Math.round(-0.6), -1), "Math: round(-0.6) failed");
    console.assert(equals(Math.round(0.2), 0), "Math: round(0.2) failed");
    console.assert(equals(Math.round(0.5), 1), "Math: round(0.5) failed");
    console.assert(equals(Math.round(0.7), 1), "Math: round(0.7) failed");
    console.assert(Number.isNaN(Math.round(NaN)), "Math: round(NaN) failed");
    console.assert(Math.round(+Infinity) === +Infinity, "Math: round(+Infinity) failed");
    console.assert(Math.round(-Infinity) === -Infinity, "Math: round(-Infinity) failed");
    console.assert(equals(Math.round(1 / 10.0), Math.floor(1 / 10 + 0.5)), "Math: round(0.1) === floor(0.6) failed");
    console.assert((1 / Math.round(-0.5)) === 1 / -0, "Math: round(-0.5) === 1/-0 failed");
    console.assert((1 / Math.round(-0.25)) === 1 / -0, "Math: round(-0.25) === 1/-0 failed");


    {
        const x = -(2 / EPS - 1);
        console.assert(equals(Math.round(x), x), "Math: round(-(2 / EPS - 1)) === x failed");
    }
    {
        const x = -(1.5 / EPS - 1);
        console.assert(equals(Math.round(x), x), "Math: round(-(1.5 / EPS - 1)) === x failed");
    }
    {
        const x = -(1 / EPS + 1);
        console.assert(equals(Math.round(x), x), "Math: round(-(1 / EPS + 1)) === x failed");
    }
    {
        const x = 1 / EPS + 1;
        console.assert(equals(Math.round(x), x), "Math: round(1 / EPS + 1) === x failed");
    }
}
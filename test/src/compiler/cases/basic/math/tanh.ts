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
    console.assert(equals(Math.tanh(-0), -0.0), "Math: tanh(-0) failed");
    console.assert(equals(Math.tanh(0), 0.0), "Math: tanh(0) failed");
    console.assert(equals(Math.tanh(1), 0.7615941559557649), "Math: tanh(1) failed");
    console.assert(equals(Math.tanh(10), 0.9999999958776927), "Math: tanh(10) failed");
    console.assert(Number.isNaN(Math.tanh(NaN)), "Math: tanh(NaN) failed");
    console.assert(equals(Math.tanh(-Infinity), -1), "Math: tanh(-Infinity) failed");
    console.assert(equals(Math.tanh(Infinity), 1), "Math: tanh(Infinity) failed");
    console.assert(1 / Math.tanh(-0) === -Infinity, "Math: tanh(Infinity) failed");
    console.assert(1 / Math.tanh(0) === Infinity, "Math: tanh(Infinity) failed");
}
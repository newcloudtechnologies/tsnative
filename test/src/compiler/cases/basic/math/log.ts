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
    console.assert(equals(Math.log(1), 0), "Math: log(1) failed");
    console.assert(equals(Math.log(100), 4.605170185988092), "Math: log(100) failed");
    console.assert(Number.isNaN(Math.log(NaN)), "Math: log(NaN) failed");
    console.assert(Number.isNaN(Math.log(-0.000000000000001)), "Math: log(-0.000000000000001) failed");
    console.assert(Number.isNaN(Math.log(-1)), "Math: log(-1) failed");
    console.assert(Number.isNaN(Math.log(-Infinity)), "Math: log(-Infinity) failed");
    console.assert(Math.log(+0) === -Infinity, "Math: log(+0) failed");
    console.assert(Math.log(-0) === -Infinity, "Math: log(-0) failed");
    console.assert(Math.log(+Infinity) === +Infinity, "Math: log(+Infinity) failed");
}
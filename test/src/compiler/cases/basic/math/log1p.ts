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
    console.assert(equals(Math.log1p(0), 0), "Math: log1p(0) failed");
    console.assert(equals(Math.log1p(-0.0), 0), "Math: log1p(-0.0) failed");
    console.assert(equals(Math.log1p(1), 0.6931471805599453), "Math: log1p(1) failed");
    console.assert(equals(Math.log1p(100), 4.61512051684126), "Math: log1p(100) failed");
    console.assert(Number.isNaN(Math.log1p(NaN)), "Math: log1p(NaN) failed");
    console.assert(Number.isNaN(Math.log1p(-1.000001)), "Math: log1p(-1.000001) failed");
    console.assert(Number.isNaN(Math.log1p(-2)), "Math: log1p(-2) failed");
    console.assert(Number.isNaN(Math.log1p(-Infinity)), "Math: log1p(-Infinity) failed");
    console.assert(Math.log1p(-1) === -Infinity, "Math: log1p(-1) failed");
    console.assert(Math.log1p(+Infinity) === +Infinity, "Math: log1p(+Infinity) failed");

}
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
    console.assert(equals(Math.cosh(1), 1.5430806348152437), "Math cosh(1) failed");
    console.assert(equals(Math.cosh(-1), 1.5430806348152437), "Math cosh(-1) failed");
    console.assert(equals(Math.cosh(0), 1), "Math cosh(0) failed");
    console.assert(equals(Math.cosh(-0.0), 1), "Math cosh(-0) failed");
    console.assert(Number.isNaN(Math.cosh(NaN)), "Math cosh(NaN) failed");
    console.assert(Math.cosh(-Infinity) === Infinity, "Math cosh(-Infinity) failed");
    console.assert(Math.cosh(+Infinity) === +Infinity, "Math cosh(+Infinity) failed");
}
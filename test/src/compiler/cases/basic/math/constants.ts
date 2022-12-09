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
    console.assert(equals(Math.E, 2.718281828459045), "Math: E. Case [A]. failed");
    console.assert(equals(Math.exp(1), Math.E), "Math: E. exp(1) !== e. failed");
    console.assert(equals(Math.LOG2E, 1.44269504088896340736), "Math: LOG2E. Case[] failed");
    console.assert(equals(Math.LOG10E, 0.434294481903251827651), "Math: LOG10E failed");
    console.assert(equals(Math.LN2, 0.693147180559945309417), "Math: LN2 failed");
    console.assert(equals(Math.LN10, 2.30258509299404568402), "Math: LN10 failed");
    console.assert(equals(Math.PI, 3.14159265358979323846), "Math: PI failed");
    console.assert(equals(Math.SQRT2, 1.41421356237309504880), "Math: SQRT2 failed");
    console.assert(equals(Math.SQRT1_2, 0.707106781186547524401), "Math: SQRT1_2 failed");

    // Check Math constants for NaN, +Infinity, -Infinity
    const edges = [NaN, +Infinity, -Infinity];
    const constants = new Map<string, number>();
    constants.set("E", Math.E)
        .set("LOG2E", Math.LOG2E)
        .set("LOG10E", Math.LOG10E)
        .set("LN2", Math.LN2)
        .set("LN10", Math.LN10)
        .set("PI", Math.PI)
        .set("SQRT2", Math.SQRT2)
        .set("SQRT1_2", Math.SQRT1_2);

    constants.forEach((value, name) => {
        edges.forEach(edge => {
            const notEqual = !equals(value, edge);
            console.assert(notEqual, "Math: Expects (", name, " !== ", edge, "). failed");
        });
    });
}
/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

// Only test buildability here.

const terminatedDefaultClause = function () {
    const i: number = 1;
    switch (i) {
        case 0:
            return 0;
        default:
            return 2
    }
}

const implicitlyTerminated = function () {
    if (false) {
        // @ts-ignore (skip unreachable code check)
        return 1;
    }
}
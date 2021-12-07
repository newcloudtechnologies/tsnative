/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
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
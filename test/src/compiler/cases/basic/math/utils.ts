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

export const EPS = Number.EPSILON;

export const equals = function (x: number, y: number, tolerance: number = Number.EPSILON): boolean {
    return Math.abs(x - y) < tolerance;
};
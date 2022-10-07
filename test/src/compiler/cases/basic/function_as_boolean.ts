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

const f = function () {}

if (!f) {
    console.assert(false, "Function negation failed");
}

if (!!f) {
    console.assert(true, "Function double negation failed");
}

type VoidFunctionT = () => void;

let callCounter = 0;

const onceNull = function (fn: VoidFunctionT | null) {
    return function (): void {
        if (fn) {
            fn();
            fn = null;
            ++callCounter;
        }
    }
}

const onceUndefined = function (fn: VoidFunctionT | undefined) {
    return function (): void {
        if (fn) {
            fn();
            fn = undefined;
            ++callCounter;
        }
    }
}

const on = onceNull(f);
on();
console.assert(callCounter === 1, "Nullable function: once call failed (1)");
on();
console.assert(callCounter === 1, "Nullable function: once call failed (2)");

callCounter = 0;

const ou = onceUndefined(f);
ou();
console.assert(callCounter === 1, "Optional function: once call failed (1)");
ou();
console.assert(callCounter === 1, "Optional function: once call failed (2)");

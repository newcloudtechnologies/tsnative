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

type VoidFunction = () => void;
function once2(fn: VoidFunction | null): VoidFunction {
    return (): void => {
        if (fn) {
            fn(); //! @todo apply contexts?
            fn = null;
        }
    }
}

export default function createStore2() {
    let callCounter = 0;

    let lol = once2((): void => {
        ++callCounter;
    });

    lol();
    lol();

    console.assert(callCounter === 1, "Call once");
}
/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { gcTest } from "./gc_test_fixture";

type Callback<ArgT> = (i: ArgT) => void;

function checkPromiseConstructorResolve() {
    new Promise((resolve: Callback<number>) => {
        resolve(23);
        let a = 1;
        a = 2;
        a = 3;
    });
}

function checkPromiseConstructorResolveAndReject() {
    new Promise((resolve: Callback<number>, reject: Callback<number>) => {
        reject(23);
        resolve(23);
    });
}

function checkReadyPromiseResolve() {
    Promise.resolve(true);
}

function checkReadyPromiseReject() {
    Promise.reject(true);
}

function checkPromiseIfThenOne() {
    Promise.resolve(true).then((b: boolean) => {
        let a = 1;
        if (b) {
            a = 2;
        } else {
            a = 3;
        }
    });
}


function checkPromiseIfThenTwo() {
    Promise.resolve(true).then((b: boolean): number => {
        if (b) {
            return 42;
        }
        throw 23;
    }, (b: boolean) => {
    }).catch((n: number) => {
        console.assert(n === 23, "GC Promises. Case [1 - A] Expect n === 23");
    });
}

function checkPromiseIfCatch() {
    Promise.reject(false).catch((b: boolean) => {
        console.assert(b === false, "GC Promises. Case [2 - A] Expect b === false");
    });
}

function checkPromiseIfFinally() {
    let n = 23;
    const p = Promise.resolve(true);
    p.then((b: boolean) => {
        n = 42;
    }).finally(() => {
        console.assert(n === 42, "GC Promises. Case [3 - A] Expect n === 42")
    });
}

function checkPromiseIfUseSomeState() {

    const p = Promise.resolve(true);
    p.then((b: boolean): number => {
        return 42;
    }).catch((b: boolean): number => {
        return 1;
    }).then((m: number) => {
        return m + 1;
    }).then((m: number) => {
        console.assert(m === 43);
    });
}

function checkPromiseIfFullChain() {
    new Promise((resolve: Callback<number>, reject: Callback<number>) => {
        resolve(23);
    }).then((n: number): number => {
        throw n;
    }, (n: number): number => {
        return n;
    }).then((b: boolean) => {
        console.assert(false, "GC Promises. Case [4 - A] This callback should not be called");
    }).catch((n: number) => {
        console.assert(n === 23);
    }).finally(() => {
        return 11;
    });
}

let nn = 23;

function checkPromiseConstructorResolveAndThenCapture() {
    new Promise((resolve: Callback<number>) => {
        resolve(nn);
    }).then((n: number) => {
        if (nn === n) {
            nn = 42;
        }
        return nn;
    }).finally(() => {
        console.assert(nn === 42)
    });
}

function checkPromisePassTask() {
    function task(n: number): void {
        n = n + 1;
    }
    Promise.resolve(42).then(task);
}

gcTest(checkPromiseConstructorResolve, "Check promise constructor -- Resolve callback");
gcTest(checkPromiseConstructorResolveAndReject, "Check promise constructor -- Resolve and reject  callback");
gcTest(checkReadyPromiseResolve, "Check ready promise resolve");
gcTest(checkReadyPromiseReject, "Check ready promise reject");
gcTest(checkPromiseIfThenOne, "Check promise if then callback is one(resolve)");
gcTest(checkPromiseIfThenTwo, "Check promise if then callback is two(resolve and reject");
gcTest(checkPromiseIfCatch, "Check promise if catch callback");
gcTest(checkPromiseIfFinally, "Check promise if finally callback");
gcTest(checkPromiseIfUseSomeState, "Check the promise if you use the same state");
gcTest(checkPromiseIfFullChain, "Check the promise if you use full chains");
gcTest(checkPromiseConstructorResolveAndThenCapture, "Check the promise if use capture");
gcTest(checkPromisePassTask, "Check the promise if pass task to then");
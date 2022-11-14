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

{
// To manually create an already resolved or rejected promise
// Set to resolved state and attach one fulfilled handler in the method then
//
    Promise.resolve(true).then((b: boolean) => {
        console.assert(b === true, "Promise. Case [1-A]:  Expects: true, actual: false");
    });
}

{
// To manually create an already resolved or rejected promise
// Set to rejected state and attach two fulfilled and rejected handler in the method then
//
    Promise.reject(true).then((b: boolean) => {
        console.assert(false, "Promise. Case [1-B-1]:  This callback should not be called");
    }, (b: boolean) => {
        console.assert(b === true, "Promise. Case [1-B-2]:  Expects: true, actual: false");
    });
}

{
// To manually create an already resolved or rejected promise
// Set to rejected state and attach one fulfilled int the method then and rejected handler in the method catch
//
    Promise.reject(true).then((b: boolean) => {
        console.assert(false, "Promise. Case [1-C-1]:  This callback should not be called");
    }).catch((b: boolean) => {
        console.assert(b === true, "Promise. Case [1-C-2]:  Expects: true, actual: false");
    })
}

{
// To manually create an already resolved or rejected promise
// Set to resolved state. Check finally
//
    let flag = false;
    Promise.resolve(true).then((b: boolean) => {
        console.assert(b === true, "Promise. Case [1-D-1]:  Expects: true, actual: false");
    }).catch((b: boolean) => {
        console.assert(false, "Promise. Case [1-D-2]:  This callback should not be called");
    }).finally(() => {
        flag = true;
    }).finally(() => {
        console.assert(flag === true, "Promise. Case [1-D-3]:  Expects: true, actual: false")
    });

    console.assert(flag === false, "Promise. Case [1-D-4]: This non blocking call. Expects: false, actual: true");
}

{
// To manually create an already resolved or rejected promise
// Set to resolved state. Check that the returned result is ignored in the final callback
//
    Promise.resolve(true).then((b: boolean): string => {
        console.assert(b === true, "Promise. Case [1-E-1]:  Expects: true, actual: false");
        return "Result-1";
    }).catch((b: boolean): string => {
        console.assert(false, "Promise. Case [1-E-2]:  This callback should not be called");
        return "123";
    }).finally(() => {
        return "Result-2";
    }).then((s: string) => {
        console.assert(s === "Result-1", "Promise. Case [1-E-3]: Expects: Result-1");
        return s;
    });
}

{
// To manually create an already resolved or rejected promise
// Set to resolved state. Ignore empty parameters and catch in last fulfilled then method
//
    Promise.resolve(true).then().finally().catch().then((b: boolean) => {
        console.assert(b === true, "Promise. Case [1-F]:  Expects: true, actual: false");
    });
}

{
// To manually create an already resolved or rejected promise
// Set to rejected state. Catch error in catch method
//
    Promise.reject(true).then(() => {
        console.assert(false, "Promise. Case [1-G-1]:  This callback should not be called");
    }).then().finally().catch().then(() => {
        console.assert(false, "Promise. Case [1-G-2]:  This callback should not be called");
    }, (b: boolean) => {
        console.assert(b === true, "Promise. Case [1-G-3]:  Expects: true, actual: false");
    });
}

{
// To manually create an already resolved or rejected promise
// Set to resolved state. Throwing exception in callback. Check catching exception;
//
    const error = "Some Error";
    Promise.resolve(true).then((b: boolean): string => {
        console.assert(b === true, "Promise. Case [1-H-1]:  Expects: true, actual: false");
        throw error;
    }).then().finally().catch().then(() => {
        console.assert(false, "Promise. Case [1-H-2]:  This callback should not be called");
    }).catch((reason: string) => {
        console.assert(reason === error, "Promise. Case [1-H-3]: Expects: The same error is expected");
    });
}

{
// To manually create an already resolved or rejected promise
// Set to resolved state. Sequential change of value in the chain of callbacks
//
    let value = 0;

    Promise.resolve(value).then((n: number) => {
        console.assert(n === 0, "Promise. Case [1-J-1]:  Expects: 0");
        n = 1;
        return n;
    }).then((n: number) => {
        console.assert(n === 1, "Promise. Case [1-J-2]:  Expects: 1");
        n = 2;
        return n;
    }).then((n: number): void => {
        console.assert(n === 2, "Promise. Case [1-J-3]:  Expects: 2");
        throw n;
    }).then(() => {
        return 100;
    }).catch((n: number) => {
        console.assert(n === 2, "Promise. Case [1-J-4]:  Expects: 2");
        value = 3;
    }).finally(() => {
        console.assert(value === 3, "Promise. Case [1-J-5]:  Expects: 3");
    });

    console.assert(value === 0, "Promise. Case [1-J-6]: This non blocking call. Expects: 0");
}

{
// To manually create an already resolved or rejected promise
// Set to resolved state. Multiple receivers on one Promise. Check use one resolved value all callbacks;
//
    const p = Promise.resolve(11);
    p.then((n: number) => {
        console.assert(n === 11, "Promise. Case [1-L-1]:  Expects: 11");
        return 23;
    });

    p.then((n: number) => {
        console.assert(n === 11, "Promise. Case [1-L-2]:  Expects: 11");
        return 33;
    });

    p.then((n: number): void => {
        console.assert(n === 11, "Promise. Case [1-L-3]:  Expects: 11");
    });
}

{
// To manually create an already resolved or rejected promise
// Set to resolved state. Chaining after a catch. It's possible to chain after a failure,
// i.e. a catch, which is useful to accomplish new actions even after an action failed in the chain.
// Check transfer result.
//
    Promise.resolve(true).then((b: boolean): number => {
        console.assert(b === true, "Promise. Case [1-M-1]:  Expects: true, actual: false");
        throw 23;
    }).catch().catch((n: number): number => {
        console.assert(n === 23, "Promise. Case [1-M-2]:  Expects: 23");
        return 33;
    }).then().finally().then((n: number) => {
        console.assert(n === 33, "Promise. Case [1-M-3]:  Expects: 33");
    });
}

{
// To manually create an already resolved or rejected promise
// Set to promise state ib function.
//
    const fn = (b: boolean) => {
        if (b) {
            return Promise.resolve(23);
        }
        return Promise.reject(33);
    }
    fn(true).then((n: number) => {
        console.assert(n === 23, "Promise. Case [1-N-1]:  Expects: 23");
    });
    fn(false).catch((n: number) => {
        console.assert(n === 33, "Promise. Case [1-N-2]:  Expects: 33");
    });
}


type Callback<ArgT> = (i: ArgT) => void;

{
// Use Promise constructor
// Check resolve call and attach fulfilled receiver
//
    const p = new Promise((resolve: Callback<number>, reject: Callback<number>) => {
        resolve(23);
    });

    p.then((i: number) => {
        console.assert(i === 23, "Promise. Case [1-O-1]:  Expects: 23");
    });
}

{
// Use Promise constructor
// Check resolve call and attach fulfilled receiver
//
    const p = new Promise((resolve: Callback<number>, reject: Callback<number>) => {
        reject(23);
    });

    p.catch((i: number) => {
        console.assert(i === 23, "Promise. Case [1-P-1]:  Expects: 23");
    });
}

{
// Use Promise constructor
// Check resolve call and reject call. Reject should be ignored
//
    const p = new Promise((resolve: Callback<number>, reject: Callback<number>) => {
        resolve(23)
        reject(23);
    });

    p.then((i: number) => {
        console.assert(i === 23, "Promise. Case [1-R-1]:  Expects: 23");
    }).catch((i: number) => {
        console.assert(false, "Promise. Case [1-R-2]:  This callback should not be called");
    });
}

{
// Use Promise constructor
// Check resolve call with timeout
//
    const p = new Promise((resolve: Callback<number>, reject: Callback<number>) => {
        setTimeout(() => resolve(23), 0);
    });

    p.then((i: number) => {
        console.assert(i === 23, "Promise. Case [1-S-1]:  Expects: 23");
    }).catch((i: number) => {
        console.assert(false, "Promise. Case [1-S-2]:  This callback should not be called");
    });
}

{
// Use Promise constructor
// Then with function

    function doubler(i: number) {
        return i * 2;
    }

    const p = new Promise((resolve: Callback<number>) => {
        resolve(2);
    }).then(doubler).then(doubler).then((i: number) => {
        console.assert(i === 8, "Promise. Case [1-T-1]:  Expects 8");
    })
}
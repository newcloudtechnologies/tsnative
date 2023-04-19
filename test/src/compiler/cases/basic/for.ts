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

{

    const COUNT = 10;
    let i = 0;

    // with initializer, condition and incrementor
    for (i = 0; i < COUNT; ++i) { }
    console.assert(i === COUNT, "for: failed");

    // with external initializer, condition and incrementor
    i = 0;
    for (; i < COUNT; ++i) { }
    console.assert(i === COUNT, "for: external initializer failed");

    // with initializer, internal condition and incrementor
    for (i = 0; ; ++i) {
        if (i === COUNT)
            break;
    }
    console.assert(i === COUNT, "for: internal condition failed");

    // same as previous, but the `break` statement is wrapped in block
    for (i = 0; ; ++i) {
        if (i === COUNT) {
            break;
        }
    }
    console.assert(i === COUNT, "for: scoped internal condition failed");

    // with initializer, condition and internal incrementor
    for (i = 0; i < COUNT;) {
        ++i;
    }
    console.assert(i === COUNT, "for: internal incrementor failed");

    // with initializer, internal condition and internal incrementor
    for (i = 0; ;) {
        if (i === COUNT)
            break;
        ++i;
    }
    console.assert(i === COUNT, "for: internal condition and internal incrementor failed");

    // with external initializer, internal condition and internal incrementor
    i = 0;
    for (; ;) {
        if (i === COUNT)
            break;
        ++i;
    }
    console.assert(i === COUNT, "for: external initializer, internal condition and internal incrementor failed");

    // pseudo `forever` construction
    i = 0;
    for (; ;) {
        if (true)
            break;
    }
    console.assert(i === 0, "for: forever failed");

    // `continue` statement
    for (i = 0; i < COUNT; ++i) {
        if (true)
            continue;
    }
    console.assert(i === COUNT, "for: continue failed");

    // same as previous, but the `continue` statement is wrapped in block
    for (i = 0; i < COUNT; ++i) {
        if (true) {
            continue;
        }
    }
    console.assert(i === COUNT, "for: scoped continue failed");

}

// Test conditionless 'break'
{
    const qqq = [1, 2, 3, 4, 5];

    for (let i = 0; i < qqq.length; ++i) {
        break;
    }
}

{
    function testForLoopBodyCaptureCounterWithPrefixIncrement() {
        const arr = ["a", "b", "c"];
        const last = arr[arr.length - 1];

        let fn = () => {};

        for (let n = 0; n < arr.length; ++n) {
            fn = () => {
                console.assert(
                    arr[n] === last,
                    "For loop body should capture counter copy (prefix increment)"
                );
            };
        }

        fn();
    }

    function testForLoopBodyCaptureCounterWithPostfixIncrement() {
        const arr = ["a", "b", "c"];
        const last = arr[arr.length - 1];

        let fn = () => {};

        for (let n = 0; n < arr.length; n++) {
            fn = () => {
                console.assert(
                    arr[n] === last,
                    "For loop body should capture counter copy (postfix increment)"
                );
            };
        }

        fn();
    }

    function testForLoopBodyCaptureCounterWithAssignment() {
        const arr = ["a", "b", "c"];
        const last = arr[arr.length - 1];

        let fn = () => {};

        for (let n = 0; n < arr.length; n = n + 1) {
            fn = () => {
                console.assert(
                    arr[n] === last,
                    "For loop body should capture counter copy (counter assignment)"
                );
            };
        }

        fn();
    }

    function testForLoopBodyCaptureCounterWithCompoundAssignment() {
        const arr = ["a", "b", "c"];
        const last = arr[arr.length - 1];

        let fn = () => {};

        for (let n = 0; n < arr.length; n += 1) {
            fn = () => {
                console.assert(
                    arr[n] === last,
                    "For loop body should capture counter copy (counter compound assignment)"
                );
            };
        }

        fn();
    }

    function testForLoopBodyCaptureFakeCounter() {
        const arr = ["a", "b", "c"];
        const first = arr[0];

        let fn = () => {};
        let t = 0;

        for (let n = 0; t < arr.length; ++t) {
            fn = () => {
                console.assert(n === 0, "4");
                console.assert(arr[n] === first, "5");
            };
        }

        fn();
    }

    function testMultipleCounters() {
        const arr = ["a", "b", "c"];
        const arrExpected = ["a", "b", "c"];
        const indexesExpected = [0, 1, 2];

        for (let i = 0, k = 0; i < arr.length && k < arrExpected.length; ++i, ++k) {
            console.assert(arr[i] === arrExpected[k] && i === indexesExpected[i] && k === indexesExpected[k], "Array iteration by multiple counters");
        }
    }

    function testNestedForLoop() {
        const arr = ["a", "b", "c"];
        const first = arr[0];
        const last = arr[arr.length - 1];

        let f = () => {};
        let g = () => {};

        for (let i = 0; i < 1; ++i) {
            for (let k = 0; k < arr.length; ++k) {
                f = () => {
                    console.assert(arr[i] === first && arr[k] === last, "Nested for loop should correctly copy counters into loop body (inner)")
                }
            }

            g = () => {
                console.assert(arr[i] === first, "Nested for loop should correctly copy counters into loop body");
            }
        }

        f();
        g();
    }

    function testForLoopBodyCaptureCounterWithoutIncrementor() {
        const arr = ["a", "b", "c"];

        let f = () => {};

        for (let i = 0; i < arr.length;) {
            f = () => {
                console.assert(i === arr.length, "Increment in for loop body should affect captured counter");
            }

            ++i;
        }

        f();
    }

    function testForLoopBodyCaptureCounterWithoutInitializer() {
        const arr = ["a", "b", "c"];

        let f = () => {};

        let i = 0;
        for (; i < arr.length; ++i) {
            f = () => {
                console.assert(
                    i === arr.length,
                    "Counter from outer enviroment should be affected by incrementor on each iteration"
                );
            };
        }

        f();
    }

    function testForLoopCaptureCounterInsideObject() {
        type MyType = {
            n: number,
        }
        
        const arr = [{ n: 1 }, { n: 2 }, { n: 3 }] as MyType[];
        
        for (let i = 0; i < arr.length; i++) {
            let qqq = arr[i];
            qqq = { n : 7 };
        }
        
        console.assert(arr[0].n === 1, "For: capture inside object failed at index 0");
        console.assert(arr[1].n === 2, "For: capture inside object failed at index 0");
        console.assert(arr[2].n === 3, "For: capture inside object failed at index 0");
    }

    testForLoopBodyCaptureCounterWithPrefixIncrement();
    testForLoopBodyCaptureCounterWithPostfixIncrement();
    testForLoopBodyCaptureCounterWithAssignment();
    testForLoopBodyCaptureCounterWithCompoundAssignment();
    testForLoopBodyCaptureFakeCounter();
    testMultipleCounters();
    testNestedForLoop();
    testForLoopBodyCaptureCounterWithoutIncrementor();
    testForLoopCaptureCounterInsideObject();
}

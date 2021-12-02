/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

{
    function f(a: number) {
        return function () {
            return a;
        }
    }
    const ff = f(2);
    console.assert(ff() === 2, "Argument capture failed");
}

{
    function f() {
        let a = 22;
        return function () {
            return a;
        }
    }
    const ff = f();
    console.assert(ff() === 22, "Local variable capture failed");
}

{
    function f(_: number, fn: () => number) {
        return function () {
            return fn();
        }
    }
    let ff = function () {
        return 42;
    }
    const fff = f(111, ff);
    console.assert(fff() === 42, "Funarg capture failed");
}

{
    let i = 22;
    function f() {
        i = 42;
    }
    f();
    console.assert(i === 42, "Free variable capture failed");
}

{
    let a = 0;
    function f() {
        return function () {
            return a;
        }
    }

    const g = f();
    let i = g();
    console.assert(i === a, "Free variable capture by nested function failed")
}

{
    function f(a: number) {
        return {
            ff: () => a + 1
        }
    }

    const fval = f(22)
    console.assert(fval.ff() === 23, "In-object closure test failed");
}

{
    function f(fn: () => number) {
        return function () {
            return fn();
        }
    }
    let a = 42;
    let g = function () {
        return a;
    }
    const h = f(g);
    console.assert(h() === a, "Funarg closure capturing failed");
}

{
    function f(fn: () => number) {
        return function () {
            return {
                fun: fn
            }
        }
    }
    let a = 42;
    let g = function () {
        return a;
    }
    const h = f(g);
    const v = h();

    console.assert(v.fun() === a, "Funarg closure in-object capturing failed");
}

{
    function f(fn: () => number) {
        return function (firstAddend: number) {
            return {
                fun: function (secondAddend: number) {
                    return fn() + firstAddend + secondAddend;
                }
            }
        }
    }
    let a = 1;
    let g = function () {
        return a;
    }
    const h = f(g);
    const v = h(100);

    console.assert(v.fun(10) === 111, "More complex funarg capturing failed");
}

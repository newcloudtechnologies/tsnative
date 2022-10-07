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

{
    let i = 0;
    let n = i;

    ++i;

    console.assert(i === 1 && n === 0, "Number is a value");
}

{
    let s = "0s";
    let q = s;

    s += "_";

    console.assert(s === "0s_" && q === "0s", "String is a value");
}

{
    let b = false;
    let p = b;

    b = !b;

    console.assert(b && !p, "Boolean is a value");
}

{
    function f(n: number) {
        n += 1;
    }

    const i = 0;
    f(i);
    console.assert(i === 0, "Number immutability");
}

{
    function f(s: string) {
        s += "_1";
    }

    const s = "0!!!";
    f(s);
    console.assert(s === "0!!!", "String immutability");
}

{
    function f(b: boolean) {
        b = !b;
    }

    const b = false;
    f(b);
    console.assert(!b, "Boolean immutability (1)");
}

{
    function f(handler: (b: boolean) => void, value: boolean) {
        handler(value);
    }

    const b = false;
    f((b: boolean) => {
        b = !b;
    }, b);
    console.assert(!b, "Boolean immutability (2)");
}
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

let u: undefined;
console.assert(!u, "Undefined type initialization failed");

let optionalUnion: string | number | undefined;
console.assert(!optionalUnion, "Non-initialized union test failed");

optionalUnion = "A";
console.assert(optionalUnion === "A", "Union comparison failed");

optionalUnion = 1;
console.assert(optionalUnion === 1, "Union comparison failed");

optionalUnion = undefined;
console.assert(!optionalUnion, "Active undefined test failed");

{
    function f() { };
    console.assert(f() === undefined, "Function expression with empty body must return 'undefined'");
}

{
    const f = () => { };
    console.assert(f() === undefined, "Arrow function with empty body must return 'undefined'");
}

{
    interface RxBarItem_t {
        name: string
        children: RxBarItem_t[] | undefined
    };

    const arr: RxBarItem_t[] = [
        {
            name: 'File',
            children: undefined
        },
    ]

    if (arr[0].children) {
        console.assert(false, "First array element have no children: never");
    } else {
        console.log(true, "First array element have children: always");
    }
}

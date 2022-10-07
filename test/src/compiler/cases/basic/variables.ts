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

// Test underscored names
{
    function test(_: string) {
        let b = _;
    }

    test("Lol");

    class MyType {
        str: string = "0";
    }

    let __tmp_data = new MyType();
    __tmp_data.str = "777";
}

{
    class C {
        s: string;

        constructor(s: string) {
            this.s = s;
        }
    }

    const arr: C[] = [];

    const a = new C("a");
    arr.push(a);

    let b: C;
    b = new C("b");
    arr[0] = b;

    console.assert(arr[0].s === "b", "Late initialization");
}

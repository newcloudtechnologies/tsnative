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
    class MyWow {
        str: string = "test";
    };

    let w;
    w = new MyWow();
    console.assert(w.str === "test", "Uninitialized untyped variable reinitialization must be possible");
}
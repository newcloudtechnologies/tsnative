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
    let i = 0;
    console.assert(i >= 0);
}

{
    enum E {
        b
    }

    console.log(E.b);
}

{
    console.assert();
}

{
    console.log();
}

{
    console.log(1, 2, 3, 4, 5);
}

{
    console.assert(true, 1, 2, 3);
}

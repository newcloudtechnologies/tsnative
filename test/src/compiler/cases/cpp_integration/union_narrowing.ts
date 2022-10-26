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

import { UnionTest } from "cpp_integration_exts";

{
    const u: number | undefined = 3;

    const c = new UnionTest();

    if (u) {
        const v = c.bypass(u);
        console.assert(v === u, "Pass narrowed union to CXX method");
    } else {
        console.assert(false, "Never");
    }
}

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

import { E, EnumArgs } from "cpp_integration_exts";

{
    const value = new EnumArgs(E.Auto);
    const bypass = value.test(E.Manual);

    console.assert(bypass === E.Manual, "Enum as CXX function argument/return");

    function acceptsOptionalCXXEnum(alignment?: E) {
        if (alignment) {
            const bypassed = value.test(alignment);
            console.assert(bypassed === alignment, "Optional CXX-enum value must be correctly converted from TS");
        }
    }

    acceptsOptionalCXXEnum(E.Manual);
}

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

#pragma once

#include <TS.h>

namespace TS_MODULE(global)
{

    class TS_EXPORT Entity
    {
    public:
        Entity() = default;
        ~Entity() = default;
        TS_METHOD void entity();

        TS_CODE("toString(): string;\n"
                "toNumber(): number;\n\n");

        TS_CODE("// @ts-ignore\n"
                "@MapsTo(\"operator==\")\n"
                "private equals(string): boolean;\n");
    };

    TS_CODE("// @ts-ignore\n"
            "declare type string = String;\n");

} // namespace )

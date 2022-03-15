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

#include "TS.h"
#include "ts_module3_include.h"

namespace TS_MODULE(global) IS_TS_NAMESPACE
{

    namespace TS_NAMESPACE(stuffs)
    {

        class TS_EXPORT Entity
        {
        public:
            TS_METHOD Entity() = default;
            TS_METHOD void entity();
        };

    } // namespace )

} // namespace IS_TS_NAMESPACE

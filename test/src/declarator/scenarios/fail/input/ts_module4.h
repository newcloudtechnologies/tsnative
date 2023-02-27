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

#pragma once

#include "TS.h"
#include "details/internal_include1.h"

namespace global IS_TS_MODULE
{

namespace TS_NAMESPACE(stuffs) IS_TS_MODULE
{

    class TS_EXPORT Entity
    {
    public:
        TS_METHOD Entity() = default;
        TS_METHOD void entity();
    };

} // namespace IS_TS_MODULE

} // namespace IS_TS_MODULE

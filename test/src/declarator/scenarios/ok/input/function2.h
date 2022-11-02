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

#pragma once

#include <TS.h>
#include <std/tsnumber.h>

namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

TS_EXPORT Number* pi();

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE

Number* global::snippets::pi()
{
    return nullptr;
    //    return 3.14;
}

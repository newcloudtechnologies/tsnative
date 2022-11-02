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
#include <std/tsobject.h>

namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

template <typename X, typename Y, typename Z>
class TS_EXPORT MultiparamClassTemplate : public Object
{
    X m_x;
    Y m_y;
    Z m_z;

public:
    TS_METHOD MultiparamClassTemplate()
    {
    }
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE

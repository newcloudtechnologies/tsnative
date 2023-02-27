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

#include <TS.h>
#include <std/tsobject.h>

namespace test IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class TS_EXPORT EnumHolder : public Object
{
public:
    enum TS_EXPORT Types
    {
        PLANT,
        ANIMAL,
        INSECT
    };

public:
    TS_METHOD EnumHolder() = default;
    ~EnumHolder() = default;

    TS_METHOD Types getType();
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE

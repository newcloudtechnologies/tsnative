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
#include <std/tsnumber.h>

namespace test IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class WithoutObject
{
public:
    WithoutObject() = default;
};

class TS_EXPORT Entity : public WithoutObject, public Object
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE

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

namespace not_exported
{
class TS_EXPORT Hidden : public Object
{
public:
    Hidden() = default;
    ~Hidden() = default;
    TS_METHOD void hidden();
};
} // namespace not_exported

namespace stuffs1 IS_TS_NAMESPACE
{

class TS_EXPORT Entity1 : public Object
{
public:
    TS_METHOD Entity1() = default;
    TS_METHOD void entity1();
};

} // namespace IS_TS_NAMESPACE

namespace stuffs2 IS_TS_NAMESPACE
{

class TS_EXPORT Entity2 : public Object
{
public:
    TS_METHOD Entity2() = default;
    TS_METHOD void entity2();
};

} // namespace IS_TS_NAMESPACE

} // namespace IS_TS_MODULE

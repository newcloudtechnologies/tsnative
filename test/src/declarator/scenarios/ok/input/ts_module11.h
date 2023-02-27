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

namespace mgtts IS_TS_MODULE
{

// namespace with number
namespace ui2 IS_TS_NAMESPACE
{

class TS_EXPORT Entity_t : public Object
{
public:
    TS_METHOD void entity_base();
};

class TS_EXPORT Base2_t : public Object
{
public:
    TS_METHOD void base();
};

// inherits class with *_t
class TS_EXPORT Entity : public Entity_t
{
public:
    TS_METHOD void entity();
};

// inherits class with numbers
class TS_EXPORT Derived2_t : public Base2_t
{
public:
    TS_METHOD void derived();
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE

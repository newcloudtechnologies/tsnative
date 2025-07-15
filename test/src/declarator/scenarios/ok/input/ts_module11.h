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

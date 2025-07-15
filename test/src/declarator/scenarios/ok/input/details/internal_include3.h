#pragma once

#include <TS.h>
#include <std/tsobject.h>

namespace internal IS_TS_MODULE
{

namespace entities IS_TS_NAMESPACE
{

class TS_EXPORT Entity : public Object
{
public:
    TS_METHOD Entity() = default;
    TS_METHOD void entity();
};

} // namespace IS_TS_NAMESPACE

} // namespace IS_TS_MODULE

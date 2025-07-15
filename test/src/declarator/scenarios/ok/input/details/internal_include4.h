#pragma once

#include <TS.h>
#include <std/tsobject.h>

namespace mgt IS_TS_MODULE
{

namespace ts IS_TS_NAMESPACE
{

class TS_EXPORT Widget : public Object
{
public:
    TS_METHOD Widget(Widget& parent);
};

} // namespace IS_TS_NAMESPACE

} // namespace IS_TS_MODULE

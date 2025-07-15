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

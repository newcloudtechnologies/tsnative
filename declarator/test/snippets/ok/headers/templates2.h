#pragma once

#include <TS.h>

namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

template <typename X, typename Y, typename Z>
class TS_EXPORT MultiparamClassTemplate
{
    X m_x;
    Y m_y;
    Z m_z;

public:
    TS_METHOD MultiparamClassTemplate()
    {}
};

}   // namespace snippets
}   // namespace global


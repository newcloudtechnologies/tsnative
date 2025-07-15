#pragma once

#include <TS.h>
#include <std/tsobject.h>

namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

template <typename T>
class TS_EXPORT TheCircle : public Object
{
    T* m_x;
    T* m_y;
    T* m_radius;

public:
    TS_METHOD TheCircle(T* x, T* y, T* radius)
        : m_x(x)
        , m_y(y)
        , m_radius(radius)
    {
    }

    TS_METHOD T* x() const;
    TS_METHOD T* y() const;
    TS_METHOD T* radius() const;
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE

#pragma once

#include <TS.h>

namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

template <typename T>
class TS_EXPORT BasicRect
{
    T m_width;
    T m_height;

public:
    TS_METHOD BasicRect(T width, T height)
        : m_width(width), m_height(height)
    {}

    TS_METHOD T width() const;
    TS_METHOD T height() const;
};

}   // namespace snippets
}   // namespace global


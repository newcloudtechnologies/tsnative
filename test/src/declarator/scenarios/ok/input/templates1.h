#pragma once

#include <TS.h>
#include <std/tsobject.h>

template <typename T>
class TS_EXPORT BasicRect : public Object
{
    T* m_width;
    T* m_height;

public:
    TS_METHOD BasicRect(T* width, T* height)
        : m_width(width)
        , m_height(height)
    {
    }

    TS_METHOD T* width() const;
    TS_METHOD T* height() const;
};

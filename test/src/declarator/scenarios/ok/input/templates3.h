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

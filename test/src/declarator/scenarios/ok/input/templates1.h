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

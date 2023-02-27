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

#include "loop.h"

namespace uv
{

template <typename TResourceType>
struct UVTypeResourceHolder
{
    explicit UVTypeResourceHolder(const Loop& loop) noexcept
        : _owner{loop}
        , _resource{}
    {
    }

    UVTypeResourceHolder(const UVTypeResourceHolder&) = delete;

    UVTypeResourceHolder(UVTypeResourceHolder&&) = delete;

    UVTypeResourceHolder& operator=(const UVTypeResourceHolder&) = delete;

    UVTypeResourceHolder& operator=(UVTypeResourceHolder&&) = delete;

    virtual int init()
    {
        return 0;
    }

    const Loop& parent() const noexcept
    {
        return _owner;
    }

    const TResourceType* raw() const noexcept
    {
        return &_resource;
    }

    TResourceType* raw() noexcept
    {
        return &_resource;
    }

private:
    const Loop& _owner;
    TResourceType _resource;
};
} // namespace uv

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

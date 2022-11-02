/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include "std/private/emitter.h"
#include "type.h"

namespace uv
{

template <typename TEmitterSource, typename TResourceType, typename... TEvents>
class ResourceHandle : public UVTypeResourceHolder<TResourceType>,
                       public EmitterBase<TEmitterSource, ErrorEvent, TEvents...>,
                       public std::enable_shared_from_this<TEmitterSource>
{
protected:
    int ownerShipIf(int err) noexcept
    {
        if (!err)
        {
            _self = this->shared_from_this();
        }
        return err;
    }

    void selfReset() noexcept
    {
        if (hasSelf())
        {
            _self.reset();
        }
    }

    bool hasSelf() const noexcept
    {
        return static_cast<bool>(_self);
    }

public:
    explicit ResourceHandle(const Loop& loop)
        : UVTypeResourceHolder<TResourceType>{loop}
    {
        this->raw()->data = this;
    }

private:
    std::shared_ptr<void> _self{nullptr};
};
} // namespace uv
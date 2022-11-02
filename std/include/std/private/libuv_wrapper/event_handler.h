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

#include "resource.h"

#include <exception>

namespace uv
{
struct CloseEvent
{
};

template <typename T, typename U, typename... E>
class EventHandler : public ResourceHandle<T, U, CloseEvent, E...>
{
private:
    static void closeCallback(uv_handle_t* handle)
    {
        EventHandler<T, U, E...>* ref = static_cast<T*>(handle->data);
        if (ref)
        {
            auto ptr = ref->shared_from_this();
            if (ptr->hasSelf())
            {
                ptr->selfReset();
            }
            ptr->template emit(CloseEvent{});
        }
    }

    uv_handle_t* asHandle()
    {
        return reinterpret_cast<uv_handle_t*>(this->raw());
    }

    const uv_handle_t* asHandle() const
    {
        return reinterpret_cast<const uv_handle_t*>(this->raw());
    }

public:
    using ResourceHandle<T, U, CloseEvent, E...>::ResourceHandle;

    EventHandlerType type() const noexcept
    {
        return guessHandle(asHandle()->type);
    }

    bool active() const noexcept
    {
        return uv_is_active(asHandle());
    }

    bool closing() const noexcept
    {
        return uv_is_closing(asHandle()) != 0;
    }

    void close() noexcept
    {
        if (!closing())
        {
            uv_close(asHandle(), &EventHandler<T, U, E...>::closeCallback);
        }
    }
};
} // namespace uv

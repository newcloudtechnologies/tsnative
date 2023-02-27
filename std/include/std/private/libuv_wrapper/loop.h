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

#include "error_event.h"
#include "std/private/emitter.h"

#include <uv.h>

#include <chrono>
#include <memory>

namespace uv
{

class TimerEventHandler;
class AsyncEventHandler;

enum class UVRunMode : std::underlying_type_t<uv_run_mode>
{
    DEFAULT = uv_run_mode::UV_RUN_DEFAULT,
    ONCE = uv_run_mode::UV_RUN_ONCE,
    NOWAIT = uv_run_mode::UV_RUN_NOWAIT
};

enum class EventHandlerType : std::underlying_type_t<uv_handle_type>
{
    UNKNOWN = UV_UNKNOWN_HANDLE,
    ASYNC = UV_ASYNC,
    HANDLE = UV_HANDLE,
    IDLE = UV_IDLE,
    TIMER = UV_TIMER,
};

static EventHandlerType uvHandleToEventHandlerType(uv_handle_type uvHandleType)
{
    switch (uvHandleType)
    {
        case UV_ASYNC:
            return EventHandlerType::ASYNC;
        case UV_HANDLE:
            return EventHandlerType::HANDLE;
        case UV_IDLE:
            return EventHandlerType::IDLE;
        case UV_TIMER:
            return EventHandlerType::TIMER;
        default:
            return EventHandlerType::UNKNOWN;
    }
}

class Loop final : public EmitterBase<Loop, ErrorEvent>
{
    static std::unique_ptr<uv_loop_t> createUvLoop();

public:
    using Time = std::chrono::duration<uint64_t, std::milli>;
    using RunMode = UVRunMode;

    explicit Loop() noexcept;

    Loop(const Loop&) = delete;

    Loop(Loop&& other) = delete;

    Loop& operator=(const Loop&) = delete;

    Loop& operator=(Loop&&) = delete;

    ~Loop() noexcept override;

    template <typename R, typename... Args>
    std::shared_ptr<R> createResource(Args&&... args) const
    {
        return std::make_shared<R>(*this, std::forward<Args>(args)...);
    }

    template <typename R, typename... Args>
    std::shared_ptr<R> get(Args&&... args) const
    {
        auto ptr = createResource<R>(std::forward<Args>(args)...);
        ptr = (ptr->init() == 0) ? ptr : nullptr;
        return ptr;
    }

    int close();

    int run(RunMode run_mode = RunMode::DEFAULT) noexcept;

    bool alive() const noexcept;

    void stop() noexcept;

    uv_loop_t* raw() const noexcept;

    template <typename F>
    void walk(F&& callback)
    {
        auto func = [](uv_handle_t* handle, void* func)
        {
            if (!handle->data)
            {
                return;
            }
            auto& cb = *static_cast<F*>(func);

            switch (uvHandleToEventHandlerType(handle->type))
            {
                case EventHandlerType::TIMER:
                {
                    cb(*static_cast<TimerEventHandler*>(handle->data));
                    break;
                }
                case EventHandlerType::ASYNC:
                {
                    cb(*static_cast<AsyncEventHandler*>(handle->data));
                    break;
                }
                case EventHandlerType::IDLE:
                {
                    break;
                }
                default:
                    break;
            }
        };
        uv_walk(_loop.get(), func, &callback);
    }

    bool isInitialized() const;

private:
    std::unique_ptr<uv_loop_t> _loop;
    bool isLoopInitialized{false};
};
} // namespace uv
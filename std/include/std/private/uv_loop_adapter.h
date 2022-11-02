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

#include "ievent_loop.h"
#include "libuv_wrapper/loop.h"
#include "uv_timer_adapter.h"

#include <atomic>
#include <deque>

class UVLoopAdapter : public IEventLoop
{
public:
    using Time = uv::TimerEventHandler::Time;

    template <typename T, typename... E>
    using EventEmitter = EmitterBase<T, uv::ErrorEvent, E...>;

public:
    UVLoopAdapter();

    ~UVLoopAdapter() override;

    UVLoopAdapter(const UVLoopAdapter&) = delete;
    UVLoopAdapter& operator=(const UVLoopAdapter&) = delete;

    UVLoopAdapter(UVLoopAdapter&&) = delete;
    UVLoopAdapter& operator=(UVLoopAdapter&&) = delete;

    int run(bool lock = true) override;

    bool isRunning() const override;

    void stop() override;

    void enqueue(Callback&& callback) override;

    void processEvents() override;

    bool hasEventHandlers() const;

    template <typename R, typename... Args>
    std::shared_ptr<R> getUVEventHandler(Args... args) const
    {
        return _loop.get<R>(args...);
    }

private:
    void stopLoop();
    void processQueue();

private:
    uv::Loop _loop;
    std::atomic_bool _isRunning;
    std::deque<Callback> _pendingCallbacks;
    // Prevents run of exiting event loop.
    std::shared_ptr<uv::AsyncEventHandler> _asyncEventHandler;
};
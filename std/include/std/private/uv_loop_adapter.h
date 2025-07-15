#pragma once

#include "libuv_wrapper/loop.h"
#include "std/ievent_loop.h"

#include <atomic>
#include <deque>

class UVLoopAdapter : public IEventLoop
{
public:
    template <typename T, typename... E>
    using EventEmitter = EmitterBase<T, uv::ErrorEvent, E...>;

public:
    UVLoopAdapter();

    ~UVLoopAdapter() override;

    UVLoopAdapter(const UVLoopAdapter&) = delete;
    UVLoopAdapter& operator=(const UVLoopAdapter&) = delete;

    UVLoopAdapter(UVLoopAdapter&&) = delete;
    UVLoopAdapter& operator=(UVLoopAdapter&&) = delete;

    int run() override;

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
    void closeLoop();
    void processQueue();
    void initProcessingQueue();

private:
    uv::Loop _loop;
    std::atomic_bool _isRunning;
    std::deque<Callback> _pendingCallbacks;
    // use as post event
    std::shared_ptr<uv::IdleEventHandler> _postEventHandler;
};
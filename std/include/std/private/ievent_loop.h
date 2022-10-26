#pragma once

#include "itimer.h"

#include <functional>
#include <memory>

class IEventLoop
{
public:
    using Callback = std::function<void()>;

    IEventLoop() = default;

    virtual ~IEventLoop() = default;

    IEventLoop(const IEventLoop&) = delete;
    IEventLoop(IEventLoop&&) noexcept = delete;

    IEventLoop& operator=(const IEventLoop&) = delete;
    IEventLoop& operator=(IEventLoop&&) noexcept = delete;

    virtual int run(bool lock = true) = 0;

    virtual bool isRunning() const = 0;

    virtual void stop() = 0;

    virtual void enqueue(Callback&& callback) = 0;

    virtual void processEvents() = 0;
};

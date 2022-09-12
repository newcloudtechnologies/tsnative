#pragma once

#include <functional>
#include <chrono>

class ITimer {
public:
    using Callback = std::function<void()>;

    virtual ~ITimer() = default;

    virtual bool active() const = 0;

    virtual std::chrono::milliseconds due() const = 0;

    virtual void setInterval(std::chrono::milliseconds repeat, Callback && callback) = 0;

    virtual void setTimeout(std::chrono::milliseconds timeout, Callback && callback) = 0;

    virtual std::chrono::milliseconds getRepeat() const = 0;

    virtual void stop() = 0;

    virtual std::size_t getTimerID() const = 0;
};
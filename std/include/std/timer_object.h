#pragma once

#include <chrono>
#include <functional>

#include "std/id_generator.h"
#include "std/tsobject.h"

class TSClosure;

class TimerObject : public Object
{
public:
    using Callback = std::function<void()>;

    explicit TimerObject(TSClosure* closure);

    virtual ~TimerObject() = default;

    virtual bool active() const = 0;

    virtual std::chrono::milliseconds due() const = 0;

    virtual void setInterval(std::chrono::milliseconds repeat) = 0;

    virtual void setTimeout(std::chrono::milliseconds timeout) = 0;

    virtual std::chrono::milliseconds getRepeat() const = 0;

    virtual void stop() = 0;

    virtual ID getID() const = 0;

    std::vector<Object*> getChildObjects() const;

    const TSClosure& getClosure() const;

private:
    TSClosure* _closure;
};
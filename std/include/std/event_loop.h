#pragma once

#include <TS.h>

#include "std/ievent_loop.h"
#include "std/tsobject.h"

#include <memory>

class Number;

class TS_EXPORT TS_DECLARE EventLoop : public Object
{
public:
    EventLoop(IEventLoop& eventLoop);

    ~EventLoop();

    TS_METHOD Number* run();

    void stop();

    void processEvents();

    void enqueue(IEventLoop::Callback&& callback);

    TS_METHOD String* toString() const override;

    TS_METHOD Boolean* toBool() const override;

private:
    IEventLoop& _eventLoop;
};

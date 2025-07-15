#include "std/event_loop.h"

#include <std/tsboolean.h>
#include <std/tsnumber.h>
#include <std/tsstring.h>

#include "std/private/logger.h"

EventLoop::EventLoop(IEventLoop& eventLoop)
    : _eventLoop{eventLoop}
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("EventLoop::EventLoop(IEventLoop* eventLoop) address: ", this);
}

EventLoop::~EventLoop()
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("EventLoop::~EventLoop() address: ", this);
}

Number* EventLoop::run()
{
    LOG_METHOD_CALL;
    auto ret = _eventLoop.run();
    return new Number(ret);
}

void EventLoop::stop()
{
    LOG_METHOD_CALL;
    _eventLoop.stop();
}

void EventLoop::processEvents()
{
    LOG_METHOD_CALL;
    _eventLoop.processEvents();
}

void EventLoop::enqueue(IEventLoop::Callback&& callback)
{
    LOG_METHOD_CALL;
    _eventLoop.enqueue(std::move(callback));
}

String* EventLoop::toString() const
{
    return new String("Global event loop object");
}

Boolean* EventLoop::toBool() const
{
    LOG_METHOD_CALL;
    return new Boolean{true};
}
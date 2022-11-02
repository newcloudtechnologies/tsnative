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

#include "std/event_loop.h"
#include "std/private/logger.h"
#include <std/tsboolean.h>
#include <std/tsnumber.h>
#include <std/tsstring.h>

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

Number* EventLoop::run(Boolean* lock)
{
    LOG_METHOD_CALL;
    auto ret = _eventLoop.run(lock->unboxed());
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
    LOG_METHOD_CALL;
    return new String{"Global event loop object"};
}

Boolean* EventLoop::toBool() const
{
    LOG_METHOD_CALL;
    return new Boolean{true};
}
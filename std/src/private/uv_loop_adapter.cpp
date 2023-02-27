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

#include "std/private/uv_loop_adapter.h"
#include "std/private/logger.h"
#include "std/private/visitor.h"

#include "std/private/libuv_wrapper/async_event_handler.h"

UVLoopAdapter::UVLoopAdapter()
    : _loop{}
    , _isRunning{false}
    , _pendingCallbacks{}
    , _asyncEventHandler{_loop.get<uv::AsyncEventHandler>()}
{
    LOG_METHOD_CALL;
    if (!_loop.isInitialized())
    {
        throw std::runtime_error{"Error: Event loop is not initialized"};
    }
    _asyncEventHandler->on<uv::AsyncEvent>([this](auto&&...) { /* weak up */ processQueue(); });
}

UVLoopAdapter::~UVLoopAdapter()
{
    LOG_METHOD_CALL;
    stopLoop();
    _pendingCallbacks.clear();
}

int UVLoopAdapter::run(bool lock)
{
    LOG_METHOD_CALL;
    int res = 0;
    if (!isRunning())
    {
        _isRunning = true;
        res = _loop.run(lock ? uv::UVRunMode::DEFAULT : uv::UVRunMode::NOWAIT);
        if (!lock)
        {
            return 0;
        }
    }
    return res;
}

bool UVLoopAdapter::isRunning() const
{
    LOG_METHOD_CALL;
    return _isRunning;
}

void UVLoopAdapter::stop()
{
    LOG_METHOD_CALL;
    stopLoop();
}

void UVLoopAdapter::enqueue(Callback&& callback)
{
    LOG_METHOD_CALL;
    _pendingCallbacks.push_back(std::move(callback));
    _asyncEventHandler->send();
}

void UVLoopAdapter::processEvents()
{
    LOG_METHOD_CALL;
    _loop.run(uv::UVRunMode::NOWAIT);
}

bool UVLoopAdapter::hasEventHandlers() const
{
    return _loop.alive();
}

void UVLoopAdapter::stopLoop()
{
    LOG_METHOD_CALL;
    if (isRunning())
    {
        _loop.stop();
        _isRunning = false;
    }
    if (!(hasEventHandlers()))
    {
        return;
    }

    _loop.walk(makeVisitors([](uv::TimerEventHandler& timerHandle) { timerHandle.close(); },
                            [](uv::AsyncEventHandler& asyncHandle) { asyncHandle.close(); },
                            [](auto&&...) {}));
    int res = _loop.close();
    if (res == UV_EBUSY)
    {
        do
        {
            res = _loop.run(uv::UVRunMode::ONCE);
        } while (res != 0);
    }
}

void UVLoopAdapter::processQueue()
{
    LOG_METHOD_CALL;
    while (!_pendingCallbacks.empty())
    {
        Callback& callback = _pendingCallbacks.front();
        callback();
        _pendingCallbacks.pop_front();
    }
}
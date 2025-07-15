#include "std/private/uv_loop_adapter.h"
#include "std/private/libuv_wrapper/idle_event_handler.h"
#include "std/private/libuv_wrapper/timer_event_handler.h"
#include "std/private/logger.h"

UVLoopAdapter::UVLoopAdapter()
    : _loop{}
    , _isRunning{false}
    , _pendingCallbacks{}
    , _postEventHandler{_loop.get<uv::IdleEventHandler>()}
{
    LOG_METHOD_CALL;
    if (!_loop.isInitialized())
    {
        throw std::runtime_error{"Error: Event loop is not initialized"};
    }
    if (!_postEventHandler)
    {
        throw std::runtime_error{"Error: Post event handler is not initialized"};
    }
    initProcessingQueue();
}

UVLoopAdapter::~UVLoopAdapter()
{
    LOG_METHOD_CALL;
    stopLoop();
    closeLoop();
    _pendingCallbacks.clear();
}

int UVLoopAdapter::run()
{
    LOG_METHOD_CALL;
    int res = 0;
    if (!isRunning())
    {
        _isRunning = true;
        res = _loop.run(uv::UVRunMode::DEFAULT);
        _isRunning = false;
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
    _postEventHandler->start();
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
    _loop.stop();
    _isRunning = false;
}

void UVLoopAdapter::closeLoop()
{
    LOG_METHOD_CALL;
    _loop.walk([](auto& handle) { handle.close(); });
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

void UVLoopAdapter::initProcessingQueue()
{
    if (_postEventHandler)
    {
        _postEventHandler->on<uv::IdleEvent>(
            [this](auto&, auto& handle)
            {
                processQueue();
                handle.stop();
            });
    }
}
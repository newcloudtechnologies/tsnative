#include "std/private/uv_timer_adapter.h"
#include "std/private/logger.h"
#include "std/private/uv_loop_adapter.h"

using namespace std::chrono_literals;

UVTimerAdapter::UVTimerAdapter(const UVLoopAdapter& uvLoopAdapter, std::size_t timerID)
    : _timerHandler{uvLoopAdapter.getUVEventHandler<uv::TimerEventHandler>()}
    , _timerID{timerID}
{
    LOG_METHOD_CALL;
}

UVTimerAdapter::~UVTimerAdapter()
{
    LOG_METHOD_CALL;
    if (_timerHandler->active())
    {
        _timerHandler->stop();
    }
    _timerHandler->close();
}

bool UVTimerAdapter::active() const
{
    LOG_METHOD_CALL;
    return _timerHandler->active();
}

std::chrono::milliseconds UVTimerAdapter::due() const
{
    LOG_METHOD_CALL;
    return _timerHandler->dueIn();
}

void UVTimerAdapter::setInterval(std::chrono::milliseconds repeat, Callback&& callback)
{
    LOG_METHOD_CALL;
    _timerHandler->on<uv::TimerEvent>(
        [callback = std::move(callback), repeat](auto&, auto& h)
        {
            callback();
            if (!repeat.count())
            {
                h.start(0ms, repeat);
            }
        });
    _timerHandler->start(0ms, repeat);
}

void UVTimerAdapter::setTimeout(std::chrono::milliseconds timeout, Callback&& callback)
{
    LOG_METHOD_CALL;
    _timerHandler->on<uv::TimerEvent>(
        [callback = std::move(callback)](auto&, auto& h)
        {
            callback();
            h.stop();
        });
    _timerHandler->start(timeout, 0ms);
}

std::chrono::milliseconds UVTimerAdapter::getRepeat() const
{
    LOG_METHOD_CALL;
    return _timerHandler->repeat();
}

void UVTimerAdapter::stop()
{
    LOG_METHOD_CALL;
    if (active())
    {
        _timerHandler->stop();
    }
}

std::size_t UVTimerAdapter::getTimerID() const
{
    return _timerID;
}
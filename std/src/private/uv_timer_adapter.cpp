#include "std/private/uv_timer_adapter.h"

#include "std/tsclosure.h"

#include "std/private/logger.h"
#include "std/private/uv_loop_adapter.h"

using namespace std::chrono_literals;

UVTimerAdapter::UVTimerAdapter(const UVLoopAdapter& uvLoopAdapter, TSClosure* closure, ID timerID)
    : TimerObject(closure)
    , _timerHandler{uvLoopAdapter.getUVEventHandler<uv::TimerEventHandler>()}
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

void UVTimerAdapter::setInterval(std::chrono::milliseconds repeat)
{
    LOG_METHOD_CALL;
    _timerHandler->on<uv::TimerEvent>([this, repeat](auto&&...) { getClosure().call(); });
    if (repeat.count() <= 0)
    {
        repeat = 1ms;
    }
    _timerHandler->start(0ms, repeat);
}

void UVTimerAdapter::setTimeout(std::chrono::milliseconds timeout)
{
    LOG_METHOD_CALL;
    _timerHandler->on<uv::TimerEvent>(
        [this](auto&, auto& h)
        {
            getClosure().call();
            h.stop();
        });
    if (timeout.count() < 0)
    {
        timeout = 0ms;
    }
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
    _timerHandler->stop();
}

ID UVTimerAdapter::getID() const
{
    return _timerID;
}
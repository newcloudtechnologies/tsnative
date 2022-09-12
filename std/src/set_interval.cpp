#include "std/set_interval.h"
#include "std/event_loop.h"
#include "std/private/itimer.h"
#include "std/runtime.h"
#include "std/tsclosure.h"
#include "std/tsnumber.h"

Number* setInterval(TSClosure* handler, Number* timeout)
{
    using namespace std::chrono_literals;

    auto timer = Runtime::getTimersStorage()->createTimer();

    auto t = std::chrono::milliseconds{static_cast<uint64_t>(timeout->unboxed())};
    timer->setInterval(t, [handler] { handler->call(); });

    return new Number(static_cast<double>(timer->getTimerID()));
}

void clearInterval(Number* handle)
{
    std::size_t timerId = handle->unboxed();
    Runtime::getTimersStorage()->removeTimerById(timerId);
}
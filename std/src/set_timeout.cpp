#include "std/set_timeout.h"
#include "std/event_loop.h"
#include "std/private/itimer.h"
#include "std/runtime.h"
#include "std/tsstring.h"
#include <std/tsclosure.h>
#include <std/tsnumber.h>

#include <chrono>

Number* setTimeout(TSClosure* handler, Number* timeout)
{
    using namespace std::chrono_literals;

    auto timer = Runtime::getTimersStorage()->createTimer();
    auto timerId = timer->getTimerID();

    auto t = std::chrono::milliseconds{static_cast<uint64_t>(timeout->unboxed())};
    timer->setTimeout(t,
                      [handler, timerId]
                      {
                          handler->call();
                          clearTimeout(new Number(static_cast<double>(timerId)));
                      });

    return new Number(static_cast<double>(timerId));
}

void clearTimeout(Number* handle)
{
    std::size_t timerId = handle->unboxed();
    Runtime::getTimersStorage()->removeTimerById(timerId);
}
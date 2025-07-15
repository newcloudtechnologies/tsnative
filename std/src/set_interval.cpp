#include "std/set_interval.h"

#include "std/event_loop.h"
#include "std/id_generator.h"
#include "std/itimer_creator.h"
#include "std/runtime.h"
#include "std/timer_object.h"
#include "std/tsclosure.h"
#include "std/tsnumber.h"

#include <cassert>

Number* setInterval(TSClosure* handler, Number* interval)
{
    using namespace std::chrono_literals;

    auto* timer = Runtime::getTimerCreator().create(handler);
    auto timerId = timer->getID();

    Runtime::getMutableTimerStorage().emplace(timerId, *timer);

    auto timeRange = std::chrono::milliseconds{static_cast<uint64_t>(interval->unboxed())};
    timer->setInterval(timeRange);

    return new Number(static_cast<double>(timerId));
}

void clearInterval(Number* handle)
{
    auto& timerStorage = Runtime::getMutableTimerStorage();
    ID timerId = static_cast<ID>(handle->unboxed());

    auto found = timerStorage.find(timerId);
    if (found != timerStorage.end())
    {
        found->second.get().stop();
        timerStorage.erase(found);
    }
}
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

#include "std/set_timeout.h"

#include "std/event_loop.h"
#include "std/itimer_creator.h"
#include "std/runtime.h"
#include "std/timer_object.h"
#include "std/tsclosure.h"
#include "std/tsnumber.h"
#include "std/tsstring.h"

#include "std/id_generator.h"

#include <cassert>
#include <chrono>

Number* setTimeout(TSClosure* handler, Number* timeout)
{
    using namespace std::chrono_literals;

    auto* timer = Runtime::getTimerCreator().create(handler);

    assert(timer && "setTimeout was nullptr after creation");

    auto timerId = timer->getID();
    Runtime::getMutableTimerStorage().emplace(timerId, *timer);

    auto tm = std::chrono::milliseconds{static_cast<uint64_t>(timeout->unboxed())};
    timer->setTimeout(tm);

    return new Number(static_cast<double>(timerId));
}

void clearTimeout(Number* handle)
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
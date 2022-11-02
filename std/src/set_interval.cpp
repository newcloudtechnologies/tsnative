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
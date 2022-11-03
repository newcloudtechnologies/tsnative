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
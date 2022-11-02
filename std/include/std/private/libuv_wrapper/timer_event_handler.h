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

#pragma once

#include "event_handler.h"

namespace uv
{

struct TimerEvent
{
};

class TimerEventHandler : public EventHandler<TimerEventHandler, uv_timer_t, TimerEvent>
{
    static void startCallback(uv_timer_t* uv_timer_handle);

public:
    using Time = std::chrono::duration<uint64_t, std::milli>;
    using EventHandler::EventHandler;

    int init() override;

    int start(Time timeout, Time repeat);

    int stop();

    int again();

    void repeat(Time repeat);

    Time repeat();

    Time dueIn();
};
} // namespace uv
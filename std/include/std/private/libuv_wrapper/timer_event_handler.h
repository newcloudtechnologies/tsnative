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
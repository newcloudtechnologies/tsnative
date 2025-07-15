#pragma once

#include "event_handler.h"

namespace uv
{

struct IdleEvent
{
};

class IdleEventHandler : public EventHandler<IdleEventHandler, uv_idle_t, IdleEvent>
{
    static void startCallback(uv_idle_t* handle);

public:
    using EventHandler::EventHandler;

    int init() override;

    int start() noexcept;

    int stop() noexcept;
};
} // namespace uv
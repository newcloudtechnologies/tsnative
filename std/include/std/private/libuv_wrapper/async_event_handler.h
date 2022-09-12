#pragma once

#include "event_handler.h"

namespace uv
{

struct AsyncEvent
{
};

class AsyncEventHandler final : public EventHandler<AsyncEventHandler, uv_async_t, AsyncEvent>
{
    static void sendCallback(uv_async_t* handle);

public:
    using EventHandler::EventHandler;

    int init() override;

    int send();
};

} // namespace uv
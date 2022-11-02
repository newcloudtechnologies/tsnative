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
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
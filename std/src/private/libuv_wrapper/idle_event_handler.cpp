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

#include "std/private/libuv_wrapper/idle_event_handler.h"

namespace uv
{
void IdleEventHandler::startCallback(uv_idle_t* handle)
{
    IdleEventHandler& idleEventHandler = *(static_cast<IdleEventHandler*>(handle->data));
    idleEventHandler.emit(IdleEvent{});
}

int IdleEventHandler::init()
{
    return ownerShipIf(uv_idle_init(parent().raw(), raw()));
}

int IdleEventHandler::start() noexcept
{
    return uv_idle_start(raw(), &startCallback);
}

int IdleEventHandler::stop() noexcept
{
    return uv_idle_stop(raw());
}
} // namespace uv
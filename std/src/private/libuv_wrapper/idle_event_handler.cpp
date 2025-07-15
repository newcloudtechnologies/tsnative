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
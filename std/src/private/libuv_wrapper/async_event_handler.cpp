#include "std/private/libuv_wrapper/async_event_handler.h"

void uv::AsyncEventHandler::sendCallback(uv_async_t* handle)
{
    AsyncEventHandler& async_handle = *(static_cast<AsyncEventHandler*>(handle->data));
    async_handle.emit(AsyncEvent{});
}

int uv::AsyncEventHandler::init()
{
    return ownerShipIf(uv_async_init(parent().raw(), raw(), &sendCallback));
}

int uv::AsyncEventHandler::send()
{
    return uv_async_send(raw());
}
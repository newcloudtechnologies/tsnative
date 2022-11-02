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
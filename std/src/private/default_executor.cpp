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

#include "std/private/default_executor.h"
#include "absl/base/internal/invoke.h"
#include "std/ievent_loop.h"

DefaultExecutor::DefaultExecutor(IEventLoop& eventLoop)
    : _eventLoop{eventLoop}
{
}

void DefaultExecutor::enqueue(Callback&& callback) const noexcept
{
    _eventLoop.enqueue([callback = std::move(callback)] { callback(); });
}
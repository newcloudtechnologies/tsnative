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
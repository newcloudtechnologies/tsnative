#include "std/private/internal_state.h"
#include "std/private/logger.h"
#include "std/private/promise.h"
#include "std/tsobject.h"

Promise::Promise()
    : _internalState{std::make_shared<InternalState>()}
{
}

Promise::Promise(const Promise& other)
    : _internalState{other._internalState}
{
}

Promise Promise::then(Object* onResolved, Object* onRejected)
{
    Promise next{};
    _internalState->attach(next, onResolved, onRejected);
    return next;
}

Promise Promise::then(Object* onResolved)
{
    return then(onResolved, nullptr);
}

Promise Promise::then()
{
    return then(nullptr, nullptr);
}

Promise Promise::fail(Object* onRejected)
{
    return then(nullptr, onRejected);
}

Promise Promise::finally(Object* onFinally)
{
    return then(onFinally, onFinally);
}

void Promise::resolve(Object* resolved)
{
    _internalState->resolve(InternalState::Result::makeValue(resolved));
}

void Promise::reject(Object* rejected)
{
    _internalState->reject(InternalState::Result::makeError(rejected));
}

bool Promise::ready() const
{
    return _internalState->ready();
}

bool Promise::isFulfilled() const
{
    return _internalState->isFulfilled();
}

bool Promise::isRejected() const
{
    return _internalState->isRejected();
}

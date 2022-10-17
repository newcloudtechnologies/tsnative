#include "std/private/promise_p.h"
#include "std/private/internal_state.h"

PromisePrivate::PromisePrivate()
    : _internalState{std::make_shared<InternalState>()}
{
}

PromisePrivate::PromisePrivate(const PromisePrivate& other)
    : _internalState{other._internalState}
{
}

PromisePrivate PromisePrivate::then(Object* onResolved, Object* onRejected)
{
    PromisePrivate next{};
    _internalState->attach(next, onResolved, onRejected);
    return next;
}

PromisePrivate PromisePrivate::then(Object* onResolved)
{
    return then(onResolved, nullptr);
}

PromisePrivate PromisePrivate::then()
{
    return then(nullptr, nullptr);
}

PromisePrivate PromisePrivate::fail(Object* onRejected)
{
    return then(nullptr, onRejected);
}

PromisePrivate PromisePrivate::finally(Object* onFinally)
{
    return then(onFinally, onFinally);
}

void PromisePrivate::resolve(Object* resolved)
{
    _internalState->resolve(InternalState::Result::makeValue(resolved));
}

void PromisePrivate::reject(Object* rejected)
{
    _internalState->reject(InternalState::Result::makeError(rejected));
}

bool PromisePrivate::ready() const
{
    return _internalState->ready();
}

bool PromisePrivate::isFulfilled() const
{
    return _internalState->isFulfilled();
}

bool PromisePrivate::isRejected() const
{
    return _internalState->isRejected();
}

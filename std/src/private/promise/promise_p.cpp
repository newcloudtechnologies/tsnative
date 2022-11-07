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

#include "std/private/promise/promise_p.h"
#include "std/private/promise/shared_promise_internal_state.h"

PromisePrivate::PromisePrivate()
    : _internalState{std::make_shared<SharedPromiseInternalState>()}
{
}

PromisePrivate PromisePrivate::then(Object* onResolved, Object* onRejected, IExecutor& executor)
{
    PromisePrivate next{};
    _internalState->attach(next, onResolved, onRejected, executor);
    return next;
}

void PromisePrivate::resolve(Object* resolved)
{
    _internalState->resolve(Result::makeValue(resolved));
}

void PromisePrivate::reject(Object* rejected)
{
    _internalState->reject(Result::makeError(rejected));
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

bool PromisePrivate::operator==(const PromisePrivate& other) const
{
    return _internalState == other._internalState;
}

bool PromisePrivate::operator!=(const PromisePrivate& other) const
{
    return !(*this == other);
}

Object* PromisePrivate::getResult() const
{
    return _internalState->getResult();
}
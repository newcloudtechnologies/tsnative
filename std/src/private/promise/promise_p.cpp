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
#include "std/tspromise.h"
#include "std/tsstring.h"
#include <utility>

PromisePrivate::PromisePrivate()
    : _internalState{std::make_shared<SharedPromiseInternalState>()}
    , _connector{std::make_shared<Connector>(_internalState)}
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
    if (resolved->isPromise())
    {
        auto* tsPromise = static_cast<Promise*>(resolved);
        return joinPromise(tsPromise);
    }
    _internalState->resolve(Result::makeValue(resolved));
}

void PromisePrivate::reject(Object* rejected)
{
    if (rejected->isPromise())
    {
        auto* tsPromise = static_cast<Promise*>(rejected);
        return joinPromise(tsPromise);
    }
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

void PromisePrivate::joinPromise(Promise* tsPromise)
{
    if (tsPromise->ready())
    {
        return transferResult(tsPromise);
    }
    tsPromise->on<ReadyEvent>([this, tsPromise](auto&&...) { transferResult(tsPromise); });
}

void PromisePrivate::transferResult(Promise* readyPromise)
{
    if (readyPromise->isFulfilled())
    {
        resolve(readyPromise->getResult());
    }
    else if (readyPromise->isRejected())
    {
        reject(readyPromise->getResult());
    }
}

std::weak_ptr<PromisePrivate::Connector> PromisePrivate::getReadyConnector() const
{
    return _connector;
}

PromisePrivate::Connector::Connector(std::weak_ptr<SharedPromiseInternalState> weakInternalState)
    : _weakInternalState{std::move(weakInternalState)}
{
    if (auto ptr = _weakInternalState.lock())
    {
        ptr->on<ReadyEvent>([this](auto&&...) { emit(ReadyEvent{}); });
    }
}

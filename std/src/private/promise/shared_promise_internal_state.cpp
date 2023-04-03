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

#include "std/private/promise/shared_promise_internal_state.h"
#include "std/event_loop.h"
#include "std/private/iexecutor.h"
#include "std/private/promise/promise_callback.h"

void SharedPromiseInternalState::attach(PromisePrivate next,
                                        Object* onFulfilled,
                                        Object* onRejected,
                                        IExecutor& executor)
{
    auto promiseCallback = std::make_shared<PromiseCallback>(onFulfilled, onRejected, next);

    auto sender = [self = shared_from_this(), promiseCallback]() mutable
    {
        if (self->isFulfilled())
        {
            promiseCallback->emit(SuccessEvent{self->getResult()});
        }
        else if (self->isRejected())
        {
            promiseCallback->emit(ErrorEvent{self->getResult()});
        }
    };

    on<ReadyEvent>([&executor, sender = std::move(sender)](auto&&...) { executor.enqueue(std::move(sender)); });

    if (ready())
    {
        emit(ReadyEvent{});
    }
}

bool SharedPromiseInternalState::resolve(Result&& resolved)
{
    if (!ready())
    {
        _state.dispatch(FulfilledEvent{});
        _result = std::move(resolved);
        emit(ReadyEvent{});
        return true;
    }
    return false;
}

bool SharedPromiseInternalState::reject(Result&& rejected)
{
    if (!ready())
    {
        _state.dispatch(RejectedEvent{});
        _result = std::move(rejected);
        emit(ReadyEvent{});
        return true;
    }
    return false;
}

bool SharedPromiseInternalState::ready() const
{
    return isFulfilled() || isRejected();
}

bool SharedPromiseInternalState::isFulfilled() const
{
    return static_cast<size_t>(States::Fulfilled) == _state.index();
}

bool SharedPromiseInternalState::isRejected() const
{
    return static_cast<size_t>(States::Rejected) == _state.index();
}

Object* SharedPromiseInternalState::getResult() const
{
    auto unwrap = [](const Result& value) { return value.isValid() ? value.get() : value.getError(); };
    return ready() ? unwrap(_result.value()) : nullptr;
}

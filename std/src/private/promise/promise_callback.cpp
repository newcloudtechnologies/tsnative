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

#include "std/private/promise/promise_callback.h"
#include "std/tsclosure.h"
#include "std/tsobject.h"
#include "std/tsundefined.h"

#include <cassert>

PromiseCallback::PromiseCallback(Object* onFulfilled, Object* onRejected, PromisePrivate nextPromise)
    : _onFulfilled{onFulfilled}
    , _onRejected{onRejected}
    , _nextPromise{nextPromise}
{
    if (!has<SuccessEvent>())
    {
        on<SuccessEvent>([this](SuccessEvent& successEvent, auto&)
                         { invoke(_onFulfilled, Result::makeValue(successEvent.data)); });
    }
    if (!has<ErrorEvent>())
    {
        on<ErrorEvent>([this](ErrorEvent& errorEvent, auto&)
                       { invoke(_onRejected, Result::makeError(errorEvent.data)); });
    }
}

void PromiseCallback::invoke(Object* object, Result&& arg) noexcept
{
    assert(object && "Invalid object");

    if (object->isClosure())
    {
        auto* closure = static_cast<TSClosure*>(object);
        return callClosure(closure, std::move(arg));
    }
    return transferResult(std::move(arg));
}

void PromiseCallback::callClosure(TSClosure* closure, Result&& arg) noexcept
{
    try
    {
        bool hasArguments = closure->getNumArgs()->unboxed() != 0;
        if (hasArguments)
        {
            closure->setEnvironmentElement(arg ? arg.get() : arg.getError(), 0);
            auto* res = Object::asObjectPtr(closure->call());
            _nextPromise.resolve(res);
        }
        else
        {
            closure->call();
            transferResult(std::move(arg));
        }
    }
    catch (void* e) // On TS side exception has type a void *
    {
        auto* reason = Object::asObjectPtr(e);
        _nextPromise.reject(reason);
    }
    catch (...)
    {
        _nextPromise.reject(Undefined::instance());
    }
}

void PromiseCallback::transferResult(Result&& arg) noexcept
{
    if (arg)
    {
        _nextPromise.resolve(arg.get());
    }
    else
    {
        _nextPromise.reject(arg.getError());
    }
}

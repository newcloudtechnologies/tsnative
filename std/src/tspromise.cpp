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

#include "std/tspromise.h"

#include "std/runtime.h"
#include "std/tsboolean.h"
#include "std/tsclosure.h"
#include "std/tsstring.h"
#include "std/tsunion.h"

#include "std/private/logger.h"
#include "std/private/make_closure_from_lambda.h"
#include "std/private/promise/promise_p.h"
#include "std/private/to_string_impl.h"

#include <sstream>

Promise* Promise::resolve(Union* resolved)
{
    LOG_METHOD_CALL;
    LOG_INFO("Calling static method resolve ");

    auto* promise = new Promise{new PromisePrivate{}};
    promise->success(resolved->getValue());
    return promise;
}

Promise* Promise::reject(Object* rejected)
{
    LOG_METHOD_CALL;
    LOG_INFO("Calling static method reject ");

    auto* promise = new Promise{new PromisePrivate{}};
    promise->failure(rejected);
    return promise;
}

Promise::Promise(PromisePrivate* promisePrivate)
    : Object{TSTypeID::Promise}
    , _d{promisePrivate}
{
    if (auto ptr = _d->getReadyConnector().lock())
    {
        ptr->on<ReadyEvent>([this](auto&&...) { this->emit(ReadyEvent{}); });
    }
}

Promise::Promise(TSClosure* executor)
    : Promise{new PromisePrivate{}}
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling Promise ctor with executor for ", this);

    auto* resolve = makeClosure<TSClosure>(
        [this](Object** resolved) -> Object*
        {
            success(*resolved);
            return Undefined::instance();
        });

    auto* reject = makeClosure<TSClosure>(
        [this](Object** rejected) -> Object*
        {
            failure(*rejected);
            return Undefined::instance();
        });

    const auto numArgs = (std::size_t)executor->getNumArgs()->unboxed();
    assert(numArgs == 1 || numArgs == 2);
    executor->setEnvironmentElement(resolve, 0);
    if (numArgs == 2)
    {
        executor->setEnvironmentElement(reject, 1);
    }
    executor->call();
}

Promise::~Promise()
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling Promise dtor for ", this);
    delete _d;
}

Promise* Promise::then(Union* onFulfilled, Union* onRejected)
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling then method for ", this);
    auto* next = new PromisePrivate{_d->then(onFulfilled->getValue(), onRejected->getValue(), *Runtime::getExecutor())};
    return new Promise{next};
}

Promise* Promise::catchException(Union* onRejected)
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling fail method for ", this);
    auto* next = new PromisePrivate{_d->then(Undefined::instance(), onRejected->getValue(), *Runtime::getExecutor())};
    return new Promise{next};
}

Promise* Promise::finally(Union* onFinally)
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling finally method for ", this);
    auto* next = new PromisePrivate{_d->then(onFinally->getValue(), onFinally->getValue(), *Runtime::getExecutor())};
    return new Promise{next};
}

Object* Promise::getResult() const
{
    LOG_METHOD_CALL;
    return _d->getResult();
}

bool Promise::ready() const
{
    LOG_METHOD_CALL;
    return _d->ready();
}

bool Promise::isFulfilled() const
{
    LOG_METHOD_CALL;
    return _d->isFulfilled();
}

bool Promise::isRejected() const
{
    LOG_METHOD_CALL;
    return _d->isRejected();
}

void Promise::success(Object* resolved)
{
    LOG_METHOD_CALL;
    _d->resolve(resolved);
}

void Promise::failure(Object* rejected)
{
    LOG_METHOD_CALL;
    _d->reject(rejected);
}

Boolean* Promise::equals(Object* other) const
{
    if (!other->isPromise())
    {
        return new Boolean(false);
    }

    auto* otherPromise = static_cast<Promise*>(other);
    bool result = (this == otherPromise);

    return new Boolean(result);
}

std::string Promise::toStdString() const
{
    auto msg = (_d->ready() ? getResult()->toStdString() : "<pending>");
    std::stringstream ss;
    ss << "{ " << msg << "}";
    return ss.str();
}

DEFAULT_TO_STRING_IMPL(Promise)

Boolean* Promise::toBool() const
{
    return new Boolean{static_cast<bool>(_d)};
}

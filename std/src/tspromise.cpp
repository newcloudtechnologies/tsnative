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

#include "std/tspromise.h"

#include "std/gc.h"
#include "std/runtime.h"
#include "std/tsboolean.h"
#include "std/tsclosure.h"
#include "std/tsstring.h"
#include "std/tsunion.h"

#include "std/make_closure_from_lambda.h"
#include "std/private/algorithms.h"
#include "std/private/logger.h"
#include "std/private/promise/promise_p.h"

#include <cassert>

Promise* Promise::resolve(Union* resolved)
{
    LOG_INFO("Calling static method resolve ");

    auto* promise = new Promise{new PromisePrivate{}, {}};
    promise->success(resolved->getValue());
    return promise;
}

Promise* Promise::reject(Object* rejected)
{
    LOG_INFO("Calling static method reject ");

    auto* promise = new Promise{new PromisePrivate{}, {}};
    promise->failure(rejected);
    return promise;
}

Promise::Promise(PromisePrivate* promisePrivate, std::vector<Object*>&& childs)
    : Object{TSTypeID::Promise}
    , _d{promisePrivate}
    , _promiseID{IDGenerator{}.createID()}
    , _children{std::move(childs)}
    , _pseudoRoot(new void*())
{
    LOG_ADDRESS("Call delegate Promise ctor for ", this);
    if (!Runtime::isInitialized())
    {
        LOG_INFO("Runtime is not initialized.");
        return;
    }
    if (auto ptr = _d->getReadyConnector().lock())
    {
        ptr->on<ReadyEvent>(
            [this](auto&&...)
            {
                _children.push_back(getResult());
                this->emit(ReadyEvent{});
                removeKeeperAlive();
            });
    }

    *_pseudoRoot = this;
    if (Runtime::isInitialized())
    {
        Runtime::getMemoryManager()->getGC()->addRoot(_pseudoRoot, nullptr);
    }
}

Promise::Promise(TSClosure* executor)
    : Promise{new PromisePrivate{}, {executor}}
{
    LOG_ADDRESS("Calling Promise ctor with executor for ", this);

    const auto numArgs = executor->getNumArgs();

    assert(numArgs == 1 || numArgs == 2);

    executor->setEnvironmentElement(makeResolveClosure(), 0);
    if (numArgs == 2)
    {
        executor->setEnvironmentElement(makeRejectClosure(), 1);
    }
    executor->call();
}

Promise::~Promise()
{
    LOG_ADDRESS("Calling Promise dtor for ", this);
    delete _d;
}

ID Promise::getID() const
{
    return _promiseID;
}

Promise* Promise::then(Union* onFulfilled, Union* onRejected)
{
    LOG_ADDRESS("Calling then method for ", this);

    auto* next = new PromisePrivate{_d->then(onFulfilled->getValue(), onRejected->getValue(), Runtime::getExecutor())};
    auto result = new Promise{next, {onFulfilled, onRejected, this}};
    return result;
}

Promise* Promise::catchException(Union* onRejected)
{
    LOG_ADDRESS("Calling fail method for ", this);
    return then(new Union{}, onRejected);
}

Promise* Promise::finally(Union* onFinally)
{
    LOG_ADDRESS("Calling finally method for ", this);
    return then(onFinally, onFinally);
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
    assert(resolved && "resolve is null");
    _d->resolve(resolved);
    removeKeeperAlive();
}

void Promise::removeKeeperAlive()
{
    if (_pseudoRoot && Runtime::isInitialized())
    {
        Runtime::getMemoryManager()->getGC()->removeRoot(_pseudoRoot);
        delete _pseudoRoot;
        _pseudoRoot = nullptr;
    }
}

void Promise::failure(Object* rejected)
{
    LOG_METHOD_CALL;
    assert(rejected && "rejected is null");
    _d->reject(rejected);
    removeKeeperAlive();
}

Boolean* Promise::equals(Object* other) const
{
    if (!other->isPromiseCpp())
    {
        return new Boolean(false);
    }

    auto* otherPromise = static_cast<Promise*>(other);
    bool result = (this == otherPromise);

    return new Boolean(result);
}

String* Promise::toString() const
{
    return new String("[object Promise]");
}

Boolean* Promise::toBool() const
{
    return new Boolean{static_cast<bool>(_d)};
}

std::vector<Object*> Promise::getChildObjects() const
{
    return _children;
}

TSClosure* Promise::makeResolveClosure()
{
    return makeClosure(
        [this](Object** resolved)
        {
            success(*resolved);
            return Undefined::instance();
        });
}

TSClosure* Promise::makeRejectClosure()
{
    return makeClosure(
        [this](Object** rejected)
        {
            failure(*rejected);
            return Undefined::instance();
        });
}

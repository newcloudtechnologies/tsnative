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

#include "std/runtime.h"
#include "std/tsboolean.h"
#include "std/tsclosure.h"
#include "std/tsstring.h"
#include "std/tsunion.h"

#include "std/private/algorithms.h"
#include "std/private/logger.h"
#include "std/private/promise/promise_p.h"

#include <cassert>
#include <sstream>

namespace
{
TSClosure* makeClosure(void* (*envCall)(void***), Promise* promise)
{
    void*** env = (void***)malloc(2 * sizeof(void**));

    env[0] = (void**)malloc(sizeof(void**));
    *(env[0]) = (void*)malloc(sizeof(void*));

    auto** promiseStar = (void**)malloc(sizeof(void*));
    *promiseStar = (void*)promise;
    env[1] = promiseStar;

    auto* envLength = new Number{2.f};
    auto* numArgs = new Number{1.f};
    auto* opt = new Number{0.f};

    return new TSClosure{(void*)envCall, env, envLength, numArgs, opt};
}
} // namespace

Promise* Promise::resolve(Union* resolved)
{
    LOG_METHOD_CALL;
    LOG_INFO("Calling static method resolve ");

    auto* promise = new Promise{new PromisePrivate{}, {}};
    promise->success(resolved->getValue());
    return promise;
}

Promise* Promise::reject(Object* rejected)
{
    LOG_METHOD_CALL;
    LOG_INFO("Calling static method reject ");

    auto* promise = new Promise{new PromisePrivate{}, {}};
    promise->failure(rejected);
    return promise;
}

Promise::Promise(PromisePrivate* promisePrivate, std::vector<Object*>&& childs)
    : Object{TSTypeID::Promise}
    , _d{promisePrivate}
    , _promiseID{IDGenerator{}.createID()}
    , _childs{std::move(childs)}
{
    if (auto ptr = _d->getReadyConnector().lock())
    {
        ptr->on<ReadyEvent>([this](auto&&...) { this->emit(ReadyEvent{}); });
    }
    Runtime::getMutablePromiseStorage().emplace(getID(), *this);
}

Promise::Promise(TSClosure* executor)
    : Promise{new PromisePrivate{}, {executor}}
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling Promise ctor with executor for ", this);

    const auto numArgs = (std::size_t)executor->getNumArgs()->unboxed();
    assert(numArgs == 1 || numArgs == 2);
    executor->setEnvironmentElement(makeResolveClosure(this), 0);
    if (numArgs == 2)
    {
        executor->setEnvironmentElement(makeRejectClosure(this), 1);
    }
    executor->call();
}

Promise::~Promise()
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling Promise dtor for ", this);
    delete _d;
}

ID Promise::getID() const
{
    return _promiseID;
}

Promise* Promise::then(Union* onFulfilled, Union* onRejected)
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling then method for ", this);
    auto* next = new PromisePrivate{_d->then(onFulfilled->getValue(), onRejected->getValue(), Runtime::getExecutor())};
    return new Promise{next, {onFulfilled, onRejected}};
}

Promise* Promise::catchException(Union* onRejected)
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling fail method for ", this);
    auto* next = new PromisePrivate{_d->then(Undefined::instance(), onRejected->getValue(), Runtime::getExecutor())};
    return new Promise{next, {onRejected}};
}

Promise* Promise::finally(Union* onFinally)
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling finally method for ", this);
    auto* next = new PromisePrivate{_d->then(onFinally->getValue(), onFinally->getValue(), Runtime::getExecutor())};
    return new Promise{next, {onFinally}};
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
}

void Promise::failure(Object* rejected)
{
    LOG_METHOD_CALL;
    assert(rejected && "rejected is null");
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

String* Promise::toString() const
{
    auto msg = (_d->ready() ? getResult()->toString()->cpp_str() : "<pending>");
    std::stringstream ss;
    ss << "{ " << msg << "}";
    return new String(ss.str());
}

Boolean* Promise::toBool() const
{
    return new Boolean{static_cast<bool>(_d)};
}

std::vector<Object*> Promise::getChildObjects() const
{
    return _childs;
}

TSClosure* Promise::makeResolveClosure(Promise* promise)
{
    static const auto resolvePromise = [](Promise** promise, Object** value)
    {
        assert(promise && "**promise is null");
        assert(*promise && "*promise is null");
        (*promise)->success(*value);
    };

    static const auto ptr = [](void*** env) -> void*
    {
        assert(env && "Environment is null");
        assert(env[0] && "env[0] is null");
        assert(env[1] && "env[1] is null");

        resolvePromise(reinterpret_cast<Promise**>(env[1]), reinterpret_cast<Object**>(env[0]));
        return nullptr;
    };
    return makeClosure(ptr, promise);
}

TSClosure* Promise::makeRejectClosure(Promise* promise)
{
    static const auto rejectPromise = [](Promise** promise, Object** value)
    {
        assert(promise && "**promise is null");
        assert(*promise && "*promise is null");
        (*promise)->failure(*value);
    };

    static const auto ptr = [](void*** env) -> void*
    {
        assert(env && "Environment is null");
        assert(env[0] && "env[0] is null");
        assert(env[1] && "env[1] is null");

        rejectPromise(reinterpret_cast<Promise**>(env[1]), reinterpret_cast<Object**>(env[0]));
        return nullptr;
    };
    return makeClosure(ptr, promise);
}
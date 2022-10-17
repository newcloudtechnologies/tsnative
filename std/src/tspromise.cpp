#include "std/tspromise.h"
#include "std/private/logger.h"
#include "std/private/promise_p.h"
#include "std/tsboolean.h"
#include "std/tsclosure.h"
#include "std/tsstring.h"
#include "std/tsunion.h"

#include <sstream>

Promise::Promise(std::unique_ptr<PromisePrivate> promisePrivate)
    : _d{std::move(promisePrivate)}
{
}

Promise::Promise(TSClosure* executor)
    : Object{TSTypeID::Promise}
    , _d{std::make_unique<PromisePrivate>()}
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Promise adress with: ", this);

    executor->setEnvironmentElement(this, 0);
    executor->setEnvironmentElement(this, 1);
    executor->call();
}

Promise::~Promise()
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Promise adress with: ", this);
}

Promise* Promise::then(Union* onFulfilled, Union* onRejected)
{
    LOG_METHOD_CALL;
    auto next = std::make_unique<PromisePrivate>(_d->then(onFulfilled->getValue(), onRejected->getValue()));
    return new Promise{std::move(next)};
}

Promise* Promise::fail(Union* onRejected)
{
    LOG_METHOD_CALL;
    auto next = std::make_unique<PromisePrivate>(_d->fail(onRejected->getValue()));
    return new Promise{std::move(next)};
}

Promise* Promise::finally(Union* onFinally)
{
    LOG_METHOD_CALL;
    auto next = std::make_unique<PromisePrivate>(_d->finally(onFinally->getValue()));
    return new Promise{std::move(next)};
}

void Promise::resolve(Object* resolved)
{
    LOG_METHOD_CALL;
    _d->resolve(resolved);
}

void Promise::reject(Object* rejected)
{
    LOG_METHOD_CALL;
    _d->reject(rejected);
}

String* Promise::toString() const
{
    std::stringstream ss;
    ss << this;
    return new String{"Promise Object with addres: " + ss.str()};
}

Boolean* Promise::toBool() const
{
    return new Boolean{_d->ready()};
}

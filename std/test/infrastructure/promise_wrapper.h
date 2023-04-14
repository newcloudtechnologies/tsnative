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

#pragma once

#include "../infrastructure/object_wrappers.h"
#include "std/make_closure_from_lambda.h"
#include "std/private/promise/promise_p.h"

namespace test
{

class PromiseWrapper
{
protected:
    PromiseWrapper(PromisePrivate promisePrivate, IExecutor& executor);

public:
    PromiseWrapper(IExecutor& executor);

    template <typename F1, typename F2>
    PromiseWrapper then(F1&& onFulfilled, F2&& onRejected)
    {
        auto* onFulfilledClosure = makeClosure<Closure>(std::move(onFulfilled));
        auto* onRejectedClosure = makeClosure<Closure>(std::move(onRejected));

        return PromiseWrapper{_promisePrivate.then(onFulfilledClosure, onRejectedClosure, _executor), _executor};
    }

    template <typename F>
    PromiseWrapper then(F&& onFulfilled)
    {
        auto* onFulfilledClosure = makeClosure<Closure>(std::move(onFulfilled));

        return PromiseWrapper{_promisePrivate.then(onFulfilledClosure, test::Undefined::instance(), _executor),
                              _executor};
    }

    PromiseWrapper then();

    template <typename F>
    PromiseWrapper fail(F&& onRejected)
    {
        auto* catchClosure = makeClosure<Closure>(std::move(onRejected));

        return PromiseWrapper{_promisePrivate.then(test::Undefined::instance(), catchClosure, _executor), _executor};
    }

    PromiseWrapper fail();

    template <typename F>
    PromiseWrapper finally(F&& onFinally)
    {
        auto* onFinallyClosure = makeClosure<Closure>(std::move(onFinally));

        return PromiseWrapper{_promisePrivate.then(onFinallyClosure, onFinallyClosure, _executor), _executor};
    }

    PromiseWrapper finally();

    template <typename T>
    void resolve(T resolved)
    {
        static_assert(std::is_pointer<T>::value, "Expect T is pointer");
        _promisePrivate.resolve(resolved);
    }

    template <typename T>
    void reject(T rejected)
    {
        static_assert(std::is_pointer<T>::value, "Expect T is pointer");
        _promisePrivate.reject(rejected);
    }

    bool ready() const;

    bool isFulfilled() const;

    bool isRejected() const;

private:
    PromisePrivate _promisePrivate;
    IExecutor& _executor;
};

} // namespace test
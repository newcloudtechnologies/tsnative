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

#include "promise_wrapper.h"

namespace test
{

PromiseWrapper::PromiseWrapper(PromisePrivate promisePrivate, IExecutor& executor)
    : _promisePrivate{promisePrivate}
    , _executor{executor}
{
}

PromiseWrapper::PromiseWrapper(IExecutor& executor)
    : PromiseWrapper(PromisePrivate{}, executor)
{
}

PromiseWrapper PromiseWrapper::then()
{
    return PromiseWrapper{_promisePrivate.then(Undefined::instance(), Undefined::instance(), _executor), _executor};
}

PromiseWrapper PromiseWrapper::fail()
{
    return then();
}

PromiseWrapper PromiseWrapper::finally()
{
    return PromiseWrapper{_promisePrivate.then(test::Undefined::instance(), test::Undefined::instance(), _executor),
                          _executor};
}

bool PromiseWrapper::ready() const
{
    return _promisePrivate.ready();
}

bool PromiseWrapper::isFulfilled() const
{
    return _promisePrivate.isFulfilled();
}

bool PromiseWrapper::isRejected() const
{
    return _promisePrivate.isRejected();
}

} // namespace test
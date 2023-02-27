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

Promise::Promise(PromisePrivate promisePrivate, IExecutor& executor)
    : _promisePrivate{promisePrivate}
    , _executor{executor}
{
}

Promise::Promise(IExecutor& executor)
    : Promise(PromisePrivate{}, executor)
{
}

Promise Promise::then()
{
    return Promise{_promisePrivate.then(Undefined::instance(), Undefined::instance(), _executor), _executor};
}

Promise Promise::fail()
{
    return then();
}

Promise Promise::finally()
{
    return Promise{_promisePrivate.then(test::Undefined::instance(), test::Undefined::instance(), _executor),
                   _executor};
}

bool Promise::ready() const
{
    return _promisePrivate.ready();
}

bool Promise::isFulfilled() const
{
    return _promisePrivate.isFulfilled();
}

bool Promise::isRejected() const
{
    return _promisePrivate.isRejected();
}

} // namespace test
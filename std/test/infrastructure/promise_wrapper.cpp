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
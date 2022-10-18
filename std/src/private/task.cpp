#include "std/private/task.h"
#include "std/event_loop.h"
#include "std/runtime.h"
#include "std/tsclosure.h"
#include "std/tsobject.h"
#include "std/tsstring.h"
#include "std/tsundefined.h"

#include <cassert>

Task::Task(Object* onFulfilled, Object* onRejected, PromisePrivate nextPromise)
    : _onFulfilled{onFulfilled}
    , _onRejected{onRejected}
    , _nextPromise{nextPromise}
{
    using Result = InternalState::Result;
    if (!has<SuccessEvent>())
    {
        on<SuccessEvent>(
            [this](SuccessEvent& successEvent, auto&)
            {
                Runtime::getLoop()->enqueue([self = shared_from_this(), data = successEvent.data]()
                                            { self->invoke(self->_onFulfilled, Result::makeValue(data)); });
            });
    }
    if (!has<ErrorEvent>())
    {
        on<ErrorEvent>(
            [this](ErrorEvent& errorEvent, auto&)
            {
                Runtime::getLoop()->enqueue([self = shared_from_this(), data = errorEvent.data]()
                                            { self->invoke(self->_onRejected, Result::makeError(data)); });
            });
    }
}

void Task::invoke(Object* object, InternalState::Result&& arg) noexcept
{
    assert(object && "Invalid object");

    using Result = InternalState::Result;

    if (object->isClosure())
    {
        auto* closure = dynamic_cast<TSClosure*>(object);
        return callClosure(closure, std::move(arg));
    }
    return transferResult(std::move(arg));
}

void Task::callClosure(TSClosure* closure, InternalState::Result&& arg) noexcept
{
    try
    {
        if (closure->getNumArgs()->unboxed())
        {
            closure->setEnvironmentElement(arg ? arg.get() : arg.error(), 0);
            auto* res = reinterpret_cast<Object*>(closure->call());
            _nextPromise.resolve(res);
        }
        else
        {
            closure->call();
            transferResult(std::move(arg));
        }
    }
    catch (void* e)
    {
        auto* reason = reinterpret_cast<Object*>(e);
        _nextPromise.reject(reason);
    }
    catch (...)
    {
        _nextPromise.reject(Undefined::instance());
    }
}

void Task::transferResult(InternalState::Result&& arg) noexcept
{
    if (arg)
    {
        _nextPromise.resolve(arg.get());
    }
    else
    {
        _nextPromise.reject(arg.error());
    }
}

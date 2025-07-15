#pragma once

#include "promise_p.h"
#include "std/private/emitter.h"
#include "std/private/promise/expected.h"

class Object;
class TSClosure;

struct SuccessEvent final
{
    Object* data;
};

struct ErrorEvent final
{
    Object* data;
};

using Result = Expected<Object*, Object*>;

class PromiseCallback final : public EmitterBase<PromiseCallback, SuccessEvent, ErrorEvent>
{
public:
    PromiseCallback(Object* onFulfilled, Object* onRejected, PromisePrivate nextPromise);

private:
    void invoke(Object* object, Result&& arg) noexcept;

    void callClosure(TSClosure* closure, Result&& arg) noexcept;

    void transferResult(Result&& arg) noexcept;

private:
    Object* _onFulfilled{nullptr};
    Object* _onRejected{nullptr};
    PromisePrivate _nextPromise;
};

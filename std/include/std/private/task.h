#pragma once

#include "std/private/emitter.h"
#include "std/private/internal_state.h"
#include "std/private/promise.h"

class Object;
class TSClosure;

struct SuccessEvent
{
    Object* data;
};

struct ErrorEvent
{
    Object* data;
};

class Task : public EmitterBase<Task, SuccessEvent, ErrorEvent>, public std::enable_shared_from_this<Task>
{
public:
    Task(Object* onFulfilled,
                  Object* onRejected,
                  Promise nextPromise);

private:
    void invoke(Object* object, InternalState::Result && arg);

    void callClosure(TSClosure * closure, InternalState::Result && arg);

    void transferResult(InternalState::Result && arg);

private:
    Object* _onFulfilled{nullptr};
    Object* _onRejected{nullptr};
    Promise _nextPromise;
};


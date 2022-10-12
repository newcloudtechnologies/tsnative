#pragma once

#include "std/private/emitter.h"
#include "std/private/expected.h"
#include "std/private/promise_state.h"
#include "std/tsobject.h"


struct ReadyEvent
{
};

class Promise;

class InternalState : public EmitterBase<InternalState, ReadyEvent>
{
public:
    using States = PromiseState::States;
    using Result = Expected<Object*, Object*>;
    using MayBeResult = absl::optional<Result>;

    void attach(Promise next, Object* onResolved, Object* onRejected);

    bool resolve(Result&& resolved);

    bool reject(Result&& resolved);

    bool ready() const;

    bool isFulfilled() const;

    bool isRejected() const;

public:
    PromiseState _state;
    MayBeResult _result{};
};

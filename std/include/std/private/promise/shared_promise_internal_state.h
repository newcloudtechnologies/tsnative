#pragma once

#include "promise_state.h"
#include "std/private/emitter.h"
#include "std/private/promise/promise_callback.h"

class PromisePrivate;
class Object;
class IExecutor;

class SharedPromiseInternalState final : public PromiseEmitter<SharedPromiseInternalState>,
                                         public std::enable_shared_from_this<SharedPromiseInternalState>
{
public:
    using States = PromiseState::States;

    void attach(PromisePrivate next, Object* onFulfilled, Object* onRejected, IExecutor& executor);

    bool resolve(Result&& resolved);

    bool reject(Result&& resolved);

    bool ready() const;

    bool isFulfilled() const;

    bool isRejected() const;

    Object* getResult() const;

private:
    PromiseState _state{};
    absl::optional<Result> _result{};
};

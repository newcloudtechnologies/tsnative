#include "std/private/internal_state.h"
#include "std/private/task.h"

void InternalState::attach(Promise next, Object* onResolved, Object* onRejected)
{
    auto task = std::make_shared<Task>(onResolved, onRejected, std::move(next));

    on<ReadyEvent>(
        [task = std::move(task)](auto&, InternalState& internalState)
        {
            if (internalState.isFulfilled())
            {
                task->emit(SuccessEvent{internalState._result.value().get()});
            }
            else if (internalState.isRejected())
            {
                task->emit(ErrorEvent{internalState._result.value().error()});
            }
        });

    if (ready()) {
        emit(ReadyEvent{});
    }
}

bool InternalState::resolve(InternalState::Result&& resolved)
{
    if (!ready())
    {
        _state.dispatch(FulfilledEvent{});
        _result = std::move(resolved);
        emit(ReadyEvent{});
        return true;
    }
    return false;
}

bool InternalState::reject(InternalState::Result&& rejected)
{
    if (!ready())
    {
        _state.dispatch(RejectedEvent{});
        _result = std::move(rejected);
        emit(ReadyEvent{});
        return true;
    }
    return false;
}

bool InternalState::ready() const
{
    return isFulfilled() || isRejected();
}

bool InternalState::isFulfilled() const
{
    return static_cast<size_t>(States::Fulfilled) == _state.index();
}

bool InternalState::isRejected() const
{
    return static_cast<size_t>(States::Rejected) == _state.index();
}

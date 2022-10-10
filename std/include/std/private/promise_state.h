
#pragma once

#include "fsm.h"

struct RejectedState
{
};

struct PendingState
{

};

struct FulfilledState
{
};

struct RejectedEvent
{
};

struct FulfilledEvent
{
};

class PromiseState : public Fsm<PromiseState, PendingState, FulfilledState, RejectedState>
{
public:

    enum class States {
        Pending = 0,
        Fulfilled,
        Rejected
    };

    template <typename S, typename E>
    auto on(const S&, const E&)
    {
        return absl::nullopt;
    }

    PromiseState::State on(const PendingState&, const FulfilledEvent&)
    {
        return FulfilledState{};
    }

    PromiseState::State on(const PendingState&, const RejectedEvent&)
    {
        return RejectedState{};
    }
};

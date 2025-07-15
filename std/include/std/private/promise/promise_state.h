#pragma once

#include "std/private/promise/general_finite_state_machine.h"

struct RejectedState final
{
};

struct PendingState final
{
};

struct FulfilledState final
{
};

struct RejectedEvent final
{
};

struct FulfilledEvent final
{
};

class PromiseState final : public GeneralFiniteStateMachine<PromiseState, PendingState, FulfilledState, RejectedState>
{
public:
    enum class States
    {
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

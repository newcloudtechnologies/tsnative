#pragma once

#include "absl/utility/utility.h"
#include <absl/types/optional.h>
#include <absl/types/variant.h>

#include "std/private/algorithms.h"
#include <utility>

template <typename T, typename... TStates>
class GeneralFiniteStateMachine : public absl::variant<TStates...>
{
public:
    using State = absl::variant<TStates...>;

public:
    using State::operator=;
    constexpr GeneralFiniteStateMachine()
    {
        static_assert(std::is_base_of<GeneralFiniteStateMachine, T>::value, "Type T should be type Fsm");
        utils::forEachInTuple(
            std::tuple<TStates...>{},
            [](auto state) { static_assert(std::is_empty<decltype(state)>::value, "Expected only empty FSM states"); });
    }

    template <typename Event>
    constexpr void dispatch(Event&& event)
    {
        T& self = static_cast<T&>(*this);
        auto result =
            absl::visit([&self, event = std::forward<Event>(event)](const auto& state) mutable -> absl::optional<State>
                        { return self.on(state, std::forward<Event>(event)); },
                        static_cast<const State&>(*this));
        if (result)
        {
            *this = std::move(*result);
        }
    }

    template <typename U>
    constexpr bool hasCurrentState() const noexcept
    {
        return absl::get_if<U>(this) != nullptr;
    }
};
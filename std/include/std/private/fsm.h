#pragma once

#include "absl/utility/utility.h"
#include <absl/types/optional.h>
#include <absl/types/variant.h>

#include "algorithms.h"
#include <utility>

template <typename T, typename... TStates>
class Fsm : public absl::variant<TStates...>
{
public:
    using State = absl::variant<TStates...>;

public:
    using State::operator=;
    constexpr Fsm()
    {
        static_assert(std::is_base_of<Fsm, T>::value, "Type T should be type Fsm");
        forEachInTuple(std::tuple<TStates...>{},
                       [](auto state)
                       { static_assert(std::is_empty<decltype(state)>::value, "Expected only empty FSM states"); });
    }

    template <typename Event>
    constexpr void dispatch(Event&& event)
    {
        T& self = static_cast<T&>(*this);
        auto result = absl::visit([&](const auto& state) -> absl::optional<State>
                                  { return self.on(state, std::forward<Event>(event)); },
                                  static_cast<const State&>(*this));
        if (result)
        {
            *this = std::move(*result);
        }
    }
};


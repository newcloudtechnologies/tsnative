#pragma once

#include <tuple>

namespace details
{
template <class Tuple, std::size_t I, class = void>
struct DoForEachInTuple
{
    template <class UnaryFunction>
    static void apply(Tuple&& tp, UnaryFunction& f)
    {
        f(std::get<I>(std::forward<Tuple>(tp)));
        DoForEachInTuple<Tuple, I + 1u>::apply(std::forward<Tuple>(tp), f);
    }
};

template <class Tuple, std::size_t I>
struct DoForEachInTuple<Tuple,
                              I,
                              typename std::enable_if_t<I == std::tuple_size<typename std::decay_t<Tuple>>::value>>
{
    template <class UnaryFunction>
    static void apply(Tuple&&, UnaryFunction&)
    {
    }
};
} // namespace details

template <class Tuple, class UnaryFunction>
void forEachInTuple(Tuple&& tp, UnaryFunction f)
{
    details::DoForEachInTuple<Tuple, 0u>::apply(std::forward<Tuple>(tp), f);
}
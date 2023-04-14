/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include "std/private/algorithms.h"
#include "std/tsnumber.h"
#include "std/tsundefined.h"

#include <cstdlib>
#include <functional>
#include <type_traits>
#include <utility>

namespace details
{
template <std::size_t... Indexes>
constexpr auto makeTupleFromEnvironment(void*** environment, std::index_sequence<Indexes...>)
{
    return std::make_tuple(environment[Indexes]...);
}

template <std::size_t size>
constexpr auto makeTupleFromEnvironment(void*** environment)
{
    return makeTupleFromEnvironment(environment, std::make_index_sequence<size>{});
}

template <typename TupleTypeTo, typename Tuple, std::size_t... Indexes>
auto castToTypedTuple(Tuple& tuple, std::index_sequence<Indexes...>)
{
    return std::make_tuple(
        reinterpret_cast<typename std::tuple_element<Indexes, TupleTypeTo>::type>(std::get<Indexes>(tuple))...);
}

template <typename TupleTypeTo, typename Tuple, std::size_t size = std::tuple_size<Tuple>{}>
auto castToTypedTuple(Tuple& tuple)
{
    static_assert(std::tuple_size<TupleTypeTo>::value == size, "The same tuple sizes are expected");
    return castToTypedTuple<TupleTypeTo>(tuple, std::make_index_sequence<size>{});
}

template <class Lambda>
struct LambdaTraits : public LambdaTraits<decltype(&Lambda::operator())>
{
};

template <class ClassType, class R, class... Args>
struct LambdaTraits<R (ClassType::*)(Args...) const>
{
    using ReturnType = R;
    using ArgTypes = std::tuple<Args...>;
    constexpr static std::size_t argsCount = std::tuple_size<ArgTypes>{};
};

} // namespace details

template <typename Closure = TSClosure, typename Func>
typename std::enable_if_t<details::LambdaTraits<Func>::argsCount == 0, Closure*> makeClosure(Func&& fn)
{
    auto f = [fn = std::forward<Func>(fn)](void*** env) -> void* { return fn(); };

    void*** env = (void***)malloc(sizeof(void**)); // just to feed something to TSClosure::free
    std::uint32_t envLength = 0;
    std::uint32_t numArgs = 0;

    return new Closure{std::move(f), env, envLength, numArgs};
}

template <typename Closure = TSClosure,
          typename Func,
          typename TupleArgsType = typename details::LambdaTraits<Func>::ArgTypes,
          std::size_t argsCount = details::LambdaTraits<Func>::argsCount>
typename std::enable_if_t<details::LambdaTraits<Func>::argsCount != 0, Closure*> makeClosure(Func&& fn)
{
    auto f = [fn = std::forward<Func>(fn)](void*** env) -> void*
    {
        auto tupleEnv = details::makeTupleFromEnvironment<argsCount>(env);
        auto target = details::castToTypedTuple<TupleArgsType>(tupleEnv);
        return utils::apply(std::move(fn), std::move(target));
    };
    void*** env = (void***)malloc(argsCount * sizeof(void**));
    for (std::size_t i = 0; i < argsCount; ++i)
    {
        env[i] = (void**)malloc(sizeof(void**));
        *(env[i]) = Undefined::instance();
    }
    std::uint32_t envLength = argsCount;
    std::uint32_t numArgs = argsCount;

    return new Closure{std::move(f), env, envLength, numArgs};
}
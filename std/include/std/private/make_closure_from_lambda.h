/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include "std/private/lambda_to_function_ptr.h"
#include "std/tsnumber.h"

#include <cassert>
#include <cstdlib>
#include <functional>
#include <type_traits>
#include <utility>

namespace details
{
template <std::size_t size, std::size_t... Is>
constexpr auto makeTupleFromEnvironment(void** environment, std::index_sequence<Is...>)
{
    return std::make_tuple(environment[Is]...);
}

template <std::size_t size>
constexpr auto makeTupleFromEnvironment(void** array)
{
    return makeTupleFromEnvironment<size>(array, std::make_index_sequence<size>{});
}

template <typename TupleTypeTo, typename Tuple, std::size_t... Is>
auto createFromTuple(Tuple& tuple, std::index_sequence<Is...>)
{
    return std::make_tuple(static_cast<typename std::tuple_element<Is..., TupleTypeTo>::type>(std::get<Is...>(tuple)));
}

template <typename TupleTypeTo, typename Tuple, std::size_t size = std::tuple_size<TupleTypeTo>{}>
auto createFromTuple(Tuple& tuple)
{
    return createFromTuple<TupleTypeTo>(tuple, std::make_index_sequence<size>{});
}

template <typename F, typename Tuple, size_t... Is>
auto apply(F&& f, Tuple&& args, std::index_sequence<Is...>)
{
    return std::forward<F>(f)(std::get<Is>(std::forward<Tuple>(args))...);
}

template <typename F,
          typename Tuple,
          typename Is = std::make_index_sequence<std::tuple_size<std::remove_reference_t<Tuple>>::value>>
auto apply(F&& f, Tuple&& tuple)
{
    return apply(std::forward<F>(f), std::forward<Tuple>(tuple), Is{});
}

} // namespace details

template <typename Closure, typename Func>
typename std::enable_if_t<FunctionPtr<Func>::argsCount == 0, Closure*> makeClosure(Func&& fn)
{
    auto f = [fn = std::move(fn)](void** env) -> void* { return fn(); };

    auto functionPtr = toFunctionPtr(std::move(f));
    void** env = (void**)std::malloc(sizeof(void*)); // TODO Consider deleting memory
    auto* envLength = new Number{0.f};
    auto* numArgs = new Number{0.f};
    auto* opt = new Number{0.f};

    auto* closure = new Closure{(void*)functionPtr, env, envLength, numArgs, opt};

    return closure;
}

template <typename Closure,
          typename Func,
          typename TupleArgsType = typename FunctionPtr<Func>::ArgTypes,
          std::size_t argsCount = FunctionPtr<Func>::argsCount>
typename std::enable_if_t<FunctionPtr<Func>::argsCount != 0, Closure*> makeClosure(Func&& fn)
{
    auto f = [fn = std::move(fn)](void** env) -> void*
    {
        auto tupleEnvironments = details::makeTupleFromEnvironment<argsCount>(env);
        auto target = details::createFromTuple<TupleArgsType>(tupleEnvironments);
        return details::apply(std::move(fn), target);
    };

    auto functionPtr = toFunctionPtr(std::move(f));
    void** env = (void**)std::malloc(argsCount * sizeof(void*)); // TODO Consider deleting memory
    for (std::size_t i = 0; i < argsCount; ++i)
    {
        env[i] = (void*)std::malloc(sizeof(void*));
    }
    auto* envLength = new Number{(double)argsCount};
    auto* numArgs = new Number{(double)argsCount};
    auto* opt = new Number{0.f};

    auto* closure = new Closure{(void*)functionPtr, env, envLength, numArgs, opt};

    return closure;
}
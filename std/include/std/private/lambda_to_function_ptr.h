#pragma once

#include <functional>
#include <type_traits>
#include <utility>

template <class Lambda, class R, class... Args>
static auto construct(Lambda&& lambda)
{
    static_assert(!std::is_same<Lambda, std::function<R(Args...)>>::value, "Only lambdas are supported");
    const static Lambda capture = std::move(lambda);
    return +[](Args... args) -> R { return capture(args...); };
}

template <class Lambda>
struct FunctionPtr : public FunctionPtr<decltype(&Lambda::operator())>
{
};

template <class ClassType, class R, class... Args>
struct FunctionPtr<R (ClassType::*)(Args...) const>
{
    using ReturnType = R;
    using ArgTypes = std::tuple<Args...>;
    constexpr static std::size_t argsCount = std::tuple_size<ArgTypes>{};

    template <typename Lambda>
    static auto impl(Lambda&& lambda)
    {
        return construct<Lambda, R, Args...>(std::move(lambda));
    }
};

template <class ClassType, class R, class... Args>
struct FunctionPtr<R (ClassType::*)(Args...)>
{
    using ReturnType = R;
    using ArgTypes = std::tuple<Args...>;
    constexpr static std::size_t argsCount = std::tuple_size<ArgTypes>{};

    template <class Lambda>
    static auto impl(Lambda&& lambda)
    {
        return construct<Lambda, R, Args...>(std::move(lambda));
    }
};

template <class Lambda>
auto toFunctionPtr(Lambda&& lambda)
{
    return FunctionPtr<Lambda>::impl(std::forward<Lambda>(lambda));
}
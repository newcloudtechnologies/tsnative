#pragma once

#include <tuple>
#include <utility>

namespace
{
template <typename T>
struct traits : public traits<decltype(&T::operator())>
{
};

template <typename T, typename R, typename... Args>
struct traits<R (T::*)(Args...) const>
// we specialize for pointers to member function
{
    using return_type = R;
    using arg_tuple = std::tuple<Args...>;
    static constexpr auto arity = sizeof...(Args);
};

template <typename T>
struct signature
{
    using type = T;
};

template <class F, std::size_t... Is, class T>
auto mk_signature_impl(F, std::index_sequence<Is...>, T)
{
    using signature_t = typename T::return_type(std::tuple_element_t<Is, typename T::arg_tuple>...);

    return signature<signature_t>{};
}

template <class F>
auto mk_signature(F f)
{
    using traits = traits<F>;
    return mk_signature_impl(f, std::make_index_sequence<traits::arity>{}, traits{});
}

} // namespace

namespace utils
{
/*
Example:

template <typename Callable>
void addHandler(Callable handler)
{
    using signature_t = typename utils::lambda_traits<Callable>::signature_t;
    using return_type_t = typename utils::lambda_traits<Callable>::return_type_t;

    std::function<signature_t> fnc = createHandler;
    ...
    fnc(...args...);
    ...
}

...

addHandler(
    [](int n, std::string s)
    {
        return s;
    });

*/
template <typename T>
class lambda_traits
{
    static T _;

public:
    using return_type_t = typename traits<T>::return_type;
    using signature_t = typename decltype(mk_signature(_))::type;
};

} // namespace utils
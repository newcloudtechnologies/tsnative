#pragma once

#include <tuple>

#include "std/private/tstuple_p.h"
#include "std/private/tstuple_std_utility_p.h"

template <typename... Ts>
class TupleStdPrivate : public TuplePrivate<Ts...>
{
public:
    TupleStdPrivate(Ts... initializers);
    ~TupleStdPrivate();

    int length() const override;
    void* operator[](int index) override;

    template <typename... Us>
    friend std::ostream& operator<<(std::ostream& os, const TuplePrivate<Us...>* tuple);

private:
    std::tuple<Ts...>* _tuple = nullptr;
};

template <typename... Ts>
TupleStdPrivate<Ts...>::TupleStdPrivate(Ts... initializers)
    : _tuple{new std::tuple<Ts...>{initializers...}}
{
}

template <typename... Ts>
TupleStdPrivate<Ts...>::~TupleStdPrivate()
{
    // @todo: untrack?
    delete _tuple;
}

template <typename... Ts>
int TupleStdPrivate<Ts...>::length() const
{
    return static_cast<int>(sizeof...(Ts));
}

template <typename... Ts>
void* TupleStdPrivate<Ts...>::operator[](int index)
{
    return typeless_tuple_element<sizeof...(Ts), typename std::remove_pointer<decltype(_tuple)>::type>::get(
        *_tuple, static_cast<size_t>(index));
}

template <typename... Ts>
inline std::ostream& operator<<(std::ostream& os, const TupleStdPrivate<Ts...>* tuple)
{
    os << std::boolalpha;
    os << "[ ";

    tuple_printer<std::tuple<Ts...>, 0, sizeof...(Ts) - 1>::print(os, *(tuple->_tuple));

    os << " ]";
    return os;
}

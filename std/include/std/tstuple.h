#pragma once

#include "std/private/options.h"

#include "std/gc.h"

#ifdef USE_TUPLE_STD_BACKEND
#include "std/private/tstuple_std_p.h"
#endif

#include <iostream>

template <typename... Ts>
class Tuple
{
public:
    Tuple(Ts... initializers);

    Number* length() const;
    void* operator[](Number* index);

    template <typename... Us>
    friend std::ostream& operator<<(std::ostream& os, Tuple<Us...>* tuple);

private:
    TuplePrivate<Ts...>* _d = nullptr;
};

template <typename... Ts>
Tuple<Ts...>::Tuple(Ts... initializers)
#ifdef USE_TUPLE_STD_BACKEND
    : _d(new TupleStdPrivate<Ts...>(initializers...))
#endif
{
}

template <typename... Ts>
Number* Tuple<Ts...>::length() const
{
    int length = _d->length();
    return GC::track(new Number(static_cast<double>(length)));
}

template <typename... Ts>
void* Tuple<Ts...>::operator[](Number* index)
{
    return _d->operator[](static_cast<int>(index->unboxed()));
}

template <typename... Ts>
inline std::ostream& operator<<(std::ostream& os, Tuple<Ts...>* tuple)
{
    os << tuple->_d;
    return os;
}

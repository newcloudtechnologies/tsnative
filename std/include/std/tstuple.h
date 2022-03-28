#pragma once

#include "std/private/options.h"

#include "std/gc.h"
#include "std/tsobject.h"
#include "std/tsstring.h"

#ifdef USE_TUPLE_STD_BACKEND
#include "std/private/tstuple_std_p.h"
#endif

#include <iostream>
#include <sstream>

template <typename... Ts>
class Tuple : public Object
{
public:
    Tuple(Ts... initializers);
    ~Tuple() override;

    Number* length() const;
    void* operator[](Number* index);
    void* operator[](int index);

    String* toString() const override;

    template <typename... Us>
    friend std::ostream& operator<<(std::ostream& os, const Tuple<Us...>* tuple);

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
Tuple<Ts...>::~Tuple()
{
    // @todo: untrack?
    delete _d;
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
    return operator[](static_cast<int>(index->unboxed()));
}

template <typename... Ts>
void* Tuple<Ts...>::operator[](int index)
{
    return _d->operator[](index);
}

template <typename... Ts>
String* Tuple<Ts...>::toString() const
{
    std::ostringstream oss;
    oss << this;
    return GC::track(new String(oss.str()));
}

template <typename... Ts>
inline std::ostream& operator<<(std::ostream& os, const Tuple<Ts...>* tuple)
{
    os << tuple->_d;
    return os;
}

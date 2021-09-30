#pragma once

#include <cassert>
#include <tuple>

#include "gc.h"
#include <iostream>
template <size_t I, typename Tuple>
struct typeless_tuple_element
{
    using ValueType = typename std::tuple_element<I - 1, Tuple>::type;

    template <typename T = ValueType>
    static typename std::enable_if<std::is_pointer<T>::value, void*>::type get(Tuple& tuple, size_t index)
    {
        if (index == I - 1)
        {
            auto value = std::get<I - 1>(tuple);
            return reinterpret_cast<void*>(value);
        }

        return typeless_tuple_element<I - 1, Tuple>::get(tuple, index);
    }

    template <typename T = ValueType>
    static typename std::enable_if<!std::is_pointer<T>::value, void*>::type get(Tuple& tuple, size_t index)
    {
        if (index == I - 1)
        {
            auto value = std::get<I - 1>(tuple);
            return reinterpret_cast<void*>(GC::createHeapAllocated<ValueType>(value));
        }

        return typeless_tuple_element<I - 1, Tuple>::get(tuple, index);
    }
};

template <typename Tuple>
struct typeless_tuple_element<0, Tuple>
{
    static void* get(Tuple&, size_t)
    {
        assert(false);
        return nullptr;
    }
};

template <typename... Ts>
class Tuple
{
public:
    Tuple(Ts... initializers);

    double length() const;
    void* operator[](double index);

private:
    std::tuple<Ts...>* _tuple = nullptr;
};

template <typename... Ts>
Tuple<Ts...>::Tuple(Ts... initializers)
    : _tuple{new std::tuple<Ts...>{initializers...}}
{
}

template <typename... Ts>
double Tuple<Ts...>::length() const
{
    return static_cast<double>(sizeof...(Ts));
}

template <typename... Ts>
void* Tuple<Ts...>::operator[](double index)
{
    return typeless_tuple_element<sizeof...(Ts), typename std::remove_pointer<decltype(_tuple)>::type>::get(
        *_tuple, static_cast<size_t>(index));
}

#pragma once

#include <cassert>
#include <tuple>

#include "gc.h"

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
    Tuple() = default;
    Tuple(Ts... initializers);

    Number* length() const;
    void* operator[](Number* index);

    template <typename... Us>
    friend std::ostream& operator<<(std::ostream& os, Tuple<Us...>* tuple);

private:
    std::tuple<Ts...>* _tuple = nullptr;
};

template <typename... Ts>
Tuple<Ts...>::Tuple(Ts... initializers)
    : _tuple{new std::tuple<Ts...>{initializers...}}
{
}

template <typename... Ts>
Number* Tuple<Ts...>::length() const
{
    return GC::createHeapAllocated<Number>(sizeof...(Ts));
}

template <typename... Ts>
void* Tuple<Ts...>::operator[](Number* index)
{
    return typeless_tuple_element<sizeof...(Ts), typename std::remove_pointer<decltype(_tuple)>::type>::get(
        *_tuple, static_cast<size_t>(index->valueOf()));
}

template<typename Type, unsigned N, unsigned Last>
struct tuple_printer {

    static void print(std::ostream& out, const Type& value) {
        out << std::get<N>(value) << ", ";
        tuple_printer<Type, N + 1, Last>::print(out, value);
    }
};

template<typename Type, unsigned N>
struct tuple_printer<Type, N, N> {

    static void print(std::ostream& out, const Type& value) {
        out << std::get<N>(value);
    }

};

template <typename... Ts>
inline std::ostream& operator<<(std::ostream& os, Tuple<Ts...>* tuple)
{
    os << std::boolalpha;
    os << "[ ";

    tuple_printer<std::tuple<Ts...>, 0, sizeof...(Ts) - 1>::print(os, *(tuple->_tuple));

    os << " ]";
    return os;
}

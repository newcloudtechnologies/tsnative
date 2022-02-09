#pragma once

#include <cassert>
#include <tuple>

template <int I, typename Tuple>
struct typeless_tuple_element
{
    using ValueType = typename std::tuple_element<I - 1, Tuple>::type;

    static void* get(Tuple& tuple, int index)
    {
        if (index == I - 1)
        {
            auto value = std::get<I - 1>(tuple);
            return reinterpret_cast<void*>(value);
        }

        return typeless_tuple_element<I - 1, Tuple>::get(tuple, index);
    }
};

template <typename Tuple>
struct typeless_tuple_element<0, Tuple>
{
    static void* get(Tuple&, int)
    {
        assert(false);
        return nullptr;
    }
};

template <typename Type, unsigned N, unsigned Last>
struct tuple_printer
{

    static void print(std::ostream& out, const Type& value)
    {
        out << std::get<N>(value) << ", ";
        tuple_printer<Type, N + 1, Last>::print(out, value);
    }
};

template <typename Type, unsigned N>
struct tuple_printer<Type, N, N>
{

    static void print(std::ostream& out, const Type& value)
    {
        out << std::get<N>(value);
    }
};

#pragma once

#include <cstdint>
#include <type_traits>

#include "tsnumber.h"

template <typename T>
using remove_specifiers =
    typename std::remove_pointer<typename std::remove_reference<typename std::remove_cv<T>::type>::type>::type;

class GC
{
public:
    static void* allocate(TSNumber numBytes);

    template <typename Source>
    static Source track(Source value)
    {
        static_assert(std::is_pointer<Source>::value);
        // @todo: here we start tracking existing pointer
        return value;
    }

    template <typename Destination, typename Source>
    static Destination* createHeapAllocated(Source value)
    {
        static_assert((std::is_same<remove_specifiers<Source>, remove_specifiers<Destination>>::value ||
                       std::is_convertible<remove_specifiers<Source>, remove_specifiers<Destination>>::value) &&
                      std::is_constructible<Destination, Source>::value);

        void* mem = GC::allocate(sizeof(Destination));
        return new (mem) Destination(value);
    }
};

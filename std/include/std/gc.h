#pragma once

#include "private/options.h"

#include <TS.h>

#include "std/private/options.h"
#include "std/tsnumber.h"

#include <cstdint>
#include <type_traits>

class TS_EXPORT TS_DECLARE GC
{
public:
    TS_METHOD TS_SIGNATURE("allocate(numBytes: any): void") static void* allocate(double numBytes);

    template <typename Source>
    static Source track(Source value)
    {
        static_assert(std::is_pointer<Source>::value);
        // @todo: here we start tracking existing pointer
        return value;
    }

    template <typename Source>
    static Source untrack(Source value)
    {
        static_assert(std::is_pointer<Source>::value);
        // @todo: here we stop tracking existing pointer
        return value;
    }

    // mkrv @todo: better remove this method
    template <typename Destination, typename Source>
    static Destination* createHeapAllocated(Source value)
    {
        static_assert(std::is_constructible<Destination, Source>::value);

        return GC::track(new Destination(value));
    }
};

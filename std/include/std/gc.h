#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <cstdint>
#include <type_traits>
#include <memory>

class IGCImpl;
class Allocator;

class TS_EXPORT TS_DECLARE GC
{
public:
    GC(std::unique_ptr<IGCImpl> impl, std::unique_ptr<Allocator> allocator);

    // TODO Should be removed. Allocator should allocate, not GC
    TS_METHOD TS_SIGNATURE("allocate(numBytes: any): void") void* allocate(double numBytes);
    TS_METHOD TS_SIGNATURE("allocateObject(numBytes: any): void") void* allocateObject(double numBytes);
    TS_METHOD TS_SIGNATURE("deallocate(): void") void deallocate(void*);
    TS_METHOD void collect();

private:
    std::unique_ptr<IGCImpl> _impl;
    std::unique_ptr<Allocator> _allocator;

public:
    // Deprecated API
    template <typename Source>
    static Source track(Source value)
    {
        static_assert(std::is_pointer<Source>::value, "Value must be a pointer");
        // @todo: here we start tracking existing pointer
        return value;
    }

    // Deprecated API
    template <typename TsTypePtrT, typename SourceT>
    static TsTypePtrT track_as(SourceT value)
    {
        static_assert(std::is_pointer<TsTypePtrT>::value, "Return type must be a pointer");
        using TsTypeT = std::remove_pointer_t<TsTypePtrT>;
        static_assert(std::is_base_of<Object, TsTypeT>::value, "Return type must be Object derived");

        auto* ret = new TsTypeT(value);
        // @todo here we start tracking ret pointer
        return ret;
    }

    // Deprecated API
    template <typename Source>
    static Source untrack(Source value)
    {
        static_assert(std::is_pointer<Source>::value, "Value must be a pointer");
        // @todo: here we stop tracking existing pointer
        return value;
    }

    // Deprecated API
    // mkrv @todo: better remove this method
    template <typename Destination, typename Source>
    static Destination* createHeapAllocated(Source value)
    {
        static_assert(std::is_constructible<Destination, Source>::value, "DestinationT must be constructible from SourceT");

        return GC::track(new Destination(value));
    }
};

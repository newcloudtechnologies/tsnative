#include "std/gc.h"

#include "std/igc_impl.h"
#include "std/private/allocator.h"

GC::GC(std::unique_ptr<IGCImpl> impl, std::unique_ptr<Allocator> allocator)
    : _impl{std::move(impl)},
    _allocator{std::move(allocator)}
{
    if (!_impl)
    {
        throw std::runtime_error("GC cannot be nullptr");
    }

    if (!_allocator)
    {
        throw std::runtime_error("Allocator cannot be nullptr");
    }
}

void* GC::allocate(double numBytes)
{
    return _allocator->allocate(static_cast<std::size_t>(numBytes));
}

void GC::deallocate(void* m)
{
    _allocator->deallocate(m);
}

void* GC::allocateObject(double numBytes)
{
    return _allocator->allocateObject(static_cast<std::size_t>(numBytes));
}

void GC::collect()
{
    return _impl->collect();
}
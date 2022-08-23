#include "std/gc.h"

#include "std/igc_impl.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/allocator.h"
#include "std/private/logger.h"

GC::GC(IGCImpl* gcImpl, Allocator* allocator)
    : _gcImpl{gcImpl},
    _allocator{allocator}
{
    LOG_ADDRESS("Calling GC wrapper ctor ", this);

    if (!_gcImpl)
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
    if (!_allocator)
    {
        throw std::runtime_error("Allocator cannot be nullptr");
    }

    return _allocator->allocate(static_cast<std::size_t>(numBytes));
}

void GC::deallocate(void* m)
{
    if (!_allocator)
    {
        throw std::runtime_error("Allocator cannot be nullptr");
    }
    _allocator->deallocate(m);
}

void* GC::allocateObject(double numBytes)
{
    if (!_allocator)
    {
        throw std::runtime_error("Allocator cannot be nullptr");
    }

    return _allocator->allocateObject(static_cast<std::size_t>(numBytes));
}

void GC::collect()
{
    if (!_gcImpl)
    {
        throw std::runtime_error("GC cannot be nullptr");
    }

    return _gcImpl->collect();
}

void GC::addRoot(void* root)
{
    if (!_gcImpl)
    {
        throw std::runtime_error("GC cannot be nullptr");
    }

    _gcImpl->addRoot(static_cast<Object*>(root));
}

void GC::removeRoot(void* root)
{
    if (!_gcImpl)
    {
        throw std::runtime_error("GC cannot be nullptr");
    }
    
    _gcImpl->removeRoot(static_cast<Object*>(root));
}

String* GC::toString() const
{
    return new String("Global GC object");
}

Boolean* GC::toBool() const
{
    return new Boolean(_gcImpl && _allocator);
}
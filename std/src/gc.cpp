/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "std/gc.h"

#include "std/private/memory_management/igc_impl.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/logger.h"
#include "std/private/memory_management/memory_manager.h"

GC::GC(IGCImpl* gcImpl, MemoryManager* memManager)
    : _gcImpl{gcImpl}
    , _memManager{memManager}
{
    LOG_ADDRESS("Calling GC wrapper ctor ", this);

    if (!_gcImpl)
    {
        throw std::runtime_error("GC cannot be nullptr");
    }

    if (!_memManager)
    {
        throw std::runtime_error("Allocator cannot be nullptr");
    }
}

void* GC::allocate(double numBytes)
{
    if (!_memManager)
    {
        throw std::runtime_error("Allocator cannot be nullptr");
    }

    return _memManager->allocate(static_cast<std::size_t>(numBytes));
}

void* GC::allocateObject(double numBytes)
{
    if (!_memManager)
    {
        throw std::runtime_error("Allocator cannot be nullptr");
    }

    return _memManager->allocateMemoryForObject(static_cast<std::size_t>(numBytes));
}

void GC::collect()
{
    if (!_gcImpl)
    {
        throw std::runtime_error("GC cannot be nullptr");
    }

    return _gcImpl->collect();
}

void GC::addRoot(void** root, void* associatedName)
{
    LOG_METHOD_CALL
    if (!_gcImpl)
    {
        throw std::runtime_error("GCImpl cannot be nullptr");
    }

    _gcImpl->addRoot(Object::asObjectPtrPtr(root), static_cast<const Object*>(associatedName));
}

void GC::addRootWithName(Object** root, const char* name)
{
    LOG_METHOD_CALL
    if (!_gcImpl)
    {
        throw std::runtime_error("GCImpl cannot be nullptr");
    }

    _gcImpl->addRootWithName(root, name);
}

void GC::removeRoot(void** root)
{
    if (!_gcImpl)
    {
        throw std::runtime_error("GCImpl cannot be nullptr");
    }

    _gcImpl->removeRoot(Object::asObjectPtrPtr(root));
}

String* GC::toString() const
{
    return new String("Global GC object");
}

Boolean* GC::toBool() const
{
    return new Boolean(_gcImpl && _memManager);
}

void GC::saveMemoryGraph() const
{
    if (!_gcImpl)
    {
        throw std::runtime_error("GCImpl cannot be nullptr");
    }

    _gcImpl->print();
}
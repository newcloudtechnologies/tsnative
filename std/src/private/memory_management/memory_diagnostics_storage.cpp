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

#include "std/private/memory_management/memory_diagnostics_storage.h"

MemoryDiagnosticsStorage::Size MemoryDiagnosticsStorage::getDeletedObjectsCount() const
{
    return _deletedObjectsCount;
}

void MemoryDiagnosticsStorage::onDeleted(const void* el)
{
    ++_deletedObjectsCount;

    auto it = _allocatedObjectTable.find(el);
    if (it != _allocatedObjectTable.end())
    {
        _allocatedManagedMemory -= it->second;
        _allocatedObjectTable.erase(it);
    }
}

MemoryDiagnosticsStorage::Size MemoryDiagnosticsStorage::getCurrentAllocatedBytes() const
{
    return _allocatedManagedMemory;
}

void MemoryDiagnosticsStorage::onObjectAllocated(const void* el, Size size)
{
    _allocatedObjectTable[el] = size;
    _allocatedManagedMemory += size;
}
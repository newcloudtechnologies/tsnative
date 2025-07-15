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
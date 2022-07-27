#include "std/private/memory_diagnostics_storage.h"

std::size_t MemoryDiagnosticsStorage::getDeletedObjectsCount() const
{
    return _deletedObjectsCount;
}

void MemoryDiagnosticsStorage::onDeleted(const void*)
{
    ++_deletedObjectsCount;
}
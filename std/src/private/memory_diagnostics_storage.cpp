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

#include "std/private/memory_diagnostics_storage.h"

std::size_t MemoryDiagnosticsStorage::getDeletedObjectsCount() const
{
    return _deletedObjectsCount;
}

void MemoryDiagnosticsStorage::onDeleted(const void*)
{
    ++_deletedObjectsCount;
}
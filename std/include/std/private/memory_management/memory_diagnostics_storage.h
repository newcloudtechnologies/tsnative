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

#pragma once

#include <cstddef>
#include <cstdint>
#include <unordered_map>

class MemoryDiagnosticsStorage final
{
public:
    using Size = uint64_t;

    Size getDeletedObjectsCount() const;

    void onDeleted(const void* el);

    void onObjectAllocated(const void* el, Size size);

    Size getCurrentAllocatedBytes() const;

private:
    Size _deletedObjectsCount = 0u;
    Size _allocatedManagedMemory = 0;
    std::unordered_map<const void*, std::size_t> _allocatedObjectTable;
};

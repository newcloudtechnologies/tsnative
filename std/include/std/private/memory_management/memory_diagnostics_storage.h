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

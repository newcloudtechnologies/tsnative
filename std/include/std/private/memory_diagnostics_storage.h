#pragma once

#include <cstddef>

class Object;

class MemoryDiagnosticsStorage final
{
public:
    std::size_t getDeletedObjectsCount() const;

    void onDeleted(const void*);

private:
    std::size_t _deletedObjectsCount = 0u;
};

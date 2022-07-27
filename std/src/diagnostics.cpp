#include "std/diagnostics.h"

#include "std/memory_diagnostics.h"
#include "std/private/memory_diagnostics_storage.h"

Diagnostics::Diagnostics(std::unique_ptr<MemoryDiagnostics> memoryDiagnostics)
    : _memoryDiagnostics{std::move(memoryDiagnostics)}
{
    if (!_memoryDiagnostics)
    {
        throw std::runtime_error("Memory diagnostics was set to nullptr");
    }
}

MemoryDiagnostics* Diagnostics::getMemoryDiagnostics() const
{
    return _memoryDiagnostics.get();
}

String* Diagnostics::toString() const
{
    return _memoryDiagnostics->toString();
}

Boolean* Diagnostics::toBool() const
{
    return _memoryDiagnostics->toBool();
}
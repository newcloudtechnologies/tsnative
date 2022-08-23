#include "std/diagnostics.h"

#include "std/memory_diagnostics.h"
#include "std/private/memory_diagnostics_storage.h"

#include "std/private/logger.h"

Diagnostics::Diagnostics(const IGCImpl& gcImpl,
                         const MemoryDiagnosticsStorage& memoryDiagnosticsStorage)
    : _gcImpl{gcImpl},
    _memoryDiagnosticsStorage{std::move(memoryDiagnosticsStorage)}
{
    LOG_ADDRESS("Calling Diagnostics ctor ", this);
}

MemoryDiagnostics* Diagnostics::getMemoryDiagnostics() const
{
    return new MemoryDiagnostics(_memoryDiagnosticsStorage, _gcImpl);
}

String* Diagnostics::toString() const
{
    MemoryDiagnostics md{_memoryDiagnosticsStorage, _gcImpl};
    return md.toString();
}

Boolean* Diagnostics::toBool() const
{
    MemoryDiagnostics md{_memoryDiagnosticsStorage, _gcImpl};
    return md.toBool();
}
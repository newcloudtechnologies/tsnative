#include "std/memory_diagnostics.h"

#include "std/tsstring.h"
#include "std/tsnumber.h"

#include "std/igc_impl.h"
#include "std/private/memory_diagnostics_storage.h"

#include "std/private/logger.h"

MemoryDiagnostics::MemoryDiagnostics(const MemoryDiagnosticsStorage& storage, const IGCImpl& gc)
    : _storage{storage},
    _gc{gc}
{
    LOG_ADDRESS("Calling mem diagnostics ctor this = ", this);
}

Number* MemoryDiagnostics::getAliveObjectsCount() const
{
    const auto objectsCount = _gc.getAliveObjectsCount();
    return new Number{static_cast<double>(objectsCount)};
}

Number* MemoryDiagnostics::getDeletedObjectsCount() const
{
    return new Number(static_cast<double>(_storage.getDeletedObjectsCount()));
}

String* MemoryDiagnostics::toString() const
{
    const auto objCount = _gc.getAliveObjectsCount();

    const auto header = new String("Memory diagnostics:\n");

    const auto objectsStr = std::string{"Allocated objects = "} + std::to_string(objCount) + "\n";
    const auto objects = new String(objectsStr);
    return header->concat(objects);
}

Boolean* MemoryDiagnostics::toBool() const
{
    return new Boolean(getAliveObjectsCount()->unboxed() != 0);
}
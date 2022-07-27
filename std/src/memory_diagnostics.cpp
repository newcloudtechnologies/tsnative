#include "std/memory_diagnostics.h"

#include "std/tsstring.h"
#include "std/tsnumber.h"

#include "std/igc_impl.h"
#include "std/private/memory_diagnostics_storage.h"

MemoryDiagnostics::MemoryDiagnostics(std::unique_ptr<MemoryDiagnosticsStorage> storage, const IGCImpl& gc)
    : _storage{std::move(storage)},
    _gc{gc}
{
}

Number* MemoryDiagnostics::getAliveObjectsCount() const
{
    const auto objectsCount = _gc.getAliveObjectsCount();
    return new Number{static_cast<double>(objectsCount)};
}

Number* MemoryDiagnostics::getDeletedObjectsCount() const
{
    return new Number(static_cast<double>(_storage->getDeletedObjectsCount()));
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
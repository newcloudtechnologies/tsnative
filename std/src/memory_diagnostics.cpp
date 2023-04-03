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

#include "std/memory_diagnostics.h"

#include "std/tsnumber.h"
#include "std/tsstring.h"

#include "std/private/memory_management/igc_impl.h"

#include "std/private/logger.h"
#include "std/private/memory_management/memory_diagnostics_storage.h"

MemoryDiagnostics::MemoryDiagnostics(MemoryDiagnosticsStorage& diagnosticPimpl, const IGCImpl& gc)
    : _diagnosticPimpl(diagnosticPimpl)
    , _gc{gc}
{
    LOG_ADDRESS("Calling MemoryDiagnostics ctor this = ", this);
}

Number* MemoryDiagnostics::getAliveObjectsCount() const
{
    const auto objectsCount = _gc.getAliveObjectsCount();
    LOG_INFO("Current alive objects: " + std::to_string(objectsCount));

    return new Number{static_cast<double>(objectsCount)};
}

Number* MemoryDiagnostics::getDeletedObjectsCount() const
{
    return new Number(static_cast<double>(_diagnosticPimpl.getDeletedObjectsCount()));
}

String* MemoryDiagnostics::toString() const
{
    return new String("Global memory diagnostics object");
}

Boolean* MemoryDiagnostics::toBool() const
{
    return new Boolean(getAliveObjectsCount()->unboxed() != 0);
}

void MemoryDiagnostics::printGCState() const
{
    _gc.print();
}

void MemoryDiagnostics::onDeleted(const void* el)
{
    _diagnosticPimpl.onDeleted(el);
}

void MemoryDiagnostics::onObjectAllocated(const void* el, Size size)
{
    _diagnosticPimpl.onObjectAllocated(el, size);
}

MemoryDiagnostics::Size MemoryDiagnostics::getCurrentAllocatedBytes() const
{
    return _diagnosticPimpl.getCurrentAllocatedBytes();
}
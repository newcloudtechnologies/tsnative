/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "std/diagnostics.h"

#include "std/memory_diagnostics.h"
#include "std/private/memory_diagnostics_storage.h"

#include "std/private/logger.h"

Diagnostics::Diagnostics(const IGCImpl& gcImpl, const MemoryDiagnosticsStorage& memoryDiagnosticsStorage)
    : _gcImpl{gcImpl}
    , _memoryDiagnosticsStorage{std::move(memoryDiagnosticsStorage)}
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
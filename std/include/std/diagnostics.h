#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <memory>

TS_CODE("import { MemoryDiagnostics } from './memory_diagnostics' \n");

class MemoryDiagnostics;
class MemoryDiagnosticsStorage;
class IGCImpl;

class TS_EXPORT TS_DECLARE Diagnostics : public Object
{
public:
    Diagnostics(const IGCImpl& gcImpl, const MemoryDiagnosticsStorage& memoryDiagnosticsStorage);

    TS_METHOD MemoryDiagnostics* getMemoryDiagnostics() const;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

private:
    const IGCImpl& _gcImpl;
    const MemoryDiagnosticsStorage& _memoryDiagnosticsStorage;
};

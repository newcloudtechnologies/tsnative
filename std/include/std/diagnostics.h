#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <memory>

TS_CODE("import { MemoryDiagnostics } from './memory_diagnostics' \n");

class MemoryDiagnostics;

class TS_EXPORT TS_DECLARE Diagnostics : public Object
{
public:
    Diagnostics(std::unique_ptr<MemoryDiagnostics> memoryDiagnostics);

    TS_METHOD MemoryDiagnostics* getMemoryDiagnostics() const;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

private:
    std::unique_ptr<MemoryDiagnostics> _memoryDiagnostics;
};

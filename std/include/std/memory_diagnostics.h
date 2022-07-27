#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <memory>

class Number;
class MemoryDiagnosticsStorage;
class IGCImpl;

class TS_EXPORT TS_DECLARE MemoryDiagnostics : public Object
{
public:
    MemoryDiagnostics(std::unique_ptr<MemoryDiagnosticsStorage> storage, const IGCImpl& gc);

    TS_METHOD Number* getAliveObjectsCount() const;
    TS_METHOD Number* getDeletedObjectsCount() const;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

private:
    std::unique_ptr<MemoryDiagnosticsStorage> _storage;
    const IGCImpl& _gc;
};

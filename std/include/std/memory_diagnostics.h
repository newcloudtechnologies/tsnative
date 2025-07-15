#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <cstdint>
#include <memory>

class Number;
class MemoryDiagnosticsStorage;
class IGCImpl;

class TS_EXPORT TS_DECLARE MemoryDiagnostics : public Object
{
public:
    using Size = uint64_t;

    MemoryDiagnostics(MemoryDiagnosticsStorage& diagnosticPimpl, const IGCImpl& gc);

    TS_METHOD Number* getAliveObjectsCount() const;
    TS_METHOD Number* getDeletedObjectsCount() const;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

    TS_METHOD void printGCState() const;

    void onDeleted(const void* el);

    void onObjectAllocated(const void* el, Size size);

    Size getCurrentAllocatedBytes() const;

private:
    MemoryDiagnosticsStorage& _diagnosticPimpl;
    const IGCImpl& _gc;
};

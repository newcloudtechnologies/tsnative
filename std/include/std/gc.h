#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <cstdint>

class IGCImpl;
class MemoryManager;

class TS_EXPORT TS_DECLARE GC : public Object
{
public:
    // gcImpl can be nullptr if Runtime::destroy was called and user code contains references to GC
    // same for allocator in the future?
    GC(IGCImpl* gcImpl, MemoryManager* memManager);

    // TODO Should be removed. Allocator should allocate, not GC
    TS_METHOD TS_NO_CHECK TS_SIGNATURE("allocate(numBytes: any): void") void* allocate(double numBytes);
    TS_METHOD TS_NO_CHECK TS_SIGNATURE("allocateObject(numBytes: any): void") void* allocateObject(double numBytes);
    TS_METHOD void collect();

    TS_METHOD TS_SIGNATURE("addRoot(root: any, associatedName: Object): void") void addRoot(void** root,
                                                                                            void* associatedName);
    TS_METHOD TS_SIGNATURE("removeRoot(void): void") void removeRoot(void** root);

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

    TS_METHOD void saveMemoryGraph() const;

    void addRootWithName(Object** root, const char* name);

private:
    IGCImpl* _gcImpl;
    MemoryManager* _memManager;
};

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

#pragma once

#include <cstdint>
#include <memory>

#include "std/tsobject.h"

class Allocator;
class MemoryDiagnostics;
class IGCImpl;
class GC;
class MemoryCleaner;
class MemoryDiagnosticsStorage;
class IGCValidator;

class MemoryManager final
{
public:
    MemoryManager(std::unique_ptr<Allocator>&& allocator,
                  std::unique_ptr<MemoryCleaner>&& cleaner,
                  std::unique_ptr<IGCImpl>&& gc,
                  std::unique_ptr<MemoryDiagnosticsStorage>&& memoryDiagnostics,
                  std::unique_ptr<IGCValidator>&& gcValidator);
    ~MemoryManager();

    void* allocateMemoryForObject(std::size_t size);

    void* allocate(std::size_t n);

    void onObjectAboutToDelete(void* ptr);

    GC* getGC();

    MemoryDiagnostics* getMemoryDiagnostics() const;

    const IGCValidator* getGCValidator() const;

private:
    bool needToFreeMemory() const;

    void onAfterMemoryClean();

private:
    std::unique_ptr<Allocator> _allocator;
    std::unique_ptr<IGCImpl> _gc;
    std::unique_ptr<MemoryDiagnosticsStorage> _memoryDiagnosticPimpl;
    std::unique_ptr<MemoryCleaner> _memoryCleaner;
    std::unique_ptr<IGCValidator> _gcValidator;

    uint64_t _memoryThreshold;
};

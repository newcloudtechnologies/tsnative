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

#include "std/private/memory_management/memory_manager.h"

#include "std/private/logger.h"
#include "std/private/memory_management/allocator.h"
#include "std/private/memory_management/igc_impl.h"
#include "std/private/memory_management/igc_validator.h"
#include "std/private/memory_management/memory_cleaner.h"
#include "std/private/memory_management/memory_diagnostics_storage.h"

#include "std/gc.h"
#include "std/memory_diagnostics.h"

constexpr const auto g_DefaultMemoryLimitBytes = MEMORY_LIMIT_KB * 1000;
constexpr const auto g_loadFactor = 0.85;
constexpr const auto g_multipleFactor = 2;

MemoryManager::MemoryManager(std::unique_ptr<Allocator>&& allocator,
                             std::unique_ptr<MemoryCleaner>&& cleaner,
                             std::unique_ptr<IGCImpl>&& gc,
                             std::unique_ptr<MemoryDiagnosticsStorage>&& memoryDiagnostics,
                             std::unique_ptr<IGCValidator>&& gcValidator)
    : _allocator(std::move(allocator))
    , _memoryCleaner(std::move(cleaner))
    , _gc(std::move(gc))
    , _memoryDiagnosticPimpl(std::move(memoryDiagnostics))
    , _memoryThreshold(g_DefaultMemoryLimitBytes)
    , _gcValidator(std::move(gcValidator))
{
    LOG_INFO("Memory limit is " + std::to_string(_memoryThreshold) + " bytes");
}

MemoryManager::~MemoryManager()
{
    _gc.reset();
}

void* MemoryManager::allocateMemoryForObject(std::size_t size)
{
    auto* ptr = _allocator->allocateObject(size);
    _memoryDiagnosticPimpl->onObjectAllocated(ptr, size);
    _gc->addObject(Object::asObjectPtr(ptr));

    if (needToFreeMemory())
    {
        if (!_memoryCleaner->isCollectScheduled())
            LOG_INFO("Need to free memory. Memory threshold " + std::to_string(_memoryThreshold) +
                     ", currently memory consumption " +
                     std::to_string(_memoryDiagnosticPimpl->getCurrentAllocatedBytes()) + " bytes");

        _memoryCleaner->asyncClear([this]() { onAfterMemoryClean(); });
    }

    return ptr;
}

void* MemoryManager::allocate(std::size_t n)
{
    return _allocator->allocate(n);
}

MemoryDiagnostics* MemoryManager::getMemoryDiagnostics() const
{
    return new MemoryDiagnostics(*_memoryDiagnosticPimpl.get(), *_gc.get());
}

GC* MemoryManager::getGC()
{
    return new GC{_gc.get(), this};
}

void MemoryManager::onObjectAboutToDelete(void* ptr)
{
    if (_gcValidator)
    {
        _gcValidator->onObjectAboutToDelete(ptr);
    }
}

const IGCValidator* MemoryManager::getGCValidator() const
{
    return _gcValidator.get();
}

bool MemoryManager::needToFreeMemory() const
{
    return _memoryDiagnosticPimpl->getCurrentAllocatedBytes() > _memoryThreshold * g_loadFactor;
}

void MemoryManager::onAfterMemoryClean()
{
    LOG_INFO("After clean up. Current memory consumption: " +
             std::to_string(_memoryDiagnosticPimpl->getCurrentAllocatedBytes()) + " bytes");

    if (needToFreeMemory())
    {
        _memoryThreshold *= g_multipleFactor;
        LOG_INFO("Memory is still insufficient. Increasing the memory threshold to " +
                 std::to_string(_memoryThreshold));
    }
}

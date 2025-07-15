#include "std/private/memory_management/mem_manager_creator.h"
#include "std/private/memory_management/allocator.h"
#include "std/private/memory_management/default_gc.h"
#include "std/private/memory_management/gc_validator.h"
#include "std/private/memory_management/memory_cleaner.h"
#include "std/private/memory_management/memory_diagnostics_storage.h"
#include "std/private/memory_management/memory_manager.h"

std::unique_ptr<MemoryManager> createMemoryManager(TimerStorage& storage, IEventLoop* loop)
{
    auto allocator = std::make_unique<Allocator>();
    auto memStorage = std::make_unique<MemoryDiagnosticsStorage>();

    DefaultGC::Callbacks gcCallbacks;
    gcCallbacks.deleteObject = [alloc = allocator.get(), storage = memStorage.get()](void* o)
    {
        storage->onDeleted(o);
        alloc->deallocateObject(Object::asObjectPtr(o));
    };

    auto gc = std::make_unique<DefaultGC>(storage, std::move(gcCallbacks));

    std::unique_ptr<IGCValidator> gcValidator;
#ifdef VALIDATE_GC
    gcValidator.reset(new GCValidator(gc->getHeap(), gc->getRoots(), gc->getMarked()));
#endif

    auto cleaner = std::make_unique<MemoryCleaner>(*loop, *gc.get(), gcValidator.get());

    return std::make_unique<MemoryManager>(
        std::move(allocator), std::move(cleaner), std::move(gc), std::move(memStorage), std::move(gcValidator));
}
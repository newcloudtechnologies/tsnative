#pragma once

#include <TS.h>

#include "std/igc_impl.h"

#include <unordered_set>
#include <functional>
#include <mutex>

class Object;
class IMemoryDiagnosticsImpl;

class DefaultGC : public IGCImpl
{
public:
    struct Callbacks final
    {
        std::function<void(const Object&)> beforeDeleted = [](const Object&){};
        std::function<void(const void*)> afterDeleted = [](const void*){};
    };

    DefaultGC(Callbacks&& callbacks);
    ~DefaultGC();
    
    void addObject(Object* o);

    std::size_t getAliveObjectsCount() const override;
    
    void addRoot(Object* object) override;
    void removeRoot(Object* object) override;

    void collect() override;

    void untrackIfObject(void* mem);

private:
    void mark();
    void sweep();

private:
    std::mutex _rootsMutex;
    std::mutex _heapMutex;

    // TODO Use absl::uset
    std::unordered_set<Object*> _heap;
    std::unordered_set<Object*> _roots;
    Callbacks _callbacks;
};

#pragma once

#include <TS.h>

#include "std/igc_impl.h"

#include <unordered_map>
#include <unordered_set>
#include <functional>
#include <stack>

class Object;
class IMemoryDiagnosticsImpl;
class ICallStack;

class DefaultGC : public IGCImpl
{
public:
    struct Callbacks final
    {
        std::function<void(const Object&)> beforeDeleted = [](const Object&){};
        std::function<void(const void*)> afterDeleted = [](const void*){};
    };

    DefaultGC(const ICallStack& callStack, Callbacks&& callbacks);
    ~DefaultGC();
    
    void addObject(Object* o);

    std::size_t getAliveObjectsCount() const override;
    
    void onScopeOpened(ScopeHandle handle);
    void beforeScopeClosed(ScopeHandle handle);

    void collect() override;

    void untrackIfObject(void* mem);

private:
    void collectEverything();
    
    void moveSideEffectAllocations(ScopeHandle from);
    void move(ScopeHandle from, ScopeHandle to, Object* what);
    void sweep(ScopeHandle handle);
    
private:
    using ScopeObjects = std::unordered_set<Object*>;
    std::unordered_map<ScopeHandle, ScopeObjects> _scopesVsObjects;
    std::unordered_map<Object*, ScopeHandle> _objectsVsScopes;

    std::unordered_set<ScopeHandle> _closedScopes;

    const ICallStack& _callStack;
    Callbacks _callbacks;
};

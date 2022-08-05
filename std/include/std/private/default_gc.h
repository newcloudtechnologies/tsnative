#pragma once

#include <TS.h>

#include "std/igc_impl.h"

#include <unordered_map>
#include <unordered_set>
#include <functional>
#include <stack>

class Object;
class IMemoryDiagnosticsImpl;

class DefaultGC : public IGCImpl
{
public:
    using ScopeHandle = std::size_t;

    struct Callbacks final
    {
        std::function<void(const Object&)> beforeDeleted = [](const Object&){};
        std::function<void(const void*)> afterDeleted = [](const void*){};
    };

    DefaultGC(Callbacks&& callbacks);
    ~DefaultGC();
    
    void addObject(Object* o);

    std::size_t getAliveObjectsCount() const override;
    
    void onScopeOpened(ScopeHandle handle) override;
    void onScopeClosed(ScopeHandle handle) override;

    void collect() override;

    void untrackIfObject(void* mem);

private:
    void mark(ScopeHandle handle);
    void sweep(ScopeHandle handle);
    ScopeHandle getCurrentScope() const;
    
private:
    using ScopeObjects = std::unordered_set<Object*>;
    std::unordered_map<ScopeHandle, ScopeObjects> _scopesVsObjects;

    std::unordered_set<ScopeHandle> _closedScopes;

    std::stack<ScopeHandle> _openedScopes;

    ScopeHandle _currentScope;

    Callbacks _callbacks;
};

#include "std/private/default_gc.h"

#include "std/tsobject.h"
#include "std/tsstring.h"

#include "std/private/logger.h"
#include "std/private/call_stack.h"

DefaultGC::DefaultGC(const ICallStack& callStack, Callbacks&& callbacks)
    : 
    _scopesVsObjects{},
    _objectsVsScopes{},
    _closedScopes{},
    _callStack{callStack},
    _callbacks{std::move(callbacks)}
{

}

DefaultGC::~DefaultGC()
{
    LOG_INFO("Calling GCImpl dtor");
    for (const auto entry : _scopesVsObjects)
    {
        const auto handle = entry.first;
        _closedScopes.insert(handle);
    }

    collect();
}

void DefaultGC::addObject(Object* o)
{
    LOG_ADDRESS("Calling add object ", o);
    if (!o)
    {
        throw std::runtime_error("GC: cannot add nullptr as object");
    }

    const auto currentScopeHandle = _callStack.getCurrentFrame().scopeHandle;
    auto scopeIt = _scopesVsObjects.find(_callStack.getCurrentFrame().scopeHandle);
    if (scopeIt == _scopesVsObjects.end())
    {
        throw std::runtime_error("Adding object to non existing scope");
    }

    auto& scopeHeap = scopeIt->second;
    scopeHeap.insert(o);

    _objectsVsScopes[o] = currentScopeHandle;
}

std::size_t DefaultGC::getAliveObjectsCount() const
{
    std::size_t result = 0;
    for (const auto& entry : _scopesVsObjects)
    {
        const auto handle = entry.first;
        const auto& scopeHeap = entry.second;
        result += scopeHeap.size();
    }
    return result;
}

void DefaultGC::moveSideEffectAllocations()
{
    LOG_INFO("Calling moveSideEffectAllocations");

    if (_callStack.size() < 2)
    {
        // If stack is empty of there is only global scope, do nothing
        return;
    }

    const auto& parentScopeHandle = _callStack.getParentFrame().scopeHandle;
    auto parentScopeIt = _scopesVsObjects.find(parentScopeHandle);
    if (parentScopeIt == _scopesVsObjects.end())
    {
        throw std::runtime_error("Parent scope not found while handling side effect allocations");
    }
    auto& parentScopeHeap = parentScopeIt->second;
    for (auto* obj : parentScopeHeap)
    {
        for (auto* child : obj->getChildren())
        {
            auto objVsScopeIt = _objectsVsScopes.find(child);
            if (objVsScopeIt == _objectsVsScopes.end())
            {
                throw std::runtime_error("Child object does not point to any scope");
            }

            const auto& currentChildScope = objVsScopeIt->second;
            move(currentChildScope, parentScopeHandle, child);
        }
    }
}

void DefaultGC::collect()
{
    for (const auto& handle : _closedScopes)
    {
        LOG_INFO("Started collect scope call for " + std::to_string(handle));
        sweep(handle);
        LOG_INFO("Finished collect scope call for " + std::to_string(handle));
    }

    _closedScopes.clear();
    LOG_INFO("Finished collect all closed scopes call");
}

void DefaultGC::sweep(ScopeHandle handle)
{
    auto scopeIt = _scopesVsObjects.find(handle);
    if (scopeIt == _scopesVsObjects.end())
    {
        throw std::runtime_error("Sweeping non existing scope");
    }

    auto& scopeHeap = scopeIt->second;
    for (auto* o : scopeHeap)
    {
        _callbacks.beforeDeleted(*o);

        auto objIt = _objectsVsScopes.find(o);
        if (objIt == _objectsVsScopes.end())
        {
            throw std::runtime_error("Object is not mapped to any scope");
        }

        LOG_ADDRESS("Calling object's dtor ", o);
        delete o;

        _objectsVsScopes.erase(objIt);

        _callbacks.afterDeleted(o);
    }

    _scopesVsObjects.erase(scopeIt);
}

void DefaultGC::move(ScopeHandle from, ScopeHandle to, Object* what)
{
    if (from == to)
    {
        return;
    }

    if (!what)
    {
        throw std::runtime_error("Attempt to move nullptr object between scopes");
    }

    auto fromIt = _scopesVsObjects.find(from);
    if (fromIt == _scopesVsObjects.end())
    {
        throw std::runtime_error("From scope does not exist");
    }

    if (_closedScopes.count(from) != 0)
    {
        throw std::runtime_error("From scope is closed");
    }

    auto toIt = _scopesVsObjects.find(to);
    if (toIt == _scopesVsObjects.end())
    {
        throw std::runtime_error("To scope does not exist");
    }

    if (_closedScopes.count(to) != 0)
    {
        throw std::runtime_error("To scope is closed");
    }

    auto& fromHeap = fromIt->second;
    auto fromObjectIt = fromHeap.find(what);
    if (fromObjectIt == fromHeap.end())
    {
        throw std::runtime_error("From does not contain object to move");
    }

    auto& toHeap = toIt->second;
    toHeap.insert(*fromObjectIt);

    fromHeap.erase(fromObjectIt);

    auto objVsScopeIt = _objectsVsScopes.find(what);
    if (objVsScopeIt == _objectsVsScopes.end())
    {
        throw std::runtime_error("Movable object not found in the obj -> scopes mapping");
    }

    LOG_ADDRESS_WITH_SUFFIX("Moving object ", what, " from " + std::to_string(from) + " to " + std::to_string(to));

    objVsScopeIt->second = to;

    for (auto* child : what->getChildren())
    {
        auto objVsScopeIt = _objectsVsScopes.find(child);
        if (objVsScopeIt == _objectsVsScopes.end())
        {
            throw std::runtime_error("Child object does not point to any scope");
        }

        const auto& currentChildScope = objVsScopeIt->second;
        move(currentChildScope, to, child);
    }
}

void DefaultGC::onScopeOpened(ScopeHandle handle)
{
    auto scopeIt = _scopesVsObjects.find(handle);
    if (scopeIt != _scopesVsObjects.end())
    {
        throw std::runtime_error("Opening existing scope");
    }

    LOG_INFO("Opened scope with handle " + std::to_string(handle));
    _scopesVsObjects[handle] = {};
}

void DefaultGC::beforeScopeClosed(ScopeHandle handle)
{
    auto scopeIt = _scopesVsObjects.find(handle);
    if (scopeIt == _scopesVsObjects.end())
    {
        throw std::runtime_error("Closing non-existing scope");
    }

    moveSideEffectAllocations();
    LOG_INFO("Closed scope with handle " + std::to_string(handle));
    _closedScopes.insert(handle);
}

void DefaultGC::untrackIfObject(void* mem)
{
    if (!mem)
    {
        return;
    }
    
    auto* maybeObject = (Object*)mem;

    auto scopeIt = _scopesVsObjects.find(_callStack.getCurrentFrame().scopeHandle);
    if (scopeIt == _scopesVsObjects.end())
    {
        throw std::runtime_error("Np opened scopes");
    }

    auto& scopeHeap = scopeIt->second;
    auto heapIt = scopeHeap.find(maybeObject);
    if (heapIt != scopeHeap.end())
    {
        LOG_ADDRESS("Untracking object ", maybeObject);
        scopeHeap.erase(heapIt);
    }

    auto objVsScopeIt = _objectsVsScopes.find(maybeObject);
    if (objVsScopeIt != _objectsVsScopes.end())
    {
        LOG_ADDRESS("Removing object from obj -> scope mapping", maybeObject);
        _objectsVsScopes.erase(objVsScopeIt);
    }
}
#include "std/private/default_gc.h"

#include "std/tsobject.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

DefaultGC::DefaultGC(Callbacks&& callbacks)
    : 
    _scopesVsObjects{},
    _closedScopes{},
    _openedScopes{},
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

    auto scopeIt = _scopesVsObjects.find(getCurrentScope());
    if (scopeIt == _scopesVsObjects.end())
    {
        throw std::runtime_error("Adding object to non existing scope");
    }

    auto& scopeHeap = scopeIt->second;
    scopeHeap.insert(o);
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

void DefaultGC::collect()
{
    for (const auto& handle : _closedScopes)
    {
        LOG_INFO("Started collect scope call for " + std::to_string(handle));
        LOG_INFO("Calling mark");
        mark(handle);
        LOG_INFO("Calling sweep");
        sweep(handle);
        LOG_INFO("Finished collect scope call for " + std::to_string(handle));
    }

    _closedScopes.clear();
    LOG_INFO("Finished collect all closed scopes call");
}

void DefaultGC::mark(ScopeHandle)
{
    // Everything is considered to be alive except closed scopes and their content
    // Roots will be needed if we want to call collect in the middle of scope processing
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

        LOG_ADDRESS("Calling object's dtor ", o);
        delete o;

        _callbacks.afterDeleted(o);
    }

    _scopesVsObjects.erase(scopeIt);
}

void DefaultGC::onScopeOpened(ScopeHandle handle)
{
    auto scopeIt = _scopesVsObjects.find(handle);
    if (scopeIt != _scopesVsObjects.end())
    {
        throw std::runtime_error("Opening existing scope");
    }

    _openedScopes.push(handle);
    LOG_INFO("Opened scope with handle " + std::to_string(handle));
    _scopesVsObjects[handle] = {};
}

auto DefaultGC::getCurrentScope() const -> ScopeHandle
{
    if (_openedScopes.empty())
    {
        throw std::runtime_error("No opened scopes on the stack");
    }

    return _openedScopes.top();
}

void DefaultGC::onScopeClosed(ScopeHandle handle)
{
    auto scopeIt = _scopesVsObjects.find(handle);
    if (scopeIt == _scopesVsObjects.end())
    {
        throw std::runtime_error("Closing non-existing scope");
    }

    LOG_INFO("Closed scope with handle " + std::to_string(handle));
    _closedScopes.insert(handle);

    if (_openedScopes.empty())
    {
        throw std::runtime_error("No opened scopes on the stack");
    }
    _openedScopes.pop();
}

void DefaultGC::untrackIfObject(void* mem)
{
    if (!mem)
    {
        return;
    }
    
    auto* maybeObject = (Object*)mem;

    auto scopeIt = _scopesVsObjects.find(getCurrentScope());
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
}
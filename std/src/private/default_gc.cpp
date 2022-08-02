#include "std/private/default_gc.h"

#include "std/tsobject.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

DefaultGC::DefaultGC(Callbacks&& callbacks)
    : _rootsMutex{},
    _heapMutex{},
    _heap{},
    _roots{},
    _callbacks{std::move(callbacks)}
{

}

DefaultGC::~DefaultGC()
{
    _roots.clear();
    collect();
}

void DefaultGC::addObject(Object* o)
{
    const std::lock_guard<std::mutex> lock{_heapMutex};
    LOG_ADDRESS("Calling add object ", o);
    if (!o)
    {
        throw std::runtime_error("GC: cannot add nullptr as object");
    }

    _heap.insert(o);
}

std::size_t DefaultGC::getAliveObjectsCount() const
{
    return _heap.size();
}

void DefaultGC::addRoot(Object* o)
{
    if (!o)
    {
        throw std::runtime_error("GC: root cannot be nullptr");
    }

    std::lock_guard<std::mutex> rootsLock(_rootsMutex);

    LOG_ADDRESS("Adding root: ", o);

    _roots.insert(o);
}

void DefaultGC::removeRoot(Object* o)
{
    if (!o)
    {
        throw std::runtime_error("GC: root cannot be nullptr");
    }
    auto it = _roots.find(o);
    if (it == _roots.cend())
    {
        return;
    }

    LOG_ADDRESS("Removing root: ", o);
    std::lock_guard<std::mutex> rootsLock(_rootsMutex);
    _roots.erase(it);
}

void DefaultGC::collect()
{
    std::lock(_heapMutex, _rootsMutex);
    std::lock_guard<std::mutex> heapLock(_heapMutex, std::adopt_lock);
    std::lock_guard<std::mutex> rootsLock(_rootsMutex, std::adopt_lock);

    LOG_INFO("Calling mark");
    mark();
    LOG_INFO("Calling sweep");
    sweep();
    LOG_INFO("Finished collect call");
}

void DefaultGC::mark()
{
    for (auto* r : _roots)
    {
        LOG_ADDRESS("Marking root: ", r);
        if (r && !r->isMarked()) 
        {
            r->mark();
        }
    }
}

void DefaultGC::sweep()
{
    auto it = _heap.cbegin();
    while (it != _heap.cend()) 
    {
        auto* object = (*it);

        if (object->isMarked()) 
        {
            LOG_ADDRESS("Marked object, continue ", object);
            object->unmark();
            ++it;
            continue;
        }

        _callbacks.beforeDeleted(*object);

        LOG_ADDRESS("Calling object's dtor ", object);
        delete object;
        _callbacks.afterDeleted(object);
        it = _heap.erase(it);
    }
}

void DefaultGC::untrackIfObject(void* mem)
{
    if (!mem)
    {
        return;
    }
    
    std::lock(_heapMutex, _rootsMutex);
    std::lock_guard<std::mutex> heapLock(_heapMutex, std::adopt_lock);
    std::lock_guard<std::mutex> rootsLock(_rootsMutex, std::adopt_lock);

    auto* maybeObject = (Object*)mem;

    auto heapIt = _heap.find(maybeObject);
    if (heapIt != _heap.end())
    {
        LOG_ADDRESS("Untracking object ", maybeObject);
        _heap.erase(heapIt);
    }

    auto rootIt = _roots.find(maybeObject);
    if (rootIt != _roots.end())
    {
        LOG_ADDRESS("Untracking root ", maybeObject);
        _roots.erase(rootIt);
    }
}
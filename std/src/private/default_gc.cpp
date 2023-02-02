/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "std/private/default_gc.h"

#include "std/tsobject.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

#include "std/private/gc_printer.h"

DefaultGC::DefaultGC(Callbacks&& callbacks)
    : _rootsMutex{}
    , _heapMutex{}
    , _heap{}
    , _roots{}
    , _names{}
    , _callbacks{std::move(callbacks)}
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

void DefaultGC::addRoot(Object** o, const String* associatedName)
{
    if (!o)
    {
        throw std::runtime_error("GC: root cannot be nullptr");
    }

    std::lock_guard<std::mutex> rootsLock(_rootsMutex);
    LOG_ADDRESS("Adding root: ", o);
    _roots.insert(o);
    _names.push_back({o, associatedName});
}

void DefaultGC::removeRoot(Object** o)
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

    std::lock_guard<std::mutex> rootsLock(_rootsMutex);
    LOG_ADDRESS("Removing root: ", o);
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
    for (auto** r : _roots)
    {
        if (r && *r && !(*r)->isMarked())
        {
            LOG_ADDRESS("Marking root: ", r);
            (*r)->mark();
        }
    }
}

void DefaultGC::sweep()
{
    auto it = _heap.cbegin();
    while (it != _heap.cend())
    {
        auto* object = (*it);
        LOG_ADDRESS("Sweeping object ", object);

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

void DefaultGC::print() const
{
#ifdef ENABLE_GC_LOGS
    GCPrinter{_heap, _roots, _names}.print();
#endif // ENABLE_GC_LOGS
}
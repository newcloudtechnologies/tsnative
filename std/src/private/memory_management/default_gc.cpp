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

#include "std/private/memory_management/default_gc.h"

#include "std/tsobject.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

#include "std/private/memory_management/gc_printer.h"

#include <cassert>

DefaultGC::DefaultGC(TimerStorage& timers, Callbacks&& gcCallbacks)
    : _heap{}
    , _roots{}
    , _names{}
    , _callbacks(std::move(gcCallbacks))
    , _timers{timers}
{
}

DefaultGC::~DefaultGC()
{
    _roots.clear();
    collect();
}

void DefaultGC::addObject(Object* o)
{
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

void DefaultGC::addRoot(Object** o, const Object* associatedName)
{
    insertRoot(o);

    if (!associatedName)
    {
        return;
    }

    _names.setRootName(o, associatedName);
}

void DefaultGC::addRootWithName(Object** o, const char* name)
{
    insertRoot(o);
    _names.setCppRootName(o, name);
}

const DefaultGC::Heap& DefaultGC::getHeap() const
{
    return _heap;
}

const DefaultGC::Roots& DefaultGC::getRoots() const
{
    return _roots;
}

void DefaultGC::insertRoot(Object** o)
{
    LOG_METHOD_CALL;
    if (!o)
    {
        throw std::runtime_error("GC: root cannot be nullptr");
    }

    LOG_ADDRESS("Adding root: ", o);
    _roots.insert(o);
}

void DefaultGC::removeRoot(Object** o)
{
    LOG_METHOD_CALL;
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
    _roots.erase(it);
    _names.unsetRootName(o);
}

void DefaultGC::collect()
{
    LOG_METHOD_CALL;
    LOG_INFO("Calling mark");
    mark();
    LOG_INFO("Calling sweep");
    sweep();
    // sweep doesn't remove mark from TSObjectOwner-s . Need to remove it manually
    LOG_INFO("Unmark marked roots manually");
    unmarkRoots();
    LOG_INFO("Finished collect call");
}

void DefaultGC::mark()
{
    const auto isTimerReady = [](const TimerObject& t) { return !t.active(); };
    markStorage(_timers, isTimerReady);

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
    auto it = _heap.begin();
    while (it != _heap.end())
    {
        auto* object = (*it);
        LOG_ADDRESS("Try sweeping object ", object);

        if (object->isMarked())
        {
            LOG_ADDRESS("Marked object, continue ", object);
            object->unmark();

            ++it;
            continue;
        }

        LOG_ADDRESS("Calling object's dtor ", object);
        _callbacks.afterDelete(object);

        it = _heap.erase(it);
    }
}

void DefaultGC::unmarkRoots()
{
    for (auto** r : _roots)
    {
        if (r && *r && (*r)->isMarked())
        {
            LOG_ADDRESS("Unmark root manually: ", r);
            (*r)->unmark();
        }
    }
}

void DefaultGC::print(const std::string& fileName) const
{
#ifdef VALIDATE_GC
    GCPrinter{_heap, _roots, _names}.print(fileName);
#endif // VALIDATE_GC
}